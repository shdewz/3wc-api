import { pool } from '@db/index.js';

export const seedTournament = async ({
  slug,
  name,
  regStart,
  regEnd,
  bracketStart,
  rounds,
}: {
  slug: string;
  name: string;
  regStart: string;
  regEnd: string;
  bracketStart: string;
  rounds: string[];
}) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tRes = await client.query(
      `INSERT INTO tournaments (slug, tournament_name)
       VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET tournament_name = EXCLUDED.tournament_name
       RETURNING id`,
      [slug, name]
    );
    const tournamentId = tRes.rows[0].id;

    await client.query(
      `INSERT INTO tournament_registration (tournament_id, registration_start_utc, registration_end_utc, override_active, override_reason)
       VALUES ($1, $2, $3, NULL, NULL)
       ON CONFLICT (tournament_id) DO UPDATE SET
         registration_start_utc = EXCLUDED.registration_start_utc,
         registration_end_utc = EXCLUDED.registration_end_utc,
         override_active = EXCLUDED.override_active,
         override_reason = EXCLUDED.override_reason`,
      [tournamentId, regStart, regEnd]
    );

    await client.query(
      `INSERT INTO tournament_bracket_config (tournament_id, bracket_start_utc, rounds, override_active, override_current_round)
       VALUES ($1, $2, $3::jsonb, NULL, NULL)
       ON CONFLICT (tournament_id) DO UPDATE SET
         bracket_start_utc = EXCLUDED.bracket_start_utc,
         rounds = EXCLUDED.rounds,
         override_active = EXCLUDED.override_active,
         override_current_round = EXCLUDED.override_current_round`,
      [tournamentId, bracketStart, JSON.stringify(rounds)]
    );

    await client.query('COMMIT');
    console.log(`Seeded tournament "${slug}" (${tournamentId})`);
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};
