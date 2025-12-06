import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from '@routes/auth.js';
import healthRoutes from '@routes/health.js';

import { env } from '@/config/env.js';

const PORT = env.PORT || 4000;

const app = express();

if (env.IS_PROD) app.set('trust proxy', 1);

const allowedOrigins = env.FRONTEND_URL
  ? [env.FRONTEND_URL]
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.use('/health', healthRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
