'use server';

import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { users } from '@/lib/db/schema';
import { comparePasswords } from '@/lib/auth/session';
import { setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { validatedAction } from '@/lib/auth/middleware';
import {
  extractRequestIpFromHeaders,
  getActiveLockout,
  registerLoginFailure,
  registerLoginSuccess,
} from '@/lib/auth/login-guard';

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const requestHeaders = await headers();
  const requestIp = extractRequestIpFromHeaders(requestHeaders);
  const normalizedEmail = data.email.toLowerCase().trim();

  // Honeypot: if the hidden "website" field is filled, it's a bot
  const honeypot = formData.get('website');
  if (honeypot) {
    await registerLoginFailure(normalizedEmail, requestIp);
    return { error: 'Invalid email or password' };
  }

  const lockout = await getActiveLockout(normalizedEmail, requestIp);
  if (lockout) {
    return { error: 'Invalid email or password' };
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!user) {
    await registerLoginFailure(normalizedEmail, requestIp);
    return { error: 'Invalid email or password' };
  }

  const isPasswordValid = await comparePasswords(data.password, user.passwordHash);
  if (!isPasswordValid) {
    await registerLoginFailure(normalizedEmail, requestIp);
    return { error: 'Invalid email or password' };
  }

  await registerLoginSuccess(normalizedEmail, requestIp);
  await setSession(user);
  redirect('/dashboard');
});
