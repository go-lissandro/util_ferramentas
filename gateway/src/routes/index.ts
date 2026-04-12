import { Express } from 'express';
import { authRouter } from './auth.routes';
import { usersRouter } from './users.routes';
import { billingRouter, webhookRouter } from './billing.routes';
import { licenseAdminRouter, licensePublicRouter, licenseWebhookRouter } from './licenses.routes';
import { seoRouter } from './seo.routes';
import { checkoutRouter, adminCheckoutRouter } from './checkout.routes';

export function setupRoutes(app: Express): void {
  app.use(seoRouter);
  app.use(webhookRouter);
  app.use('/api/webhooks', licenseWebhookRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/billing', billingRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/admin/checkout', adminCheckoutRouter);
  app.use('/api/licenses', licensePublicRouter);
  app.use('/api/admin', licenseAdminRouter);
  app.get('/api/apps', (_req, res) => {
    const { APP_REGISTRY } = require('../proxy/proxyRouter');
    res.json({ success: true, data: APP_REGISTRY.map((a: { key: string; description: string; pathPrefix: string }) => ({ key: a.key, description: a.description, path: a.pathPrefix })) });
  });
}
