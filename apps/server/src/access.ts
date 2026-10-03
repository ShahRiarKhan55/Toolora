import { ACCESS_LEVELS, meetsAccessLevel } from '@toolora/shared';
import type { AccessLevel } from '@toolora/shared';

// Server-side authority on "who may use what". Lives in apps/server (not shared) so the browser
// bundle cannot import it and nothing client-side can pose as the decision-maker.

/** A grant of a level above `public`. Later written only by the server, e.g. after a verified
 *  payment-provider webhook; `expiresAt: null` = does not expire. */
export interface Entitlement {
  level: Exclude<AccessLevel, 'public'>;
  expiresAt: Date | null;
}

export type Subject =
  { kind: 'anonymous' } | { kind: 'user'; userId: string; entitlements: readonly Entitlement[] };

export const ANONYMOUS: Subject = { kind: 'anonymous' };

/**
 * Who is making this request. Authentication does not exist yet, so this is always anonymous and
 * takes no request on purpose, so no header, cookie, query or body value can make anyone premium.
 * When accounts arrive, add a parameter for a verified server-side session only.
 */
export function resolveSubject(): Subject {
  return ANONYMOUS;
}

/** The highest level `subject` holds at `now`; expired entitlements are ignored. */
export function accessLevelOf(subject: Subject, now: Date): AccessLevel {
  if (subject.kind === 'anonymous') return 'public';
  let held: AccessLevel = 'public';
  for (const { level, expiresAt } of subject.entitlements) {
    if (expiresAt !== null && expiresAt.getTime() <= now.getTime()) continue;
    if (ACCESS_LEVELS.indexOf(level) > ACCESS_LEVELS.indexOf(held)) held = level;
  }
  return held;
}

export function canAccess(subject: Subject, required: AccessLevel, now: Date): boolean {
  return meetsAccessLevel(accessLevelOf(subject, now), required);
}
