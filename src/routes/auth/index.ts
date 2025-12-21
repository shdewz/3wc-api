import { Request, Response, Router } from 'express';

import meRouter from './me.js';
import osuRouter from './osu.js';

import { verifyCsrf } from '@/middleware/csrf.js';
import { env } from '@/config/env.js';
import { removeTokens } from '@/services/user.js';
import { requireAuth } from '@/middleware/require-auth.js';
import { defaultCookieOptions, publicCookieOptions } from '@/lib/cookies.js';

const router = Router();

router.use('/', meRouter);
router.use('/osu', osuRouter);

router.post('/logout', requireAuth, verifyCsrf, async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) return res.status(401).send('Unauthorized');

  try {
    await removeTokens(userId);

    res.clearCookie(env.COOKIE_NAME, defaultCookieOptions);
    res.clearCookie('csrf_token', publicCookieOptions);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error('Logout error', {
      message: err?.message,
      code: err?.code,
    });

    return res.status(500).json({
      error: 'Logout failed',
      message: err?.message ?? 'Internal error',
    });
  }
});

export default router;
