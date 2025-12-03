import crypto from 'node:crypto';

import fetch from 'node-fetch';
import { Router } from 'express';

import { env } from '@/config/env.js';

const router = Router();

router.get('/osu/login', (_, res) => {
  const state = crypto.randomUUID();

  res.cookie('oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  });
  const authUrl = `https://osu.ppy.sh/oauth/authorize?client_id=${env.OSU_CLIENT_ID}&redirect_uri=${env.OSU_REDIRECT_URI}&response_type=code&scope=identify&state=${state}`;

  res.redirect(authUrl);
});

router.get('/osu/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code || !state) return res.status(400).send('Missing code or state');
  console.log({ state, saved_state: req.cookies.oauth_state });
  if (state !== req.cookies.oauth_state)
    return res.status(403).send('Invalid state');

  const tokenRes = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.OSU_CLIENT_ID,
      client_secret: env.OSU_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: env.OSU_REDIRECT_URI,
    }),
  });

  const tokens = await tokenRes.json();

  res.json(tokens);
});

export default router;
