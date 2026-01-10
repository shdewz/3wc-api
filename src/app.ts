import express from 'express';
import { rateLimit } from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from '@routes/auth/index.js';
import healthRouter from '@routes/health.js';
import registrationRouter from '@routes/registration.js';
import statusRouter from '@routes/status.js';
import { env } from '@config/env.js';

const PORT = env.PORT || 4000;

const app = express();

app.use(helmet());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  ipv6Subnet: 56,
});

app.use(limiter);

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
app.use('/health', healthRouter);
app.use('/status', statusRouter);
app.use('/', registrationRouter);

app.use((_req, res) => res.status(404).send('Not found'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
