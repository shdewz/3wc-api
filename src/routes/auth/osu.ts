import crypto from 'node:crypto';

import { Router } from 'express';

import { env } from '@/config/env.js';
import { defaultCookieOptions, publicCookieOptions } from '@/lib/cookies.js';
import { signSession } from '@/lib/jwt.js';
import { fetchOsuToken, fetchOsuMe } from '@/services/osu.js';
import { upsertTokens, upsertUserFromOsu, getUserRoles } from '@/services/user.js';

const router = Router();

router.get('/login', (req, res) => {
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

router.get('/callback', async (req, res) => {
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

export default router;
