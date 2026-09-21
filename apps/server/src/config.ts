import { z } from 'zod';
import type { LogThreshold } from './logger';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1).default('file:./prisma/dev.db'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).optional(),
});

export interface Config {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  logLevel: LogThreshold;
}

const defaultLogLevel = {
  development: 'debug',
  test: 'silent',
  production: 'info',
} as const satisfies Record<Config['nodeEnv'], LogThreshold>;

/** Validates the environment once at startup so misconfiguration fails fast with a clear message. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  const { NODE_ENV, PORT, DATABASE_URL, LOG_LEVEL } = parsed.data;
  return {
    nodeEnv: NODE_ENV,
    port: PORT,
    databaseUrl: DATABASE_URL,
    logLevel: LOG_LEVEL ?? defaultLogLevel[NODE_ENV],
  };
}
