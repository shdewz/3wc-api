import crypto from 'node:crypto';

import { Router } from 'express';

import { env } from '@/config/env.js';
import { defaultCookieOptions, publicCookieOptions } from '@/lib/cookies.js';
import { requireAuth } from '@/middleware/require-auth.js';
import { fetchDiscordToken, fetchDiscordMe } from '@/services/discord.js';
import {
  clearDiscordForUser,
  removeDiscordTokens,
  upsertDiscordForUser,
  upsertDiscordTokens,
} from '@/services/user.js';
import { verifyCsrf } from '@/middleware/csrf.js';

const router = Router();

router.get('/login', requireAuth, (req, res) => {
  const state = crypto.randomUUID();
  const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : null;

  res.cookie('discord_oauth_state', state, defaultCookieOptions);
  if (returnTo) res.cookie('discord_oauth_return_to', returnTo, defaultCookieOptions);

  const scopes = ['identify', 'guilds.join'].join(' ');
  const authUrl =
    `https://discord.com/oauth2/authorize` +
    `?client_id=${env.DISCORD_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(env.DISCORD_REDIRECT_URI)}` +
    `&response_type=code&scope=${encodeURIComponent(scopes)}&state=${state}`;

  return res.redirect(authUrl);
});

router.get('/callback', requireAuth, async (req, res) => {
  const { code, state } = req.query as { code?: string; state?: string };
  if (!code || !state) return res.status(400).send('Missing code or state');
  if (state !== req.cookies.discord_oauth_state) return res.status(403).send('Invalid state');

  const sessionUser = (req as any).user!;

  const tokens = await fetchDiscordToken(code);
  const discordUser = await fetchDiscordMe(tokens.access_token);

  await upsertDiscordForUser(sessionUser.sub, {
    id: discordUser.id,
    username: discordUser.username ?? discordUser.global_name ?? null,
    avatar: discordUser.avatar ?? null,
  });

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await upsertDiscordTokens(sessionUser.sub, tokens.access_token, tokens.refresh_token, expiresAt);

  res.cookie('csrf_token', crypto.randomUUID(), publicCookieOptions);

  const returnTo = req.cookies.discord_oauth_return_to || env.FRONTEND_URL || '/';
  res.clearCookie('discord_oauth_state', defaultCookieOptions);
  res.clearCookie('discord_oauth_return_to', defaultCookieOptions);

  return res.redirect(returnTo);
});

router.post('/unlink', requireAuth, verifyCsrf, async (req, res) => {
  const sess = (req as any).user!;

  try {
    await removeDiscordTokens(sess.sub);
    await clearDiscordForUser(sess.sub);

    return res.status(204).send();
  } catch (e: any) {
    return res.status(500).send(e?.message ?? 'Failed to unlink Discord');
  }
});

export default router;
