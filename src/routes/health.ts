import { Router } from 'express';

const router = Router();

router.get('/', (_, res) => {
  res.set({
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-store',
    Connection: 'keep-alive',
  });
  res.status(200).send('ok').end();
});

export default router;
