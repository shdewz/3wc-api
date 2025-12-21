import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from '@routes/auth/index.js';
import healthRoutes from '@routes/health.js';

import { env } from '@/config/env.js';

const PORT = env.PORT || 4000;

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cookieParser());

if (env.IS_PROD) app.set('trust proxy', 1);
else {
  const allowedOrigins = env.FRONTEND_URL ? [env.FRONTEND_URL] : ['http://localhost:5173'];

  const corsOptions: cors.CorsOptions = {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);

      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization'],
    exposedHeaders: [],
    maxAge: 600,
    optionsSuccessStatus: 204,
  };

  app.use(cors(corsOptions));
}

app.use('/auth', authRouter);
app.use('/health', healthRoutes);

app.use((_req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
