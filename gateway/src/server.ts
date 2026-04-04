import 'express-async-errors';
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import path from 'path';
import { setupMiddleware } from './config/middleware';
import { setupRoutes } from './routes';
import { setupProxy } from './proxy/proxyRouter';
import { logger } from './utils/logger';
import { db } from './config/database';
import { AppError } from './utils/AppError';

const app = express();
const server = createServer(app);

async function bootstrap() {
  await db.connect();
  logger.info('✅ Database connected');

  setupMiddleware(app);
  setupRoutes(app);

  // ── Serve App1 (dashboard) static files at /app1 ──────
  // Built files live at apps/app1-dashboard/dist/
  // __dirname in production = gateway/dist/
  // so ../../apps/app1-dashboard/dist resolves correctly
  const app1Dist = path.join(__dirname, '../../apps/app1-dashboard/dist');

  app.use('/app1', express.static(app1Dist));

  // SPA fallback — todas as rotas do React voltam para index.html
  app.get('/app1/*', (_req: Request, res: Response) => {
    res.sendFile(path.join(app1Dist, 'index.html'));
  });

  // ── Serve checkout.html na raiz do gateway ────────────
  const checkoutFile = path.join(
    __dirname,
    '../../apps/app1-dashboard/public/checkout.html'
  );
  app.get('/checkout.html', (_req: Request, res: Response) => {
    res.sendFile(checkoutFile);
  });

  // ── Redirect raiz para /app1 ──────────────────────────
  app.get('/', (_req: Request, res: Response) => {
    res.redirect('/app1');
  });

  // ── Proxy reverso para App2 (/app2) ───────────────────
  setupProxy(app);

  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    logger.info(`🚀 Gateway na porta ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`📂 Serving App1 static from: ${app1Dist}`);
    logger.info(`📡 Proxying: /app2 → ${process.env.APP2_URLSHORTENER_URL}`);
  });
}

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }
  logger.error(`Unhandled error on ${req.method} ${req.path}: ${err.message}`);
  return res.status(500).json({ success: false, error: 'Internal server error' });
}

bootstrap().catch((err) => {
  logger.error('Fatal error during bootstrap: ' + err.message);
  process.exit(1);
});

export { app };
