import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';
import { NewUser } from '@/lib/db/schema';
import { getSessionExpiryDate, signToken, verifyToken } from './jwt';

export { signToken, verifyToken } from './jwt';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string
) {
  return compare(plainTextPassword, hashedPassword);
}

export async function getSession() {
  const session = (await cookies()).get('session')?.value;
  if (!session) return null;
  return await verifyToken(session);
}

export async function setSession(user: NewUser) {
  const expiresAt = getSessionExpiryDate();
  const encryptedSession = await signToken({
    user: { id: user.id! },
    expires: expiresAt.toISOString(),
  });
  (await cookies()).set('session', encryptedSession, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
}
