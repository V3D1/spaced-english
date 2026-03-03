import { createHmac } from 'node:crypto';
import { and, eq, gte, lt, or, sql, desc } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { authLockouts, authLoginAttempts } from '@/lib/db/schema';

type ScopeType = 'ip' | 'email';

type Scope = {
  type: ScopeType;
  hash: string;
};

const DEFAULT_WINDOW_MINUTES = 15;
const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_LEVELS = [15, 60, 1440];
const DEFAULT_RETENTION_DAYS = 30;
const STRIKE_RESET_HOURS = 24;

function parsePositiveInt(raw: string | undefined, fallback: number) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET is required and must be at least 32 characters.');
  }
  return secret;
}

function getWindowMinutes() {
  return parsePositiveInt(process.env.LOGIN_RATE_WINDOW_MINUTES, DEFAULT_WINDOW_MINUTES);
}

function getMaxAttempts() {
  return parsePositiveInt(process.env.LOGIN_RATE_MAX_ATTEMPTS, DEFAULT_MAX_ATTEMPTS);
}

function getRetentionDays() {
  return parsePositiveInt(process.env.AUTH_LOG_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
}

function getLockoutLevelsMinutes() {
  const raw = process.env.LOGIN_LOCKOUT_LEVELS_MINUTES;
  if (!raw) {
    return DEFAULT_LOCKOUT_LEVELS;
  }

  const levels = raw
    .split(',')
    .map((v) => parsePositiveInt(v.trim(), 0))
    .filter((v) => v > 0);

  return levels.length > 0 ? levels : DEFAULT_LOCKOUT_LEVELS;
}

export function createScopeHash(type: ScopeType, value: string) {
  return createHmac('sha256', getAuthSecret())
    .update(`${type}:${value}`)
    .digest('hex');
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeIp(ip: string) {
  return ip.trim().toLowerCase();
}

export function extractRequestIpFromHeaders(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return normalizeIp(forwarded.split(',')[0] || 'unknown');
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return normalizeIp(realIp);
  }
  return 'unknown';
}

function buildScopes(email: string, ip: string): Scope[] {
  const normalizedEmail = normalizeEmail(email);
  const normalizedIp = normalizeIp(ip);
  return [
    { type: 'email', hash: createScopeHash('email', normalizedEmail) },
    { type: 'ip', hash: createScopeHash('ip', normalizedIp) },
  ];
}

function scopePredicate(scope: Scope) {
  return and(
    eq(authLockouts.scopeType, scope.type),
    eq(authLockouts.scopeHash, scope.hash)
  );
}

async function countRecentFailures(scope: Scope, windowStart: Date) {
  const [row] = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(authLoginAttempts)
    .where(
      and(
        eq(authLoginAttempts.scopeType, scope.type),
        eq(authLoginAttempts.scopeHash, scope.hash),
        eq(authLoginAttempts.success, false),
        gte(authLoginAttempts.createdAt, windowStart)
      )
    );

  return Number(row?.count || 0);
}

async function upsertLockout(scope: Scope, now: Date) {
  const levelsMinutes = getLockoutLevelsMinutes();
  const escalationWindowStart = new Date(
    now.getTime() - STRIKE_RESET_HOURS * 60 * 60 * 1000
  );

  const [existing] = await db
    .select()
    .from(authLockouts)
    .where(
      and(
        eq(authLockouts.scopeType, scope.type),
        eq(authLockouts.scopeHash, scope.hash)
      )
    )
    .limit(1);

  if (!existing) {
    const lockedUntil = new Date(now.getTime() + levelsMinutes[0] * 60 * 1000);
    await db.insert(authLockouts).values({
      scopeType: scope.type,
      scopeHash: scope.hash,
      strikeLevel: 1,
      lockedUntil,
      lastFailedAt: now,
      updatedAt: now,
    });
    return;
  }

  const shouldEscalate = existing.lastFailedAt >= escalationWindowStart;
  const nextStrike = shouldEscalate
    ? Math.min(existing.strikeLevel + 1, levelsMinutes.length)
    : 1;
  const lockoutMinutes = levelsMinutes[nextStrike - 1];
  const lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);

  await db
    .update(authLockouts)
    .set({
      strikeLevel: nextStrike,
      lockedUntil,
      lastFailedAt: now,
      updatedAt: now,
    })
    .where(
      and(
        eq(authLockouts.scopeType, scope.type),
        eq(authLockouts.scopeHash, scope.hash)
      )
    );
}

export async function pruneAuthSecurityData() {
  const retentionDays = getRetentionDays();
  const now = new Date();
  const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

  await db
    .delete(authLoginAttempts)
    .where(lt(authLoginAttempts.createdAt, cutoff));

  await db.delete(authLockouts).where(lt(authLockouts.updatedAt, cutoff));
}

export async function getActiveLockout(email: string, ip: string) {
  const now = new Date();
  const scopes = buildScopes(email, ip);

  const [lockout] = await db
    .select()
    .from(authLockouts)
    .where(
      and(
        or(...scopes.map(scopePredicate)),
        gte(authLockouts.lockedUntil, now)
      )
    )
    .orderBy(desc(authLockouts.lockedUntil))
    .limit(1);

  return lockout || null;
}

export async function registerLoginFailure(email: string, ip: string) {
  await pruneAuthSecurityData();

  const now = new Date();
  const windowStart = new Date(now.getTime() - getWindowMinutes() * 60 * 1000);
  const scopes = buildScopes(email, ip);

  await db.insert(authLoginAttempts).values(
    scopes.map((scope) => ({
      scopeType: scope.type,
      scopeHash: scope.hash,
      success: false,
      createdAt: now,
    }))
  );

  for (const scope of scopes) {
    const recentFailures = await countRecentFailures(scope, windowStart);
    if (recentFailures >= getMaxAttempts()) {
      await upsertLockout(scope, now);
    }
  }
}

export async function registerLoginSuccess(email: string, ip: string) {
  await pruneAuthSecurityData();

  const now = new Date();
  const scopes = buildScopes(email, ip);

  await db.insert(authLoginAttempts).values(
    scopes.map((scope) => ({
      scopeType: scope.type,
      scopeHash: scope.hash,
      success: true,
      createdAt: now,
    }))
  );

  await db
    .delete(authLockouts)
    .where(or(...scopes.map(scopePredicate)));
}
