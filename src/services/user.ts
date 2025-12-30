import { pool } from '@/db/index.js';

export const upsertUserFromOsu = async (user: any): Promise<void> => {
  await pool.query(
    `
    INSERT INTO users (user_id, username, country_code, avatar_url, global_rank, country_rank)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (user_id) DO UPDATE SET
      username = EXCLUDED.username,
      country_code = EXCLUDED.country_code,
      avatar_url = EXCLUDED.avatar_url,
      global_rank = EXCLUDED.global_rank,
      country_rank = EXCLUDED.country_rank,
      updated_at = now()
    `,
    [
      user.id,
      user.username,
      user.country_code ?? 'XX',
      user.avatar_url ?? null,
      user.statistics?.global_rank ?? null,
      user.statistics?.country_rank ?? null,
    ]
  );
};

export const upsertTokens = async (
  userId: number | string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<void> => {
  await pool.query(
    `
    INSERT INTO tokens (user_id, access_token, refresh_token, expires_at, issued_at)
    VALUES ($1, $2, $3, $4, now())
    ON CONFLICT (user_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      issued_at = now()
    `,
    [userId, accessToken, refreshToken, expiresAt]
  );
};

export const removeTokens = async (userId: number | string): Promise<void> => {
  await pool.query(`DELETE FROM tokens WHERE user_id = $1`, [userId]);
};

export const getUserRoles = async (userId: number | string): Promise<string[]> => {
  const { rows } = await pool.query(
    `
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = $1
    `,
    [userId]
  );
  return rows.map((r) => r.name as string);
};

export const upsertDiscordForUser = async (
  osuUserId: number | string,
  discord: { id: string; username?: string | null; avatar?: string | null }
): Promise<void> => {
  await pool.query(
    `
    UPDATE users
    SET
      discord_id = $2,
      discord_username = $3,
      discord_avatar_url = $4,
      updated_at = now()
    WHERE user_id = $1
    `,
    [osuUserId, discord.id, discord.username ?? null, discord.avatar ?? null]
  );
};

export const upsertDiscordTokens = async (
  osuUserId: number | string,
  accessToken: string,
  refreshToken: string,
  expiresAt: Date
): Promise<void> => {
  await pool.query(
    `
    INSERT INTO discord_tokens (user_id, access_token, refresh_token, expires_at, issued_at)
    VALUES ($1, $2, $3, $4, now())
    ON CONFLICT (user_id) DO UPDATE SET
      access_token = EXCLUDED.access_token,
      refresh_token = EXCLUDED.refresh_token,
      expires_at = EXCLUDED.expires_at,
      issued_at = now()
    `,
    [osuUserId, accessToken, refreshToken, expiresAt]
  );
};

export const clearDiscordForUser = async (userId: number | string): Promise<void> => {
  await pool.query(
    `
    UPDATE users
    SET
      discord_id = NULL,
      discord_username = NULL,
      discord_avatar_url = NULL,
      updated_at = now()
    WHERE user_id = $1
    `,
    [userId]
  );
};

export const removeDiscordTokens = async (userId: number | string): Promise<void> => {
  await pool.query(`DELETE FROM discord_tokens WHERE user_id = $1`, [userId]);
};

export const getUserById = async (userId: number | string) => {
  const { rows } = await pool.query(
    `
    SELECT
      u.user_id,
      u.username,
      u.country_code,
      u.avatar_url,
      u.global_rank,
      u.country_rank,
      u.discord_id,
      u.discord_username,
      u.discord_avatar_url,
      u.registered,
      u.wants_captain
    FROM users u
    WHERE u.user_id = $1
    `,
    [userId]
  );

  return rows[0] ?? null;
};
