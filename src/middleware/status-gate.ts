import { Request, Response, NextFunction } from 'express';
import {
  resolveTournament,
  computeRegistrationStatus,
  computeBracketStatus,
} from '@services/tournament-status.js';

export const attachTournamentSlug = () => {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).tournamentSlug = typeof req.query.slug === 'string' ? req.query.slug : undefined;
    next();
  };
};

export const requireRegistrationOpen = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = (req as any).tournamentSlug as string | undefined;
    const t = await resolveTournament(slug);
    const reg = await computeRegistrationStatus(t.id);
    if (!reg.isActive) {
      return res.status(403).json({
        error: 'REGISTRATION_CLOSED',
        message: reg.overrideReason || 'Registrations are closed.',
      });
    }
    next();
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: 'REGISTRATION_CHECK_FAILED', message: e?.message ?? 'Unknown error' });
  }
};

export const requireBracketActive = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = (req as any).tournamentSlug as string | undefined;
    const t = await resolveTournament(slug);
    const bracket = await computeBracketStatus(t.id);
    if (!bracket.isActive) {
      return res.status(403).json({ error: 'BRACKET_NOT_ACTIVE' });
    }
    next();
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: 'BRACKET_CHECK_FAILED', message: e?.message ?? 'Unknown error' });
  }
};

export const requireRound = (roundName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const slug = (req as any).tournamentSlug as string | undefined;
      const t = await resolveTournament(slug);
      const bracket = await computeBracketStatus(t.id);
      if (!bracket.isActive || bracket.currentRound !== roundName) {
        return res.status(403).json({
          error: 'WRONG_ROUND',
          expected: roundName,
          current: bracket.currentRound,
        });
      }
      next();
    } catch (e: any) {
      return res
        .status(500)
        .json({ error: 'ROUND_CHECK_FAILED', message: e?.message ?? 'Unknown error' });
    }
  };
};
