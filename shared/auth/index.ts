// ─────────────────────────────────────────────────────────
// shared/auth/index.ts
// Helper for upstream services to read gateway context headers
// ─────────────────────────────────────────────────────────

import type { Request } from 'express';
import type { UserRole, Plan } from '../types';

export interface GatewayContext {
  userId:    string;
  tenantId:  string;
  role:      UserRole;
  plan:      Plan;
  email:     string;
  requestId: string;
  appKey:    string;
}

/**
 * Extract the gateway-injected user context from request headers.
 * Call this in any upstream service to get tenant/user info
 * without re-validating the JWT (gateway already did that).
 *
 * @example
 * app.get('/my-route', (req, res) => {
 *   const ctx = getGatewayContext(req);
 *   if (!ctx) return res.status(401).json({ error: 'Unauthorized' });
 *   // use ctx.tenantId, ctx.userId, ctx.plan...
 * });
 */
export function getGatewayContext(req: Request): GatewayContext | null {
  const tenantId = req.headers['x-tenant-id'] as string;
  const userId   = req.headers['x-user-id']   as string;

  if (!tenantId || !userId) return null;

  return {
    userId,
    tenantId,
    role:      (req.headers['x-user-role']  as UserRole) || 'member',
    plan:      (req.headers['x-user-plan']  as Plan)     || 'free',
    email:     (req.headers['x-user-email'] as string)   || '',
    requestId: (req.headers['x-request-id'] as string)   || '',
    appKey:    (req.headers['x-forwarded-app'] as string) || '',
  };
}

/**
 * Middleware that requires a valid gateway context.
 * Use in upstream services as a lightweight auth check.
 */
export function requireGatewayContext(
  req: Request,
  res: { status: (n: number) => { json: (b: object) => unknown } },
  next: () => void
): void {
  const ctx = getGatewayContext(req);
  if (!ctx) {
    res.status(401).json({ error: 'Missing gateway context — route through gateway' });
    return;
  }
  (req as Request & { gatewayCtx: GatewayContext }).gatewayCtx = ctx;
  next();
}

/**
 * Check if user's plan meets the required minimum plan.
 */
export function hasPlanAccess(userPlan: Plan, requiredPlan: Plan): boolean {
  const planOrder: Plan[] = ['free', 'pro'];
  return planOrder.indexOf(userPlan) >= planOrder.indexOf(requiredPlan);
}
