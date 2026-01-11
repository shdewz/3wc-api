import type { Request, Response, NextFunction } from 'express';

import { env } from '@config/env.js';
import { verifySession } from '@lib/jwt.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.[env.COOKIE_NAME];
  if (!token) return res.status(401).send('Unauthenticated');

  try {
    const payload = await verifySession(token);
    (req as any).user = payload;

    return next();
  } catch {
    return res.status(401).send('Invalid or expired session');
  }
};
