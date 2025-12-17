import type { CookieOptions } from 'express';

import { env } from '@/config/env';

export const defaultCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
};

export const publicCookieOptions: CookieOptions = {
  ...defaultCookieOptions,
  httpOnly: false,
};
