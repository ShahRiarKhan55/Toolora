import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLogger } from './logger';

afterEach(() => {
  vi.restoreAllMocks();
});

function spyOnConsole() {
  return {
    log: vi.spyOn(console, 'log').mockImplementation(() => undefined),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => undefined),
    error: vi.spyOn(console, 'error').mockImplementation(() => undefined),
  };
}

describe('createLogger', () => {
  it('drops messages below the threshold', () => {
    const spies = spyOnConsole();
    const logger = createLogger({ level: 'warn', json: true });

    logger.debug('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(spies.log).not.toHaveBeenCalled();
    expect(spies.warn).toHaveBeenCalledTimes(1);
    expect(spies.error).toHaveBeenCalledTimes(1);
  });

  it('writes nothing when silent', () => {
    const spies = spyOnConsole();
    const logger = createLogger({ level: 'silent', json: true });

    logger.error('boom');

    expect(spies.error).not.toHaveBeenCalled();
  });

  it('emits one parseable JSON object per line in json mode, including error details', () => {
    const spies = spyOnConsole();
    const logger = createLogger({ level: 'debug', json: true });

    logger.error('failed', { requestId: 'abc', err: new Error('kaput') });

    const line = spies.error.mock.calls[0]?.[0] as string;
    const entry = JSON.parse(line) as Record<string, unknown>;
    expect(entry).toMatchObject({ level: 'error', message: 'failed', requestId: 'abc' });
    expect(entry['err']).toMatchObject({ name: 'Error', message: 'kaput' });
    expect(entry['time']).toEqual(expect.any(String));
  });

  it('prints a readable line plus the raw metadata object in development mode', () => {
    const spies = spyOnConsole();
    const logger = createLogger({ level: 'debug', json: false });

    logger.info('hello', { a: 1 });
    logger.info('bare');

    expect(spies.log).toHaveBeenNthCalledWith(1, expect.stringMatching(/INFO {2}hello$/), { a: 1 });
    expect(spies.log).toHaveBeenNthCalledWith(2, expect.stringMatching(/INFO {2}bare$/));
  });
});
