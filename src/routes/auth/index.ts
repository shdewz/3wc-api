import { Router } from 'express';

import meRouter from './me';
import osuRouter from './osu';

const router = Router();

router.use('/', meRouter);
router.use('/osu', osuRouter);

export default router;
