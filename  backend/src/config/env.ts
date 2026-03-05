/**
 * Environment Variable Configuration
 *
 * Loads `.env` via dotenv, then validates every variable against a strict Zod
 * schema before the application boots.  If any required variable is missing or
 * malformed the process exits immediately with a descriptive error so the
 * misconfiguration is caught at startup rather than at runtime.
 *
 * Exported `env` object provides type-safe access to all environment variables
 * with sensible defaults already applied.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('10'),
  CORS_ORIGIN: z.string().default('*'),
});

const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error('❌ Invalid environment variables:');
  console.error(envValidation.error.format());
  process.exit(1);
}

export const env = envValidation.data;
