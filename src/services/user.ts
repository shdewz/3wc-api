import { refreshOsuToken } from '@services/osu.js';
import { pool } from '@db/index.js';
import { resolveTournament, computeRegistrationStatus } from '@services/tournament-status.js';

/* helpers */

const shouldSkipRankUpdate = async (userId: number | string): Promise<boolean> => {
  const { rows } = await pool.query('SELECT registered FROM users WHERE user_id = $1', [userId]);

  if (rows.length === 0 || !rows[0].registered) {
    return false;
  }

  try {
    const tournament = await resolveTournament();
    const regStatus = await computeRegistrationStatus(tournament.id);

    return !regStatus.isActive;
  } catch (err) {
    console.log(err);

    return false;
  }
};

/* upsert users */

export const upsertUserFromOsu = async (user: any): Promise<void> => {
  const skipRankUpdate = await shouldSkipRankUpdate(user.id);

  if (skipRankUpdate) {
    await pool.query(
      `
      UPDATE users SET
        username = $2,
        country_code = $3,
        avatar_url = $4,
        updated_at = now()
      WHERE user_id = $1
      `,
      [user.id, user.username, user.country_code ?? 'XX', user.avatar_url ?? null]
    );
  } else {
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
  }
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

/* update users */

export const updateOsuUser = async (osuUserId: number | string, data: any): Promise<void> => {
  const skipRankUpdate = await shouldSkipRankUpdate(osuUserId);

  if (skipRankUpdate) {
    await pool.query(
      `
      UPDATE users
      SET
        username = $2,
        country_code = $3,
        avatar_url = $4,
        updated_at = now()
      WHERE user_id = $1
      `,
      [osuUserId, data.username, data.country_code ?? 'XX', data.avatar_url ?? null]
    );
  } else {
    await pool.query(
      `
      UPDATE users
      SET
        username = $2,
        country_code = $3,
        avatar_url = $4,
        global_rank = $5,
        country_rank = $6,
        updated_at = now()
      WHERE user_id = $1
      `,
      [
        osuUserId,
        data.username,
        data.country_code ?? 'XX',
        data.avatar_url ?? null,
        data.global_rank ?? null,
        data.country_rank ?? null,
      ]
    );
  }
};

/* token handling */

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

export const removeDiscordTokens = async (userId: number | string): Promise<void> => {
  await pool.query(`DELETE FROM discord_tokens WHERE user_id = $1`, [userId]);
};

/* get functions */

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

export const getUserTokens = async (userId: number | string) => {
  const { rows } = await pool.query(
    `
    SELECT
      t.access_token,
      t.refresh_token,
      t.expires_at
    FROM tokens t
    WHERE t.user_id = $1
    `,
    [userId]
  );

  return rows[0] ?? null;
};

export const getValidOsuAccessToken = async (userId: string): Promise<string> => {
  const tokens = await getUserTokens(userId);
  if (!tokens || !tokens.refresh_token) throw new Error('No stored osu! tokens for user');

  const now = Date.now();
  const expiresAtMs = new Date(tokens.expires_at).getTime();
  const isExpired = now >= expiresAtMs - 60 * 1000;

  if (!isExpired) return tokens.access_token;

  try {
    const refreshed = await refreshOsuToken(tokens.refresh_token);
    const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

    await upsertTokens(
      userId,
      refreshed.access_token,
      refreshed.refresh_token ?? tokens.refresh_token,
      newExpiresAt
    );

    return refreshed.access_token;
  } catch (err) {
    await removeTokens(userId);
    throw new Error('osu! refresh failed; user must re-authenticate: ' + err);
  }
};

/* other */

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
