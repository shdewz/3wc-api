import type { AuthToken } from '@/types/osu';

import { env } from '@/config/env.js';

export const fetchOsuToken = async (code: string): Promise<AuthToken> => {
  const res = await fetch('https://osu.ppy.sh/oauth/token', {
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
  if (!res.ok) throw new Error(await res.text());

  return (await res.json()) as AuthToken;
};

export const fetchOsuMe = async (accessToken: string): Promise<any> => {
  const res = await fetch('https://osu.ppy.sh/api/v2/me?mode=osu', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());

  return res.json();
};
