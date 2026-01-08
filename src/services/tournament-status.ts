import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import { z } from 'zod';
import {
  getTournamentBySlug,
  getLatestTournament,
  getRegistrationConfig,
  getBracketConfig,
  type TournamentRow,
  type RegistrationConfigRow,
  type BracketConfigRow,
} from '@services/tournament.js';

dayjs.extend(utc);

const STAGE_LENGTH_DAYS = 7;

export type RegistrationStatus = {
  isActive: boolean;
  start: string;
  end: string;
  overrideReason?: string | null;
};

export type BracketStatus = {
  isActive: boolean;
  start: string;
  end: string;
  currentRound?: string;
  rounds: string[];
};

export type StatusResponse = {
  serverNow: string;
  statuses: {
    registration: RegistrationStatus;
    bracket: BracketStatus;
  };
};

export const resolveTournament = async (slug?: string): Promise<TournamentRow> => {
  if (slug) {
    const t = await getTournamentBySlug(slug);
    if (t) return t;
    throw new Error(`Tournament not found: ${slug}`);
  }
  const t = await getLatestTournament();
  if (t) return t;
  throw new Error('No tournaments found');
};

export const computeRegistrationStatus = async (
  tournamentId: number
): Promise<RegistrationStatus> => {
  const cfg: RegistrationConfigRow | null = await getRegistrationConfig(tournamentId);
  if (!cfg) throw new Error('Registration config missing');

  const start = dayjs.utc(cfg.registration_start_utc);
  const end = dayjs.utc(cfg.registration_end_utc);
  const now = dayjs.utc();

  let isActive = now.isAfter(start) && now.isBefore(end);
  if (typeof cfg.override_active === 'boolean') {
    isActive = cfg.override_active;
  }

  return {
    isActive,
    start: start.toISOString(),
    end: end.toISOString(),
    overrideReason: cfg.override_reason ?? null,
  };
};

const RoundsSchema = z.array(z.string().min(1));

export const computeBracketStatus = async (tournamentId: number): Promise<BracketStatus> => {
  const cfg: BracketConfigRow | null = await getBracketConfig(tournamentId);
  if (!cfg) throw new Error('Bracket config missing');

  const parsed = RoundsSchema.safeParse(cfg.rounds);
  const rounds = parsed.success ? parsed.data : [];

  const start = dayjs.utc(cfg.bracket_start_utc);
  const now = dayjs.utc();
  const end = start.add(rounds.length * STAGE_LENGTH_DAYS, 'day');

  let isActive = rounds.length > 0 && now.isAfter(start) && now.isBefore(end);
  if (typeof cfg.override_active === 'boolean') {
    isActive = cfg.override_active;
  }

  let currentRound: string | undefined;
  if (isActive && rounds.length > 0) {
    const daysSince = now.diff(start, 'day');
    const index = Math.min(
      Math.max(Math.floor(daysSince / STAGE_LENGTH_DAYS), 0),
      rounds.length - 1
    );
    currentRound = rounds[index];
  }

  if (cfg.override_current_round) {
    currentRound = cfg.override_current_round;
  }

  return {
    isActive,
    start: start.toISOString(),
    end: end.toISOString(),
    currentRound,
    rounds,
  };
};

export const getStatuses = async (slug?: string): Promise<StatusResponse> => {
  const tournament = await resolveTournament(slug);
  const [registration, bracket] = await Promise.all([
    computeRegistrationStatus(tournament.id),
    computeBracketStatus(tournament.id),
  ]);

  return {
    serverNow: dayjs.utc().toISOString(),
    statuses: { registration, bracket },
  };
};
