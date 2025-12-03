import dotenv from 'dotenv';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from '@routes/auth.js';
import healthRoutes from '@routes/health.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();

app.set('trust proxy', 1);

const allowed = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({ origin: allowed, credentials: true }));

app.use(express.json());
app.use(cookieParser());
app.use('/auth', authRoutes);
app.get('/health', healthRoutes);

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
