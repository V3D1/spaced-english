import { z } from 'zod';

const envSchema = z.object({
  POSTGRES_URL: z.string().min(1, 'POSTGRES_URL is required'),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters. Generate with: openssl rand -base64 32'),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(90),
  LOGIN_RATE_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  LOGIN_RATE_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(5),
  LOGIN_LOCKOUT_LEVELS_MINUTES: z.string().default('15,60,1440'),
  AUTH_LOG_RETENTION_DAYS: z.coerce.number().int().min(1).default(30),
  SEED_USER_EMAIL: z.string().email().optional(),
  SEED_USER_PASSWORD: z.string().min(12).optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_DAILY_LIMIT: z.coerce.number().int().default(20),
});

function parseEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid environment variables:\n${formatted}`);
  }
  return result.data;
}

export const env = parseEnv();
