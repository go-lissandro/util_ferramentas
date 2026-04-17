import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { db } from '../config/database';
import { APP_REGISTRY } from '../proxy/proxyRouter';
import { AppError } from '../utils/AppError';

export const usersRouter = Router();

usersRouter.use(authenticate);

// ── GET /api/users — list tenant users (admin only) ───
usersRouter.get('/', requireRole('admin'), async (req: Request, res: Response) => {
  const users = await db.query(
    `SELECT id, name, email, role, is_active, last_login_at, created_at
     FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`,
    [req.user!.tenantId]
  );
  return res.json({ success: true, data: users });
});

// ── PATCH /api/users/:id/role ─────────────────────────
usersRouter.patch('/:id/role', requireRole('admin'), async (req: Request, res: Response) => {
  const { role } = req.body;
  if (!['admin', 'member'].includes(role)) throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
  await db.query(`UPDATE users SET role = $1 WHERE id = $2 AND tenant_id = $3`,
    [role, req.params.id, req.user!.tenantId]);
  return res.json({ success: true });
});

// ── GET /api/users/apps ───────────────────────────────
usersRouter.get('/apps', async (req: Request, res: Response) => {
  const plan = req.user!.plan || 'free';

  // Get plan permissions
  const planApps = await db.query<{ app_key: string; can_access: boolean }>(
    'SELECT app_key, can_access FROM plan_apps WHERE plan = $1', [plan]
  );

  // Get per-tenant overrides
  const overrides = await db.query<{ app_key: string; can_access: boolean }>(
    'SELECT app_key, can_access FROM app_permissions WHERE tenant_id = $1', [req.user!.tenantId]
  );

  const accessMap = new Map<string, boolean>();
  for (const p of planApps) accessMap.set(p.app_key, p.can_access);
  for (const o of overrides) accessMap.set(o.app_key, o.can_access);

  const apps = APP_REGISTRY.map(app => ({
    key: app.key,
    description: app.description,
    path: app.pathPrefix,
    hasAccess: req.user!.role === 'admin'
      ? (accessMap.get(app.key) !== false)
      : (accessMap.get(app.key) === true),
  }));

  return res.json({ success: true, data: apps });
});

// ── GET /api/users/stats — real dashboard stats ───────
usersRouter.get('/stats', requireRole('admin'), async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  const [
    usersCount,
    shortLinksCount,
    shortLinksClicks,
    entitiesCount,
    recordsCount,
    bioPageViews,
    purchasesPending,
    purchasesApproved,
  ] = await Promise.all([
    db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM users WHERE tenant_id = $1', [tenantId]),
    db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM short_links WHERE tenant_id = $1', [tenantId])
      .catch(() => ({ count: '0' })),
    db.queryOne<{ total: string }>('SELECT COALESCE(SUM(click_count),0) as total FROM short_links WHERE tenant_id = $1', [tenantId])
      .catch(() => ({ total: '0' })),
    db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM entity_types WHERE tenant_id = $1', [tenantId])
      .catch(() => ({ count: '0' })),
    db.queryOne<{ count: string }>('SELECT COUNT(*) as count FROM entity_records WHERE tenant_id = $1', [tenantId])
      .catch(() => ({ count: '0' })),
    db.queryOne<{ total: string }>('SELECT COALESCE(SUM(total_views),0) as total FROM bio_pages WHERE tenant_id = $1', [tenantId])
      .catch(() => ({ total: '0' })),
    db.queryOne<{ count: string }>("SELECT COUNT(*) as count FROM purchase_requests WHERE status IN ('pending_payment','payment_sent')", [])
      .catch(() => ({ count: '0' })),
    db.queryOne<{ count: string }>("SELECT COUNT(*) as count FROM purchase_requests WHERE status = 'approved'", [])
      .catch(() => ({ count: '0' })),
  ]);

  // Activity chart — link clicks last 7 days
  const clicksChart = await db.query<{ day: string; clicks: string }>(
    `SELECT date_trunc('day', clicked_at)::date as day, COUNT(*) as clicks
     FROM link_clicks lc
     JOIN short_links sl ON sl.id = lc.link_id AND sl.tenant_id = $1
     WHERE lc.clicked_at >= NOW() - INTERVAL '7 days'
     GROUP BY day ORDER BY day`,
    [tenantId]
  ).catch(() => [] as { day: string; clicks: string }[]);

  return res.json({
    success: true,
    data: {
      users:         parseInt(usersCount?.count || '0'),
      shortLinks:    parseInt(shortLinksCount?.count || '0'),
      linkClicks:    parseInt(shortLinksClicks?.total || '0'),
      entities:      parseInt(entitiesCount?.count || '0'),
      records:       parseInt(recordsCount?.count || '0'),
      bioViews:      parseInt(bioPageViews?.total || '0'),
      purchasesPending: parseInt(purchasesPending?.count || '0'),
      purchasesApproved: parseInt(purchasesApproved?.count || '0'),
      clicksChart: clicksChart.map(r => ({
        day: new Date(r.day).toLocaleDateString('pt-BR', { weekday: 'short' }),
        clicks: parseInt(r.clicks),
      })),
    },
  });
});

// ── POST /api/users/apps/:appKey/permissions ──────────
usersRouter.post('/apps/:appKey/permissions', requireRole('admin'), async (req: Request, res: Response) => {
  const { appKey } = req.params;
  const { userId, canAccess } = req.body;
  await db.query(
    `INSERT INTO app_permissions (tenant_id, user_id, app_key, can_access)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (tenant_id, user_id, app_key) DO UPDATE SET can_access = $4`,
    [req.user!.tenantId, userId, appKey, canAccess]
  );
  return res.json({ success: true });
});

// ── GET /api/users — list tenant users (admin only) ───
usersRouter.get('/', requireRole('admin'), async (req: Request, res: Response) => {
  const users = await db.query(
    `SELECT id, name, email, role, is_active, last_login_at, created_at
     FROM users
     WHERE tenant_id = $1
     ORDER BY created_at DESC`,
    [req.user!.tenantId]
  );

  return res.json({ success: true, data: users });
});

// ── PATCH /api/users/:id/role ──────────────────────────
usersRouter.patch(
  '/:id/role',
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      throw new AppError('Invalid role', 400, 'VALIDATION_ERROR');
    }

    await db.query(
      `UPDATE users SET role = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [role, req.params.id, req.user!.tenantId]
    );

    return res.json({ success: true, message: 'Role updated' });
  }
);
