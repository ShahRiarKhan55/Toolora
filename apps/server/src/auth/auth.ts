import { createHash, randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import { HttpError } from '../errors';
import type { PrismaClient } from '../generated/prisma/client';
import { hashPassword, verifyPassword } from './password';

export const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

export interface AuthUser {
  id: string;
  email: string;
}

export type Auth = ReturnType<typeof createAuth>;

// 32 random bytes as base64url. Anything else in the cookie is rejected without touching the DB.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

/** Hashed once, lazily, so an unknown email costs the same time as a wrong password. */
let dummyHash: Promise<string> | undefined;

function invalidCredentials(): HttpError {
  return new HttpError(401, 'invalid_credentials', 'Incorrect email or password.');
}

/**
 * Accounts and cookie sessions. The session token is random (not derived from anything), lives only
 * in the browser's HttpOnly cookie, and only its SHA-256 is stored: a leaked database cannot be
 * replayed as logins. SHA-256 is fine here because the token has 256 bits of entropy, unlike a password.
 */
export function createAuth({
  prisma,
  secureCookies,
}: {
  prisma: PrismaClient;
  /** True in production: the cookie is then HTTPS-only and gets the `__Host-` prefix. */
  secureCookies: boolean;
}) {
  // `__Host-` makes browsers refuse the cookie unless it is Secure, Path=/ and has no Domain.
  const cookieName = secureCookies ? '__Host-toolora_session' : 'toolora_session';
  const cookieOptions = {
    httpOnly: true,
    secure: secureCookies,
    sameSite: 'lax',
    path: '/',
  } as const;

  function tokenFrom(req: Request): string | null {
    for (const part of (req.headers.cookie ?? '').split(';')) {
      const [name, ...value] = part.trim().split('=');
      if (name === cookieName) {
        const token = value.join('=');
        return TOKEN_PATTERN.test(token) ? token : null;
      }
    }
    return null;
  }

  async function dropSession(req: Request): Promise<void> {
    const token = tokenFrom(req);
    if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  return {
    async register(email: string, password: string): Promise<AuthUser> {
      const passwordHash = await hashPassword(password);
      try {
        const { id } = await prisma.user.create({ data: { email, passwordHash } });
        return { id, email };
      } catch (err) {
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
          throw new HttpError(409, 'email_in_use', 'An account with this email already exists.');
        }
        // The message is deliberately generic: Prisma errors can echo the query's data, hash included.
        // The original rides along as `cause`, which the logger does not serialize.
        throw new Error('Creating the account failed.', { cause: err });
      }
    },

    async verifyLogin(email: string, password: string): Promise<AuthUser> {
      const user = await prisma.user.findUnique({ where: { email } });
      dummyHash ??= hashPassword(randomBytes(16).toString('hex'));
      const ok = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
      if (!user || !ok) throw invalidCredentials();
      return { id: user.id, email: user.email };
    },

    /** Replaces whatever session the request carried: a new token on every authentication. */
    async startSession(req: Request, res: Response, userId: string): Promise<void> {
      await dropSession(req);
      const token = randomBytes(32).toString('base64url');
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
      await prisma.session.deleteMany({ where: { userId, expiresAt: { lte: new Date() } } });
      await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
      res.cookie(cookieName, token, { ...cookieOptions, expires: expiresAt });
    },

    async endSession(req: Request, res: Response): Promise<void> {
      await dropSession(req);
      res.clearCookie(cookieName, cookieOptions);
    },

    /** The user behind the request's session cookie, or null (none, unknown or expired). */
    async userFromRequest(req: Request): Promise<AuthUser | null> {
      const token = tokenFrom(req);
      if (!token) return null;
      const tokenHash = hashToken(token);
      const session = await prisma.session.findUnique({
        where: { tokenHash },
        include: { user: { select: { id: true, email: true } } },
      });
      if (!session) return null;
      if (session.expiresAt.getTime() <= Date.now()) {
        await prisma.session.deleteMany({ where: { tokenHash } });
        return null;
      }
      return session.user;
    },

    async findUser(id: string): Promise<AuthUser | null> {
      return prisma.user.findUnique({ where: { id }, select: { id: true, email: true } });
    },
  };
}
