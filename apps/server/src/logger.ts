export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogThreshold = LogLevel | 'silent';
export type LogMeta = Record<string, unknown>;

export interface Logger {
  debug(message: string, meta?: LogMeta): void;
  info(message: string, meta?: LogMeta): void;
  warn(message: string, meta?: LogMeta): void;
  error(message: string, meta?: LogMeta): void;
}

const severity: Record<LogThreshold, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

const sink: Record<LogLevel, (...args: unknown[]) => void> = {
  debug: (...args) => console.log(...args),
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};

/** Error objects do not survive JSON.stringify, so flatten them (stack included) for log lines. */
function serializeMeta(meta: LogMeta): LogMeta {
  return Object.fromEntries(
    Object.entries(meta).map(([key, value]) => [
      key,
      value instanceof Error
        ? { name: value.name, message: value.message, stack: value.stack }
        : value,
    ]),
  );
}

/**
 * Minimal leveled logger. Production emits one JSON object per line (easy to ship anywhere);
 * development prints readable lines and lets Node pretty-print objects and stack traces.
 * Stack traces only ever go to logs, never into HTTP responses.
 */
export function createLogger(options: { level: LogThreshold; json: boolean }): Logger {
  const write = (level: LogLevel, message: string, meta: LogMeta = {}) => {
    if (severity[level] < severity[options.level]) return;
    const time = new Date().toISOString();
    const hasMeta = Object.keys(meta).length > 0;

    if (options.json) {
      sink[level](JSON.stringify({ time, level, message, ...serializeMeta(meta) }));
    } else if (hasMeta) {
      sink[level](`${time} ${level.toUpperCase().padEnd(5)} ${message}`, meta);
    } else {
      sink[level](`${time} ${level.toUpperCase().padEnd(5)} ${message}`);
    }
  };

  return {
    debug: (message, meta) => write('debug', message, meta),
    info: (message, meta) => write('info', message, meta),
    warn: (message, meta) => write('warn', message, meta),
    error: (message, meta) => write('error', message, meta),
  };
}
