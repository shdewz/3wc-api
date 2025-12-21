import { Request, Response, Router } from 'express';

import { requireAuth } from '@/middleware/require-auth.js';

const router = Router();

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const u = (req as any).user!;

  return res.json({
    user_id: u.sub,
    username: u.username,
    country_code: u.country_code,
    avatar_url: u.avatar_url,
    roles: u.roles ?? [],
  });
});

export default router;
