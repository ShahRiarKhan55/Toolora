import { describe, expect, it } from 'vitest';
import { absoluteUrl, resolvePublicSiteOrigin } from './url';

describe('resolvePublicSiteOrigin', () => {
  it('returns undefined when unset', () => {
    expect(resolvePublicSiteOrigin(undefined)).toBeUndefined();
  });

  it('returns undefined for a blank or whitespace-only value', () => {
    expect(resolvePublicSiteOrigin('')).toBeUndefined();
    expect(resolvePublicSiteOrigin('   ')).toBeUndefined();
  });

  it('trims surrounding whitespace', () => {
    expect(resolvePublicSiteOrigin('  https://toolora.example  ')).toBe('https://toolora.example');
  });

  it('strips a single trailing slash', () => {
    expect(resolvePublicSiteOrigin('https://toolora.example/')).toBe('https://toolora.example');
  });

  it('strips multiple trailing slashes', () => {
    expect(resolvePublicSiteOrigin('https://toolora.example///')).toBe('https://toolora.example');
  });

  it('leaves a value with no trailing slash unchanged', () => {
    expect(resolvePublicSiteOrigin('https://toolora.example')).toBe('https://toolora.example');
  });
});

describe('absoluteUrl', () => {
  it('returns the path unchanged when no origin is configured', () => {
    expect(absoluteUrl(undefined, '/tools')).toBe('/tools');
  });

  it('joins origin and path with exactly one slash', () => {
    expect(absoluteUrl('https://toolora.example', '/tools')).toBe('https://toolora.example/tools');
  });

  it('never produces a double slash, even if the path also starts with one', () => {
    expect(absoluteUrl('https://toolora.example', '//tools')).toBe('https://toolora.example/tools');
  });

  it('adds a leading slash to a path that is missing one', () => {
    expect(absoluteUrl('https://toolora.example', 'tools')).toBe('https://toolora.example/tools');
    expect(absoluteUrl(undefined, 'tools')).toBe('/tools');
  });

  it('handles the root path', () => {
    expect(absoluteUrl('https://toolora.example', '/')).toBe('https://toolora.example/');
    expect(absoluteUrl(undefined, '/')).toBe('/');
  });
});
