import { Request, Response, Router } from 'express';

import { env } from '@/config/env.js';
import { requireAuth } from '@/middleware/require-auth.js';
import { verifyCsrf } from '@/middleware/csrf.js';
import { getUserById } from '@/services/user.js';
import { pool } from '@/db/index.js';

const router = Router();

const isRegistrationOpen = (now = new Date()) => {
  const start = new Date(env.REGISTRATION_START!);
  const end = new Date(env.REGISTRATION_END!);

  const t = now.getTime();
  return t >= start.getTime() && t <= end.getTime();
};

router.post('/register', requireAuth, verifyCsrf, async (req: Request, res: Response) => {
  if (!isRegistrationOpen()) return res.status(403).send('Registration is closed');

  const session = (req as any).user!;
  const readRules = String(req.body?.read_rules ?? '').toLowerCase() === 'true';
  const wantsCaptain = String(req.body?.wants_captain ?? '').toLowerCase() === 'true';

  if (!readRules) {
    return res.redirect(
      303,
      '/register?error=' + encodeURIComponent('You must confirm that you have read the rules.')
    );
  }

  const dbUser = await getUserById(session.sub);
  if (!dbUser) {
    return res.redirect(
      303,
      '/register?error=' + encodeURIComponent('Account not found. Please re-login.')
    );
  }
  if (!dbUser.discord_id) {
    return res.redirect(
      303,
      '/register?error=' + encodeURIComponent('Discord must be linked before registering.')
    );
  }

  await pool.query(
    `
    UPDATE users
    SET registered = TRUE,
        wants_captain = $2,
        updated_at = now()
    WHERE user_id = $1
    `,
    [session.sub, wantsCaptain]
  );

  return res.redirect(303, '/register/success');
});

router.post('/unregister', requireAuth, verifyCsrf, async (req: Request, res: Response) => {
  if (!isRegistrationOpen()) return res.status(403).send('Registration is closed');

  const session = (req as any).user!;

  await pool.query(
    `
    UPDATE users
    SET registered = FALSE,
        wants_captain = FALSE,
        updated_at = now()
    WHERE user_id = $1
    `,
    [session.sub]
  );

  return res.redirect(303, '/');
});

export default router;
