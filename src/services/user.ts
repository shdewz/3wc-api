import { pool } from '@/db/index.js';

export const upsertUserFromOsu = async (user: any) => {
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
) => {
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
