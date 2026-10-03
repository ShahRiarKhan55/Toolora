import { ACCESS_LEVELS, meetsAccessLevel } from '@toolora/shared';
import type { AccessLevel } from '@toolora/shared';
import type { Request } from 'express';
import type { Auth } from './auth/auth';

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
 * Who is making this request: the one boundary between HTTP and the access model. The only input
 * trusted is the HttpOnly session cookie, verified against the server's own session store. No
 * header, query or body value can name a user or an entitlement.
 *
 * Entitlements are always empty until the payment phase adds a server-written source for them, so
 * a signed-in user holds `public` access exactly like an anonymous visitor.
 */
export async function resolveSubject(
  req: Request,
  auth: Pick<Auth, 'userFromRequest'>,
): Promise<Subject> {
  const user = await auth.userFromRequest(req);
  return user ? { kind: 'user', userId: user.id, entitlements: [] } : ANONYMOUS;
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
