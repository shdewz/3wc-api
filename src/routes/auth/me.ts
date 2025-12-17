import { Router } from 'express';

import { requireAuth } from '@/middleware/require-auth';

const router = Router();

// Add proper typing instead of 'any' later
router.get('/me', requireAuth, (req: any, res) => {
  const u = req.user!;
  return res.json({
    user_id: u.sub,
    username: u.username,
    country_code: u.country_code,
    roles: u.roles ?? [],
  });
});

export default router;
