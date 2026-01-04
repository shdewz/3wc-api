import { Router } from 'express';

import { env } from '@/config/env.js';

const router = Router();

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({
    registrationStart: env.REGISTRATION_START,
    registrationEnd: env.REGISTRATION_END,
    serverNow: new Date().toISOString(),
  });
});

export default router;
