import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('uses development defaults when the environment is empty', () => {
    expect(loadConfig({})).toEqual({
      nodeEnv: 'development',
      port: 3001,
      databaseUrl: 'file:./prisma/dev.db',
      logLevel: 'debug',
      publicSiteOrigin: undefined,
    });
  });

  it('picks the default log level from NODE_ENV', () => {
    expect(loadConfig({ NODE_ENV: 'production' }).logLevel).toBe('info');
    expect(loadConfig({ NODE_ENV: 'test' }).logLevel).toBe('silent');
  });

  it('lets LOG_LEVEL override the default', () => {
    expect(loadConfig({ NODE_ENV: 'production', LOG_LEVEL: 'warn' }).logLevel).toBe('warn');
  });

  it('coerces PORT from a string', () => {
    expect(loadConfig({ PORT: '8080' }).port).toBe(8080);
  });

  it.each(['abc', '0', '70000', '-1', '3000.5'])('rejects PORT=%s', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(/PORT/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('rejects an empty DATABASE_URL', () => {
    expect(() => loadConfig({ DATABASE_URL: '' })).toThrow(/DATABASE_URL/);
  });

  it('resolves publicSiteOrigin from VITE_PUBLIC_SITE_URL, trailing slash stripped', () => {
    expect(loadConfig({ VITE_PUBLIC_SITE_URL: 'https://toolora.example/' }).publicSiteOrigin).toBe(
      'https://toolora.example',
    );
  });

  it('leaves publicSiteOrigin undefined when VITE_PUBLIC_SITE_URL is unset or blank', () => {
    expect(loadConfig({}).publicSiteOrigin).toBeUndefined();
    expect(loadConfig({ VITE_PUBLIC_SITE_URL: '' }).publicSiteOrigin).toBeUndefined();
  });
});
