import { SignJWT, jwtVerify, JWTPayload } from 'jose';

import { env } from '@/config/env';

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type SessionPayload = JWTPayload & {
  sub: string;
  username: string;
  country_code: string;
  roles: string[];
};

export const signSession = async (payload: Omit<SessionPayload, 'iat' | 'exp'>) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);
};

export const verifySession = async (token: string): Promise<SessionPayload> => {
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  return payload as SessionPayload;
};
