import { Router, Request, Response } from 'express';
import QRCode from 'qrcode';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import { logger } from '../utils/logger';
import { PAGINATION } from '../config/pagination';

// ── Reuse gateway DB pool ──────────────────────────────────
import { db } from '../config/database';

// ── Crypto-secure nanoid for short slugs ────────────────────
function nanoid(size = 7): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(size);
  let result = '';
  for (let i = 0; i < size; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

// ── Helper: get base URL ───────────────────────────────────
function getBaseUrl(req: Request): string {
  return process.env.BASE_URL
    || process.env.ALLOWED_ORIGINS?.split(',')[0]
    || `${req.protocol}://${req.get('host')}`;
}

const CreateLinkSchema = z.object({
  url:        z.string().url('Must be a valid URL'),
  title:      z.string().max(255).optional(),
  customSlug: z.string().regex(/^[a-zA-Z0-9_-]{3,20}$/).optional(),
  expiresAt:  z.string().datetime().optional(),
});

export const urlShortenerRouter = Router();

// ── GET /api/app2/links ─────────────────────────────────────
urlShortenerRouter.get('/links', async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Not authenticated' });

  const page   = Math.max(PAGINATION.DEFAULT_PAGE, parseInt(req.query.page as string) || 1);
  const limit  = Math.min(PAGINATION.URL_SHORTENER_MAX_LIMIT, parseInt(req.query.limit as string) || PAGINATION.DEFAULT_LIMIT);
  const offset = (page - 1) * limit;

  const [links, total] = await Promise.all([
    db.query<{ id: string; slug: string; original_url: string; title: string; click_count: number; expires_at: string; is_active: boolean; created_at: string }>(
      `SELECT id, slug, original_url, title, click_count, expires_at, is_active, created_at
       FROM short_links WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    ),
    db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM short_links WHERE tenant_id = $1', [tenantId]),
  ]);

  const baseUrl = getBaseUrl(req);
  return res.json({
    success: true,
    data: links.map(l => ({ ...l, shortUrl: `${baseUrl}/r/${l.slug}` })),
    pagination: {
      page, limit,
      total: parseInt(total?.count || '0'),
      totalPages: Math.ceil(parseInt(total?.count || '0') / limit),
    },
  });
});

// ── POST /api/app2/links ────────────────────────────────────
urlShortenerRouter.post('/links', async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  const userId   = req.user?.sub;
  const plan     = req.user?.plan || 'free';
  if (!tenantId) return res.status(401).json({ error: 'Not authenticated' });

  if (plan === 'free') {
    const count = await db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM short_links
       WHERE tenant_id = $1 AND created_at >= date_trunc('month', NOW())`,
      [tenantId]
    );
    if (parseInt(count?.count || '0') >= 50) {
      return res.status(429).json({ error: 'Monthly limit of 50 links reached on Free plan', code: 'PLAN_LIMIT_EXCEEDED' });
    }
  }

  const body = CreateLinkSchema.safeParse(req.body);
  if (!body.success) return res.status(400).json({ error: body.error.errors[0].message });

  const { url, title, customSlug, expiresAt } = body.data;
  const slug = customSlug || nanoid(7);

  try {
    const [link] = await db.query(
      `INSERT INTO short_links (tenant_id, user_id, slug, original_url, title, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [tenantId, userId || null, slug, url, title || null, expiresAt || null]
    );
    const baseUrl = getBaseUrl(req);
    return res.status(201).json({ success: true, data: { ...link, shortUrl: `${baseUrl}/r/${slug}` } });
  } catch (err: unknown) {
    if ((err as { code?: string }).code === '23505') {
      return res.status(409).json({ error: 'That custom slug is already taken' });
    }
    logger.error('Error creating short link: ' + (err as Error).message);
    throw err;
  }
});

// ── GET /api/app2/links/:id/analytics ──────────────────────
urlShortenerRouter.get('/links/:id/analytics', async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Not authenticated' });

  const link = await db.queryOne('SELECT * FROM short_links WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
  if (!link) return res.status(404).json({ error: 'Link not found' });

  const clicks = await db.query(
    `SELECT date_trunc('day', clicked_at) as day, COUNT(*) as count
     FROM link_clicks WHERE link_id = $1
     GROUP BY day ORDER BY day DESC LIMIT 30`,
    [req.params.id]
  );

  return res.json({ success: true, data: { link, clicks, totalClicks: (link as { click_count: number }).click_count } });
});

// ── GET /api/app2/links/:id/qr ──────────────────────────────
urlShortenerRouter.get('/links/:id/qr', async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Not authenticated' });

  const link = await db.queryOne<{ slug: string }>('SELECT slug FROM short_links WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
  if (!link) return res.status(404).json({ error: 'Link not found' });

  const baseUrl = getBaseUrl(req);
  const shortUrl = `${baseUrl}/r/${link.slug}`;
  const qr = await QRCode.toDataURL(shortUrl, { width: 300, margin: 2 });

  return res.json({ success: true, data: { qr, shortUrl } });
});

// ── DELETE /api/app2/links/:id ──────────────────────────────
urlShortenerRouter.delete('/links/:id', async (req: Request, res: Response) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) return res.status(401).json({ error: 'Not authenticated' });
  await db.query('DELETE FROM short_links WHERE id = $1 AND tenant_id = $2', [req.params.id, tenantId]);
  return res.json({ success: true });
});

// ── DB migrations (tables now created in database.ts) ──────────────
export async function migrateUrlShortener(): Promise<void> {
  // Tables are now created in database.ts runMigrations()
  logger.info('✅ URL Shortener migration check (tables in database.ts)');
}


export const redirectRouter = Router();

redirectRouter.get('/r/:slug', async (req: Request, res: Response) => {
  const link = await db.queryOne<{
    id: string; original_url: string; expires_at: string;
    is_active: boolean; tenant_id: string;
  }>('SELECT id, original_url, expires_at, is_active, tenant_id FROM short_links WHERE slug = $1', [req.params.slug]);

  if (!link || !link.is_active) return res.status(404).send('Link not found');
  if (link.expires_at && new Date(link.expires_at) < new Date()) return res.status(410).send('Link expired');

  // Track click asynchronously but with proper error logging
  setImmediate(async () => {
    try {
      await db.query('UPDATE short_links SET click_count = click_count + 1 WHERE id = $1', [link.id]);
      await db.query(
        'INSERT INTO link_clicks (link_id, tenant_id, referrer, user_agent) VALUES ($1, $2, $3, $4)',
        [link.id, link.tenant_id, req.headers.referer || null, req.headers['user-agent'] || null]
      );
    } catch (err) {
      logger.error('Failed to track link click', { linkId: link.id, error: (err as Error).message });
    }
  });

  return res.redirect(301, link.original_url);
});
