import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, client } from '@/lib/db/drizzle';
import { authLockouts, authLoginAttempts } from '@/lib/db/schema';

async function main() {
  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const [failed24hRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(authLoginAttempts)
    .where(
      and(
        eq(authLoginAttempts.success, false),
        gte(authLoginAttempts.createdAt, since24h)
      )
    );

  const [activeLockoutsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(authLockouts)
    .where(gte(authLockouts.lockedUntil, now));

  const [lastSuccessRow] = await db
    .select({ createdAt: authLoginAttempts.createdAt })
    .from(authLoginAttempts)
    .where(
      and(
        eq(authLoginAttempts.success, true),
        eq(authLoginAttempts.scopeType, 'email')
      )
    )
    .orderBy(desc(authLoginAttempts.createdAt))
    .limit(1);

  const lockouts = await db
    .select({
      scopeType: authLockouts.scopeType,
      strikeLevel: authLockouts.strikeLevel,
      lockedUntil: authLockouts.lockedUntil,
    })
    .from(authLockouts)
    .where(gte(authLockouts.lockedUntil, now))
    .orderBy(desc(authLockouts.lockedUntil))
    .limit(20);

  console.log('Security Report');
  console.log(`- Failed login attempts (24h): ${Number(failed24hRow?.count || 0)}`);
  console.log(`- Active lockouts: ${Number(activeLockoutsRow?.count || 0)}`);
  console.log(
    `- Last successful login: ${lastSuccessRow?.createdAt?.toISOString() || 'none'}`
  );

  if (lockouts.length > 0) {
    console.log('- Active lockout details:');
    for (const lockout of lockouts) {
      console.log(
        `  - scope=${lockout.scopeType}, strike=${lockout.strikeLevel}, lockedUntil=${lockout.lockedUntil.toISOString()}`
      );
    }
  }
}

main()
  .catch((error) => {
    console.error('security_report failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
