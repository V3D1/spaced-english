import { and, eq } from 'drizzle-orm';
import { db, client } from '@/lib/db/drizzle';
import { authLockouts } from '@/lib/db/schema';
import { createScopeHash } from '@/lib/auth/login-guard';

type ScopeType = 'ip' | 'email';

function getArg(name: string) {
  const idx = process.argv.indexOf(name);
  if (idx < 0) {
    return null;
  }
  return process.argv[idx + 1] || null;
}

async function main() {
  const scopeType = getArg('--scope-type') as ScopeType | null;
  const scopeValue = getArg('--scope-value');
  const all = process.argv.includes('--all');

  if (all) {
    await db.delete(authLockouts);
    console.log('All lockouts removed.');
    return;
  }

  if (!scopeType || !scopeValue || !['ip', 'email'].includes(scopeType)) {
    console.error(
      'Usage: pnpm security:unlock --all OR pnpm security:unlock --scope-type email|ip --scope-value <value>'
    );
    process.exitCode = 1;
    return;
  }

  const scopeHash = createScopeHash(scopeType, scopeValue.trim().toLowerCase());
  await db
    .delete(authLockouts)
    .where(and(eq(authLockouts.scopeType, scopeType), eq(authLockouts.scopeHash, scopeHash)));

  console.log(`Lockouts removed for scope ${scopeType}.`);
}

main()
  .catch((error) => {
    console.error('security_unlock failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end({ timeout: 5 });
  });
