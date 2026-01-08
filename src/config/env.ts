import dotenv from 'dotenv';
import { z } from 'zod';

if (process.env.NODE_ENV !== 'production') {
  process.env.DOTENV_CONFIG_QUIET = 'true';
  const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env.dev';

  dotenv.config({ path: envFile });
}

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z.string().default('4000'),

  BASE_URL: z.url().optional(),
  FRONTEND_URL: z.url().optional(),

  REGISTRATION_START: z.string().optional(),
  REGISTRATION_END: z.string().optional(),

  OSU_CLIENT_ID: z.string().min(1),
  OSU_CLIENT_SECRET: z.string().min(1),
  OSU_REDIRECT_PATH: z.string().default('auth/osu/callback'),

  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_CLIENT_SECRET: z.string().min(1),
  DISCORD_REDIRECT_PATH: z.string().default('auth/discord/callback'),
  DISCORD_BOT_TOKEN: z.string().min(1),
  DISCORD_GUILD_ID: z.string().min(1),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET should be a long random string'),
  COOKIE_NAME: z.string().default('session'),

  DATABASE_URL: z.string().min(1),
});

const raw = EnvSchema.parse(process.env);

const isProd = raw.NODE_ENV === 'production';
const defaultBase = isProd ? undefined : `http://localhost:${raw.PORT}/`;

let BASE_URL = raw.BASE_URL ?? defaultBase;

if (!BASE_URL) throw new Error('BASE_URL is required in production.');

if (!BASE_URL.endsWith('/')) BASE_URL += '/';

const OSU_REDIRECT_PATH = raw.OSU_REDIRECT_PATH.replace(/^\/+/, '');
const OSU_REDIRECT_URI = new URL(OSU_REDIRECT_PATH, BASE_URL).toString();

const DISCORD_REDIRECT_PATH = raw.DISCORD_REDIRECT_PATH.replace(/^\/+/, '');
const DISCORD_REDIRECT_URI = new URL(DISCORD_REDIRECT_PATH, BASE_URL).toString();

export const env = {
  NODE_ENV: raw.NODE_ENV,
  PORT: Number(raw.PORT),
  BASE_URL,
  FRONTEND_URL: raw.FRONTEND_URL,

  REGISTRATION_START: raw.REGISTRATION_START,
  REGISTRATION_END: raw.REGISTRATION_END,

  OSU_CLIENT_ID: raw.OSU_CLIENT_ID,
  OSU_CLIENT_SECRET: raw.OSU_CLIENT_SECRET,
  OSU_REDIRECT_PATH,
  OSU_REDIRECT_URI,

  DISCORD_CLIENT_ID: raw.DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET: raw.DISCORD_CLIENT_SECRET,
  DISCORD_REDIRECT_PATH,
  DISCORD_REDIRECT_URI,
  DISCORD_BOT_TOKEN: raw.DISCORD_BOT_TOKEN,
  DISCORD_GUILD_ID: raw.DISCORD_GUILD_ID,

  JWT_SECRET: raw.JWT_SECRET,
  COOKIE_NAME: raw.COOKIE_NAME,
  DATABASE_URL: raw.DATABASE_URL,
  IS_PROD: isProd,
};
