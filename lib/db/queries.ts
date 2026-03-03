import { eq } from 'drizzle-orm';
import { db } from './drizzle';
import { users, User } from './schema';
import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';

export async function getUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  let user: User | undefined;

  if (typeof session.user.id === 'number') {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);
  } else if (typeof session.user.email === 'string' && session.user.email.length > 0) {
    [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email.toLowerCase()))
      .limit(1);
  }

  return user || null;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect('/sign-in');
  }
  return user;
}
