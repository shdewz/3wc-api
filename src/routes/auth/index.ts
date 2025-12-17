import { Router } from 'express';

import meRouter from './me.js';
import osuRouter from './osu.js';

const router = Router();

router.use('/', meRouter);
router.use('/osu', osuRouter);

export default router;
