import { pool } from '@db/index.js';

export type TournamentRow = {
  id: number;
  slug: string;
  tournament_name: string;
};

export const getTournamentBySlug = async (slug: string): Promise<TournamentRow | null> => {
  const { rows } = await pool.query<TournamentRow>(
    'SELECT id, slug, tournament_name FROM tournaments WHERE slug = $1 LIMIT 1',
    [slug]
  );
  return rows[0] ?? null;
};

export const getLatestTournament = async (): Promise<TournamentRow | null> => {
  const { rows } = await pool.query<TournamentRow>(
    'SELECT id, slug, tournament_name FROM tournaments ORDER BY id DESC LIMIT 1'
  );
  return rows[0] ?? null;
};

export type RegistrationConfigRow = {
  registration_start_utc: string;
  registration_end_utc: string;
  override_active: boolean | null;
  override_reason: string | null;
};

export const getRegistrationConfig = async (
  tournamentId: number
): Promise<RegistrationConfigRow | null> => {
  const { rows } = await pool.query<RegistrationConfigRow>(
    `SELECT registration_start_utc, registration_end_utc, override_active, override_reason
     FROM tournament_registration
     WHERE tournament_id = $1
     LIMIT 1`,
    [tournamentId]
  );
  return rows[0] ?? null;
};

export type BracketConfigRow = {
  bracket_start_utc: string;
  rounds: unknown;
  override_active: boolean | null;
  override_current_round: string | null;
};

export const getBracketConfig = async (tournamentId: number): Promise<BracketConfigRow | null> => {
  const { rows } = await pool.query<BracketConfigRow>(
    `SELECT bracket_start_utc, rounds, override_active, override_current_round
     FROM tournament_bracket_config
     WHERE tournament_id = $1
     LIMIT 1`,
    [tournamentId]
  );
  return rows[0] ?? null;
};
