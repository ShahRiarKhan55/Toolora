import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { HttpError } from '../errors';

// scrypt from node:crypto: memory-hard, in the standard library, no dependency. The cost is stored
// inside every hash, so raising it later only affects new hashes and old ones keep verifying.
const COST = { N: 2 ** 16, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;

// Each scrypt run holds ~64 MB and a libuv thread (4 by default, shared with file reads), so an
// unauthenticated flood of logins would otherwise queue without limit and stall the whole site.
// Past this backlog we answer "busy" at once. It is a resource guard, not rate limiting: per-client
// throttling still belongs in front of the app (see docs/architecture.md, 6b).
const MAX_PENDING = 8;
let pending = 0;

function derive(
  password: string,
  salt: Buffer,
  { N, r, p }: { N: number; r: number; p: number },
): Promise<Buffer> {
  if (pending >= MAX_PENDING) {
    return Promise.reject(new HttpError(503, 'busy', 'The server is busy. Try again in a moment.'));
  }
  pending++;
  return new Promise((resolve, reject) => {
    // NFKC so the same password typed on a different keyboard/IME (e.g. full-width) still matches.
    const done = (err: Error | null, key?: Buffer) => {
      pending--;
      if (err || !key) reject(err ?? new Error('scrypt returned no key'));
      else resolve(key);
    };
    try {
      scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r, p, maxmem: 256 * N * r }, done);
    } catch (err) {
      // Invalid cost parameters throw synchronously, before any callback will run.
      done(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

/** `scrypt$N$r$p$salt$hash` (base64 salt and hash). */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, COST);
  return `scrypt$${COST.N}$${COST.r}$${COST.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

/** False for a wrong password and for a malformed stored hash alike. */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const cost = { N: Number(n), r: Number(r), p: Number(p) };
  if (!Number.isSafeInteger(cost.N) || cost.N < 2 || cost.N > 2 ** 20) return false;
  if (!Number.isSafeInteger(cost.r) || !Number.isSafeInteger(cost.p)) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await derive(password, Buffer.from(salt, 'base64'), cost).catch((err: unknown) => {
    if (err instanceof HttpError) throw err; // busy: not a verdict on the password
    return null;
  });
  return actual !== null && actual.length === expected.length && timingSafeEqual(actual, expected);
}
