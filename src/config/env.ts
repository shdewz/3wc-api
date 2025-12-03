import dotenv from 'dotenv';
import { z } from 'zod';

const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.dev';

process.env.DOTENV_CONFIG_QUIET = 'true';
dotenv.config({ path: envFile });

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.string().default('4000'),
  BASE_URL: z.url().optional(),

  FRONTEND_URL: z.url().optional(),

  OSU_CLIENT_ID: z.string().min(1),
  OSU_CLIENT_SECRET: z.string().min(1),
  OSU_REDIRECT_PATH: z.string().default('/auth/osu/callback'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be a long random string'),
  COOKIE_NAME: z.string().default('session'),

  DATABASE_URL: z.string().min(1),
});

const raw = EnvSchema.parse(process.env);

const isProd = raw.NODE_ENV === 'production';
const defaultBase = isProd ? undefined : `http://localhost:${raw.PORT}`;

const BASE_URL = raw.BASE_URL ?? defaultBase;

if (!BASE_URL) {
  throw new Error('BASE_URL is required in production.');
}

export const env = {
  NODE_ENV: raw.NODE_ENV,
  PORT: Number(raw.PORT),
  BASE_URL,
  FRONTEND_URL: raw.FRONTEND_URL,
  OSU_CLIENT_ID: raw.OSU_CLIENT_ID,
  OSU_CLIENT_SECRET: raw.OSU_CLIENT_SECRET,
  OSU_REDIRECT_PATH: raw.OSU_REDIRECT_PATH,
  OSU_REDIRECT_URI: new URL(raw.OSU_REDIRECT_PATH, BASE_URL).toString(),
  JWT_SECRET: raw.JWT_SECRET,
  COOKIE_NAME: raw.COOKIE_NAME,
  DATABASE_URL: raw.DATABASE_URL,
  IS_PROD: isProd,
};
