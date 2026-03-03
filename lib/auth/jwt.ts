import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/lib/env';

function getKey() {
  return new TextEncoder().encode(env.AUTH_SECRET);
}

export type SessionData = {
  user: { id?: number; email?: string };
  expires: string;
};

export function getSessionTtlDays() {
  return env.SESSION_TTL_DAYS;
}

export function getSessionExpiryDate() {
  return new Date(Date.now() + getSessionTtlDays() * 24 * 60 * 60 * 1000);
}

export async function signToken(payload: SessionData) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${getSessionTtlDays()} days from now`)
    .sign(getKey());
}

export async function verifyToken(input: string) {
  const { payload } = await jwtVerify(input, getKey(), {
    algorithms: ['HS256'],
  });
  return payload as SessionData;
}
