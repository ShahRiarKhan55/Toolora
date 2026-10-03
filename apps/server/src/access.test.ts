import { describe, expect, it } from 'vitest';
import { accessLevelOf, ANONYMOUS, canAccess, resolveSubject } from './access';
import type { Subject } from './access';

const NOW = new Date('2026-06-15T00:00:00Z');
const user = (
  ...entitlements: Extract<Subject, { kind: 'user' }>['entitlements'][number][]
): Subject => ({
  kind: 'user',
  userId: 'u1',
  entitlements,
});

describe('access evaluation', () => {
  it('anonymous holds public only', () => {
    expect(accessLevelOf(ANONYMOUS, NOW)).toBe('public');
    expect(canAccess(ANONYMOUS, 'public', NOW)).toBe(true);
    expect(canAccess(ANONYMOUS, 'premium', NOW)).toBe(false);
  });

  it('a signed-in user without entitlements is still public', () => {
    expect(canAccess(user(), 'public', NOW)).toBe(true);
    expect(canAccess(user(), 'premium', NOW)).toBe(false);
  });

  it('a non-expiring or future entitlement grants premium', () => {
    expect(canAccess(user({ level: 'premium', expiresAt: null }), 'premium', NOW)).toBe(true);
    const later = new Date('2026-07-01T00:00:00Z');
    expect(canAccess(user({ level: 'premium', expiresAt: later }), 'premium', NOW)).toBe(true);
  });

  it('an entitlement stops applying exactly at its expiry', () => {
    const subject = user({ level: 'premium', expiresAt: NOW });
    expect(canAccess(subject, 'premium', new Date(NOW.getTime() - 1))).toBe(true);
    expect(canAccess(subject, 'premium', NOW)).toBe(false);
  });

  it('is deterministic for the same inputs', () => {
    const subject = user({ level: 'premium', expiresAt: null });
    expect(accessLevelOf(subject, NOW)).toBe(accessLevelOf(subject, NOW));
  });
});

describe('resolveSubject', () => {
  it('is anonymous, and takes no request so client claims cannot influence it', () => {
    expect(resolveSubject()).toEqual({ kind: 'anonymous' });
    expect(resolveSubject.length).toBe(0);
  });
});
