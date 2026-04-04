import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const requestId = uuidv4();
  const start = Date.now();

  // Attach request ID for tracing across services
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logFn = res.statusCode >= 500
      ? logger.error.bind(logger)
      : res.statusCode >= 400
      ? logger.warn.bind(logger)
      : logger.info.bind(logger);

    logFn({
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      tenantId: req.user?.tenantId,
      userId: req.user?.sub,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
}
