import { Router } from 'express';
import { getStatuses } from '@services/tournament-status.js';

const router = Router();

/**
 * Optional query: ?slug=3wc2026
 */
router.get('/', async (req, res) => {
  try {
    const slug = typeof req.query.slug === 'string' ? req.query.slug : undefined;
    const payload = await getStatuses(slug);
    res.set('Cache-Control', 'no-store');

    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({
      error: 'STATUS_FETCH_FAILED',
      message: err?.message ?? 'Unknown error',
    });
  }
});

export default router;
