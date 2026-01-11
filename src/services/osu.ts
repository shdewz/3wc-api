import type { AuthToken } from '@/types/osu';

import { env } from '@config/env.js';
import { getValidOsuAccessToken } from '@services/user.js';

export const fetchOsuToken = async (code: string): Promise<AuthToken> => {
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.OSU_CLIENT_ID,
      client_secret: env.OSU_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.OSU_REDIRECT_URI,
    }),
  });
  if (!res.ok) throw new Error(await res.text());

  return (await res.json()) as AuthToken;
};

export const refreshOsuToken = async (refreshToken: string): Promise<AuthToken> => {
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env.OSU_CLIENT_ID,
      client_secret: env.OSU_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) throw new Error(await res.text());

  return (await res.json()) as AuthToken;
};

export const fetchOsuMeFromId = async (userId: string): Promise<any> => {
  let token = await getValidOsuAccessToken(userId);

  const res = await fetch('https://osu.ppy.sh/api/v2/me?mode=osu', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    token = await getValidOsuAccessToken(userId);
    const retry = await fetch('https://osu.ppy.sh/api/v2/me?mode=osu', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!retry.ok) {
      const text = await retry.text().catch(() => '');
      throw new Error(`osu! /me failed after refresh: ${retry.status} ${text}`);
    }

    return await retry.json();
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`osu! /me failed: ${res.status} ${text}`);
  }

  return await res.json();
};

export const fetchOsuMeFromToken = async (accessToken: string): Promise<any> => {
  const res = await fetch('https://osu.ppy.sh/api/v2/me?mode=osu', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`osu! /me failed: ${res.status} ${text}`);
  }

  return await res.json();
};
