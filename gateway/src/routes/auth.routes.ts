import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../config/database';
import { generateTokens, authenticate } from '../middleware/auth';
import { AppError } from '../utils/AppError';

export const authRouter = Router();

const LoginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

// ── POST /api/auth/login ──────────────────────────────────
// Registration is CLOSED — accounts are created only after admin approval
authRouter.post('/login', async (req: Request, res: Response) => {
  const body = LoginSchema.safeParse(req.body);
  if (!body.success) throw new AppError(body.error.errors[0].message, 400, 'VALIDATION_ERROR');

  const { email, password } = body.data;

  const user = await db.queryOne<{
    id: string; password_hash: string; name: string;
    role: string; is_active: boolean; tenant_id: string;
  }>('SELECT u.id, u.password_hash, u.name, u.role, u.is_active, u.tenant_id FROM users u WHERE u.email = $1', [email]);

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    throw new AppError('Email ou senha incorretos', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.is_active) {
    throw new AppError('Conta desativada. Entre em contato com o suporte.', 403, 'ACCOUNT_DISABLED');
  }

  const tenant = await db.queryOne<{ plan: string; slug: string; is_active: boolean }>(
    'SELECT plan, slug, is_active FROM tenants WHERE id = $1', [user.tenant_id]
  );

  if (!tenant?.is_active) {
    throw new AppError('Workspace desativado.', 403, 'TENANT_DISABLED');
  }

  await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

  const tokens = generateTokens({
    sub: user.id, tenantId: user.tenant_id,
    email, role: user.role, plan: tenant.plan,
  });

  return res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email, role: user.role },
      tenant: { id: user.tenant_id, slug: tenant.slug, plan: tenant.plan },
      ...tokens,
    },
  });
});

// ── GET /api/auth/me ───────────────────────────────────────
authRouter.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await db.queryOne<{ id: string; name: string; email: string; role: string; created_at: string }>(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1', [req.user!.sub]
  );
  if (!user) throw new AppError('Usuário não encontrado', 404, 'NOT_FOUND');

  const tenant = await db.queryOne<{ id: string; name: string; slug: string; plan: string }>(
    'SELECT id, name, slug, plan FROM tenants WHERE id = $1', [req.user!.tenantId]
  );

  // Get plan app permissions
  const planApps = await db.query<{ app_key: string; can_access: boolean }>(
    'SELECT app_key, can_access FROM plan_apps WHERE plan = $1', [tenant?.plan || 'free']
  );

  // Check for per-tenant overrides
  const overrides = await db.query<{ app_key: string; can_access: boolean }>(
    'SELECT app_key, can_access FROM app_permissions WHERE tenant_id = $1', [req.user!.tenantId]
  );

  const appAccess: Record<string, boolean> = {};
  for (const a of planApps) appAccess[a.app_key] = a.can_access;
  for (const o of overrides) appAccess[o.app_key] = o.can_access; // overrides win

  return res.json({ success: true, data: { user, tenant, appAccess } });
});

// ── POST /api/auth/logout ─────────────────────────────────
authRouter.post('/logout', authenticate, async (_req: Request, res: Response) => {
  return res.json({ success: true });
});
