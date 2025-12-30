// services/discord.ts
import { env } from '@/config/env.js';

export type DiscordToken = {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token: string;
  scope: string;
};

export type DiscordUser = {
  id: string;
  username?: string;
  global_name?: string;
  avatar?: string;
};

export const fetchDiscordToken = async (code: string): Promise<DiscordToken> => {
  const body = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    client_secret: env.DISCORD_CLIENT_SECRET,
    grant_type: 'authorization_code',
    code,
    redirect_uri: env.DISCORD_REDIRECT_URI,
  });

  const res = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(await res.text());

  return (await res.json()) as DiscordToken;
};

export const fetchDiscordMe = async (accessToken: string): Promise<DiscordUser> => {
  const res = await fetch('https://discord.com/api/users/@me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(await res.text());

  return (await res.json()) as DiscordUser;
};

export const joinDiscordGuild = async (
  guildId: string,
  botToken: string,
  userId: string,
  userAccessToken: string,
  options?: {
    nick?: string;
    roles?: string[];
    mute?: boolean;
    deaf?: boolean;
  }
): Promise<void> => {
  const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify({
      access_token: userAccessToken,
      ...options,
    }),
  });

  if (res.status !== 201 && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to add user to guild: ${res.status} ${text}`);
  }
};
