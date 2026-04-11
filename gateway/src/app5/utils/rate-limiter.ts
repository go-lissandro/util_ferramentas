import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export function createRateLimiter(opts: { windowMs: number; max: number }) {
  return rateLimit({
    windowMs: opts.windowMs,
    max: opts.max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => req.ip || 'anon',
    handler: (_req: Request, res: Response) => {
      res.status(429).json({ success: false, error: 'Muitas requisições. Aguarde um momento.', code: 'RATE_LIMIT' });
    },
  });
}
