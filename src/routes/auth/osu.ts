import crypto from 'node:crypto';

import { Request, Response, Router } from 'express';
import { fetchOsuToken, fetchOsuMe } from '@services/osu.js';
import {
  upsertTokens,
  upsertUserFromOsu,
  getUserRoles,
  getUserById,
  updateOsuUser,
} from '@services/user.js';
import { requireAuth } from '@middleware/require-auth.js';
import { verifyCsrf } from '@middleware/csrf.js';
import { env } from '@config/env.js';
import { defaultCookieOptions, publicCookieOptions } from '@lib/cookies.js';
import { signSession } from '@lib/jwt.js';
import { checkCooldown, markRefreshed, runOncePerUser } from '@lib/refresh-gate.js';

const router = Router();

router.get('/login', (req: Request, res: Response) => {
  const state = crypto.randomUUID();
  const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : null;

  res.cookie('oauth_state', state, defaultCookieOptions);
  if (returnTo) res.cookie('oauth_return_to', returnTo, defaultCookieOptions);

  const authUrl =
    `https://osu.ppy.sh/oauth/authorize` +
    `?client_id=${env.OSU_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(env.OSU_REDIRECT_URI)}` +
    `&response_type=code&scope=identify&state=${state}`;

  return res.redirect(authUrl);
});

router.get('/callback', async (req: Request, res: Response) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) return res.status(400).send('Missing code or state');
  if (state !== req.cookies.oauth_state) return res.status(403).send('Invalid state');

  const tokens = await fetchOsuToken(code);
  const user = await fetchOsuMe(tokens.access_token);

  await upsertUserFromOsu(user);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await upsertTokens(user.id, tokens.access_token, tokens.refresh_token, expiresAt);

  const roles = await getUserRoles(user.id);
  const sessionToken = await signSession({
    sub: String(user.id),
    username: user.username,
    country_code: user.country_code ?? 'XX',
    global_rank: user.statistics.global_rank,
    avatar_url: user.avatar_url,
    roles,
  });

  res.cookie(env.COOKIE_NAME, sessionToken, defaultCookieOptions);
  res.cookie('csrf_token', crypto.randomUUID(), publicCookieOptions);

  const returnTo = req.cookies.oauth_return_to || env.FRONTEND_URL || '/';
  res.clearCookie('oauth_state', defaultCookieOptions);
  res.clearCookie('oauth_return_to', defaultCookieOptions);

  return res.redirect(returnTo);
});

router.post('/refresh', requireAuth, verifyCsrf, async (req: Request, res: Response) => {
  const userId = String((req as any).user?.sub ?? '');
  if (!userId) return res.status(401).send('Unauthorized');

  const gate = checkCooldown(userId);
  if (!gate.allowed) {
    res.setHeader('Retry-After', String(gate.retryAfterS));

    return res.status(429).json({ error: 'Too many refreshes', retry_after_s: gate.retryAfterS });
  }

  try {
    const dbUser = await runOncePerUser(userId, async () => {
      const user = await fetchOsuMe(userId);

      await updateOsuUser(userId, {
        username: user.username,
        country_code: user.country_code ?? 'XX',
        avatar_url: user.avatar_url ?? null,
        global_rank: user.statistics?.global_rank ?? null,
        country_rank: user.statistics?.country_rank ?? null,
      });

      return await getUserById(userId);
    });

    markRefreshed(userId);

    const roles = await getUserRoles(userId);

    // should match /auth/me output
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
  } catch (err: any) {
    const msg = String(err?.message ?? '');

    if (msg.includes('re-authenticate')) {
      return res.status(401).json({ error: 'osu! re-auth required' });
    }

    console.error('osu! refresh error', { message: err?.message, code: err?.code });

    return res
      .status(500)
      .json({ error: 'Refresh failed', message: err?.message ?? 'Internal error' });
  }
});

export default router;
