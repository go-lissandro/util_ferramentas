import { Express, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { authenticate, requireAppAccess } from '../middleware/auth';
import { logger } from '../utils/logger';

interface AppConfig {
  key: string;
  pathPrefix: string;
  target: string;
  protected: boolean;
  requiredPlan?: string[];
  description: string;
}

// ── Registered apps registry ────────────────────────────
// To add a new app: add an entry here + set env var
export const APP_REGISTRY: AppConfig[] = [
  {
    key: 'app1',
    pathPrefix: '/app1',
    target: process.env.APP1_DASHBOARD_URL || 'http://localhost:5173',
    protected: false,        // auth handled inside app1 itself
    description: 'Admin Dashboard',
  },
  {
    key: 'app2',
    pathPrefix: '/app2',
    target: process.env.APP2_URLSHORTENER_URL || 'http://localhost:4001',
    protected: true,
    requiredPlan: ['free', 'pro'],
    description: 'URL Shortener',
  },
];

function buildProxyOptions(app: AppConfig): Options {
  return {
    target: app.target,
    changeOrigin: true,
    pathRewrite: (path) => path.replace(new RegExp(`^${app.pathPrefix}`), ''),
    on: {
      proxyReq: (proxyReq, req: Request) => {
        // Forward user context headers to upstream services
        if (req.user) {
          proxyReq.setHeader('X-User-ID', req.user.sub);
          proxyReq.setHeader('X-Tenant-ID', req.user.tenantId);
          proxyReq.setHeader('X-User-Role', req.user.role);
          proxyReq.setHeader('X-User-Plan', req.user.plan);
          proxyReq.setHeader('X-User-Email', req.user.email);
        }

        const requestId = (req.headers['x-request-id'] as string) || '';
        proxyReq.setHeader('X-Request-ID', requestId);
        proxyReq.setHeader('X-Forwarded-App', app.key);
      },
      error: (err, _req, res) => {
        logger.error({ err, app: app.key }, `Proxy error for ${app.key}`);
        const httpRes = res as Response;
        if (!httpRes.headersSent) {
          httpRes.status(502).json({
            success: false,
            error: `Service ${app.description} is temporarily unavailable`,
            code: 'UPSTREAM_ERROR',
          });
        }
      },
    },
  };
}

export function setupProxy(app: Express): void {
  for (const appConfig of APP_REGISTRY) {
    const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [];

    // ── Apply auth middleware if app is protected ─────────
    if (appConfig.protected) {
      middlewares.push(authenticate);
      middlewares.push(requireAppAccess(appConfig.key));
    }

    // ── Mount the proxy ────────────────────────────────────
    const proxy = createProxyMiddleware(buildProxyOptions(appConfig));

    app.use(
      appConfig.pathPrefix,
      ...middlewares,
      proxy as unknown as (req: Request, res: Response, next: NextFunction) => void
    );

    logger.info(
      `🔁 Proxy: ${appConfig.pathPrefix} → ${appConfig.target} [${appConfig.protected ? '🔒 protected' : '🔓 public'}]`
    );
  }
}
