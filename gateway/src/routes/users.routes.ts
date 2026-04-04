import { Router, Request, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { db } from '../config/database';
import { APP_REGISTRY } from '../proxy/proxyRouter';
import { AppError } from '../utils/AppError';

export const usersRouter = Router();

// All user routes require authentication
usersRouter.use(authenticate);

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

// ── GET /api/users/apps — get accessible apps ─────────
usersRouter.get('/apps', async (req: Request, res: Response) => {
  const permissions = await db.query<{ app_key: string; can_access: boolean }>(
    `SELECT app_key, can_access FROM app_permissions
     WHERE tenant_id = $1 AND (user_id = $2 OR user_id IS NULL)`,
    [req.user!.tenantId, req.user!.sub]
  );

  const permissionMap = new Map(
    permissions.map((p) => [p.app_key, p.can_access])
  );

  const apps = APP_REGISTRY.map((app) => ({
    key: app.key,
    description: app.description,
    path: app.pathPrefix,
    // Admin has access to all; others check permissions
    hasAccess:
      req.user!.role === 'admin' ||
      permissionMap.get(app.key) !== false,
  }));

  return res.json({ success: true, data: apps });
});

// ── POST /api/users/apps/:appKey/permissions ──────────
usersRouter.post(
  '/apps/:appKey/permissions',
  requireRole('admin'),
  async (req: Request, res: Response) => {
    const { appKey } = req.params;
    const { userId, canAccess } = req.body;

    await db.query(
      `INSERT INTO app_permissions (tenant_id, user_id, app_key, can_access)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tenant_id, user_id, app_key)
       DO UPDATE SET can_access = $4`,
      [req.user!.tenantId, userId, appKey, canAccess]
    );

    return res.json({ success: true, message: 'Permission updated' });
  }
);
