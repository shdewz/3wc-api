import { Request, Response, Router } from 'express';
import { requireAuth } from '@middleware/require-auth.js';
import { verifyCsrf } from '@middleware/csrf.js';
import { attachTournamentSlug, requireRegistrationOpen } from '@middleware/status-gate.js';
import { getUserById } from '@services/user.js';
import { pool } from '@db/index.js';

const router = Router();

router.post(
  '/register',
  attachTournamentSlug(),
  requireRegistrationOpen,
  requireAuth,
  verifyCsrf,
  async (req: Request, res: Response) => {
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
  }
);

router.post(
  '/unregister',
  attachTournamentSlug(),
  requireRegistrationOpen,
  requireAuth,
  verifyCsrf,
  async (req: Request, res: Response) => {
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
  }
);

router.get('/registrations', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');

  const onlyValid = req.query.onlyValid === 'true';

  const whereClause = onlyValid
    ? 'WHERE registered = TRUE AND global_rank >= 100 AND global_rank <= 999'
    : 'WHERE registered = TRUE';

  const { rows } = await pool.query(
    `
    SELECT user_id, username, discord_id, discord_username, country_code, global_rank, avatar_url
    FROM users
    ${whereClause}
    ORDER BY country_code ASC, global_rank ASC
    `
  );

  return res.json(rows);
});

export default router;
