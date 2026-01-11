import { Request, Response, Router } from 'express';
import { requireAuth } from '@middleware/require-auth.js';
import { getUserById, getUserRoles } from '@services/user.js';

const router = Router();

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const session = (req as any).user!;
  const dbUser = await getUserById(session.sub);
  if (!dbUser) return res.status(404).send('User not found');

  const roles = await getUserRoles(session.sub);

  return res.json({
    user_id: dbUser.user_id,
    username: dbUser.username,
    country_code: dbUser.country_code ?? 'XX',
    avatar_url: dbUser.avatar_url ?? null,
    roles,
    global_rank: dbUser.global_rank ?? null,
    country_rank: dbUser.country_rank ?? null,
    discord_id: dbUser.discord_id ?? null,
    discord_username: dbUser.discord_username ?? null,
    discord_avatar_url: dbUser.discord_avatar_url ?? null,
    registered: dbUser.registered ?? false,
    wants_captain: dbUser.wants_captain ?? false,
  });
});

export default router;
