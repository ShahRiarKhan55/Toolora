import { createHash } from 'node:crypto';
import type { Request } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { accessLevelOf, canAccess, resolveSubject } from '../src/access';
import { createApp } from '../src/app';
import { createAuth } from '../src/auth/auth';
import type { Database } from '../src/db';
import type { Logger } from '../src/logger';
import { createMigratedDatabase } from './migratedDb';

const errorLog = vi.fn();
const logger: Logger = { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: errorLog };
const PASSWORD = 'correct horse battery';
const NOW = new Date();

let db: Database;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await createMigratedDatabase();
  app = createApp({ logger, db });
});

afterAll(async () => {
  await db.close();
});

describe('accounts closed (launch configuration)', () => {
  it('answers /api/auth/* with a JSON 404 and never registers anyone', async () => {
    const closed = createApp({ logger, db, accountsEnabled: false });
    const res = await request(closed)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: 'closed@example.test', password: PASSWORD }));
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.headers['set-cookie']).toBeUndefined();
    expect((await request(closed).get('/api/auth/session')).status).toBe(404);
    expect((await request(closed).get('/api/health')).status).toBe(200);
  });
});

let counter = 0;
const newEmail = () => `user${++counter}@example.test`;

const post = (path: string, body: unknown) =>
  request(app).post(path).set('Content-Type', 'application/json').send(JSON.stringify(body));

const cookieOf = (res: request.Response): string => {
  const header = res.headers['set-cookie'] as string | string[] | undefined;
  const cookie = Array.isArray(header) ? header[0] : header;
  if (!cookie) throw new Error('no Set-Cookie header');
  return cookie;
};

/** "name=value" part only, as a browser would send it back. */
/** The user the API reports, typed once so tests do not poke at `any`. */
const userOf = (res: request.Response) => (res.body as { user: { email: string } | null }).user;

const cookieJar = (res: request.Response) => cookieOf(res).split(';')[0]!;

async function register(email = newEmail()) {
  const res = await post('/api/auth/register', { email, password: PASSWORD });
  return { email, res, cookie: cookieJar(res) };
}

describe('POST /api/auth/register', () => {
  it('creates an account, signs the user in and returns only id and email', async () => {
    const { email, res } = await register();
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ user: { id: expect.any(String) as string, email } });
    expect(res.text).not.toMatch(/password|hash|scrypt/i);
  });

  it('stores a scrypt hash, never the password', async () => {
    const { email } = await register();
    const row = await db.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(row.passwordHash).toMatch(/^scrypt\$/);
    expect(row.passwordHash).not.toContain(PASSWORD);
  });

  it('normalizes the email so case and padding cannot create a second account', async () => {
    const email = newEmail();
    const first = await post('/api/auth/register', {
      email: `  ${email.toUpperCase()} `,
      password: PASSWORD,
    });
    expect(first.body).toMatchObject({ user: { email } });
    const dup = await post('/api/auth/register', { email, password: PASSWORD });
    expect(dup.status).toBe(409);
    expect(dup.body).toEqual({
      error: { code: 'email_in_use', message: 'An account with this email already exists.' },
    });
    expect(dup.headers['set-cookie']).toBeUndefined();
  });

  it.each([
    ['not an email', 'nope'],
    ['missing', undefined],
    ['not a string', 42],
    ['too long', `${'a'.repeat(250)}@example.test`],
  ])('rejects an invalid email (%s)', async (_label, email) => {
    const res = await post('/api/auth/register', { email, password: PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      error: { code: 'invalid_request', message: 'Enter a valid email address.' },
    });
  });

  it.each([
    ['too short', 'short', 'Use at least 10 characters for your password.'],
    ['too long', 'x'.repeat(129), 'Passwords can be at most 128 characters.'],
    ['missing', undefined, 'Enter a password.'],
    ['not a string', 12345678901, 'Enter a password.'],
  ])('rejects a %s password', async (_label, password, message) => {
    const res = await post('/api/auth/register', { email: newEmail(), password });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: { code: 'invalid_request', message } });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('accepts a long passphrase made only of lower-case words (no composition rules)', async () => {
    const res = await post('/api/auth/register', {
      email: newEmail(),
      password: 'plain lowercase words only',
    });
    expect(res.status).toBe(201);
  });

  it('rejects an empty body, a non-object body and malformed JSON with JSON errors', async () => {
    const empty = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json');
    expect(empty.status).toBe(400);
    const array = await post('/api/auth/register', []);
    expect(array.status).toBe(400);
    const broken = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"email":');
    expect(broken.status).toBe(400);
    expect(broken.body).toEqual({
      error: { code: 'bad_request', message: 'The request could not be understood.' },
    });
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with valid credentials, ignoring email case, and sets the session cookie', async () => {
    const { email } = await register();
    const res = await post('/api/auth/login', { email: email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: { id: expect.any(String) as string, email } });
    expect(res.text).not.toMatch(/password|hash|scrypt/i);
    expect(cookieOf(res)).toMatch(/^toolora_session=[A-Za-z0-9_-]{43};/);
  });

  it('fails identically for a wrong password and an unknown email', async () => {
    const { email } = await register();
    const wrong = await post('/api/auth/login', { email, password: 'not the password' });
    const unknown = await post('/api/auth/login', { email: newEmail(), password: PASSWORD });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body).toEqual({
      error: { code: 'invalid_credentials', message: 'Incorrect email or password.' },
    });
    expect(wrong.headers['set-cookie']).toBeUndefined();
    expect(unknown.headers['set-cookie']).toBeUndefined();
  });

  it('sheds a flood of logins with a JSON 503 and still serves the next one', async () => {
    const { email } = await register();
    const flood = await Promise.all(
      Array.from({ length: 30 }, () =>
        post('/api/auth/login', { email: newEmail(), password: PASSWORD }),
      ),
    );
    const busy = flood.filter((res) => res.status === 503);
    expect(busy.length).toBeGreaterThan(0);
    expect(busy[0]?.body).toEqual({
      error: { code: 'busy', message: 'The server is busy. Try again in a moment.' },
    });
    expect(flood.every((res) => res.status === 401 || res.status === 503)).toBe(true);
    // A refusal must not leave the unknown-email path (dummy hash) or the slots broken.
    const next = await post('/api/auth/login', { email, password: PASSWORD });
    expect(next.status).toBe(200);
    expect((await post('/api/auth/login', { email: newEmail(), password: PASSWORD })).status).toBe(
      401,
    );
  });

  it.each([
    {},
    { email: 'a@b.test' },
    { email: 5, password: 'x' },
    { email: 'a@b.test', password: '' },
  ])('rejects malformed credentials %j with 400', async (body) => {
    const res = await post('/api/auth/login', body);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: { code: 'invalid_request' } });
  });

  it('issues a new token each time and drops the session it replaces', async () => {
    const { email, cookie: first } = await register();
    const res = await request(app)
      .post('/api/auth/login')
      .set('Cookie', first)
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email, password: PASSWORD }));
    const second = cookieJar(res);
    expect(second).not.toBe(first);
    expect((await request(app).get('/api/auth/session').set('Cookie', first)).body).toEqual({
      user: null,
    });
    expect(userOf(await request(app).get('/api/auth/session').set('Cookie', second))?.email).toBe(
      email,
    );
  });
});

describe('session cookie', () => {
  it('is HttpOnly, SameSite=Lax, path-wide, expiring, with no Domain; not Secure outside production', async () => {
    const { res } = await register();
    const cookie = cookieOf(res);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toMatch(/Expires=/);
    expect(cookie).not.toMatch(/Domain=/i);
    expect(cookie).not.toContain('Secure');
  });

  it('is Secure and __Host- prefixed in production', async () => {
    const prodApp = createApp({ logger, db, secureCookies: true });
    const res = await request(prodApp)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: newEmail(), password: PASSWORD }));
    const cookie = cookieOf(res);
    expect(cookie).toMatch(/^__Host-toolora_session=/);
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).not.toMatch(/Domain=/i);
    const me = await request(prodApp).get('/api/auth/session').set('Cookie', cookieJar(res));
    expect(userOf(me)).not.toBeNull();
  });

  it('is stored hashed: the raw token is not in the database or any response body', async () => {
    const { res, cookie } = await register();
    const token = cookie.split('=')[1]!;
    const rows = await db.prisma.session.findMany();
    expect(JSON.stringify(rows)).not.toContain(token);
    expect(rows.some((r) => r.tokenHash === createHash('sha256').update(token).digest('hex'))).toBe(
      true,
    );
    const me = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(res.text).not.toContain(token);
    expect(me.text).not.toContain(token);
  });
});

describe('GET /api/auth/session', () => {
  it('is anonymous without a cookie', async () => {
    const res = await request(app).get('/api/auth/session');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it('returns the signed-in user and nothing sensitive', async () => {
    const { email, cookie } = await register();
    const res = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(res.body).toEqual({ user: { id: expect.any(String) as string, email } });
    expect(res.text).not.toMatch(/password|hash|token|scrypt/i);
  });

  it.each([
    'toolora_session=garbage',
    `toolora_session=${'A'.repeat(43)}`,
    'toolora_session=',
    'other=1',
  ])('treats an invalid or unknown cookie (%s) as anonymous', async (cookie) => {
    const res = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ user: null });
  });

  it('rejects an expired session and removes it', async () => {
    const { cookie } = await register();
    await db.prisma.session.updateMany({
      where: { tokenHash: createHash('sha256').update(cookie.split('=')[1]!).digest('hex') },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const before = await db.prisma.session.count();
    const res = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(res.body).toEqual({ user: null });
    expect(await db.prisma.session.count()).toBe(before - 1);
  });

  it('is never cacheable', async () => {
    const res = await request(app).get('/api/auth/session');
    expect(res.headers['cache-control']).toBe('no-store');
  });
});

describe('POST /api/auth/logout', () => {
  it('invalidates the session server-side and clears the cookie', async () => {
    const { cookie } = await register();
    const out = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(out.status).toBe(200);
    expect(out.body).toEqual({ user: null });
    expect(cookieOf(out)).toMatch(/^toolora_session=;/);
    // The old cookie is dead even if a client keeps replaying it.
    const after = await request(app).get('/api/auth/session').set('Cookie', cookie);
    expect(after.body).toEqual({ user: null });
  });

  it('succeeds when already signed out', async () => {
    const res = await post('/api/auth/logout', {});
    expect(res.status).toBe(200);
  });
});

describe('CSRF and request shape', () => {
  it.each([
    ['Sec-Fetch-Site', 'cross-site'],
    ['Sec-Fetch-Site', 'same-site'],
    ['Origin', 'https://evil.example'],
    ['Origin', 'null'],
  ])('refuses a state-changing request with %s: %s', async (header, value) => {
    const { cookie } = await register();
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie)
      .set(header, value)
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({ error: { code: 'forbidden' } });
    // ...and the session survived the forged request.
    expect(
      userOf(await request(app).get('/api/auth/session').set('Cookie', cookie)),
    ).not.toBeNull();
  });

  it('allows same-origin browsers (Sec-Fetch-Site or a matching Origin)', async () => {
    const a = await request(app)
      .post('/api/auth/logout')
      .set('Sec-Fetch-Site', 'same-origin')
      .set('Content-Type', 'application/json')
      .send('{}');
    const b = await request(app)
      .post('/api/auth/logout')
      .set('Host', 'toolora.test')
      .set('Origin', 'https://toolora.test')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  it('refuses form-encoded and plain-text posts (what a cross-site <form> can send)', async () => {
    const form = await request(app)
      .post('/api/auth/login')
      .type('form')
      .send({ email: 'a@b.test', password: 'x' });
    const text = await request(app)
      .post('/api/auth/login')
      .type('text/plain')
      .send('{"email":"a"}');
    expect(form.status).toBe(415);
    expect(text.status).toBe(415);
    expect(form.body).toMatchObject({ error: { code: 'unsupported_media_type' } });
  });

  it('adds no CORS headers, even to a cross-origin preflight', async () => {
    const res = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('keeps unknown /api/auth routes and wrong methods as JSON 404s', async () => {
    for (const res of [
      await request(app).get('/api/auth/nope'),
      await request(app).get('/api/auth/login'),
      await request(app)
        .post('/api/auth/session')
        .set('Content-Type', 'application/json')
        .send('{}'),
    ]) {
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    }
  });
});

describe('logging and error hygiene', () => {
  it('never logs the password, token or hash through a full register/login/logout cycle', async () => {
    const calls: unknown[] = [];
    const spy: Logger = {
      debug: (...a) => calls.push(a),
      info: (...a) => calls.push(a),
      warn: (...a) => calls.push(a),
      error: (...a) => calls.push(a),
    };
    const loggedApp = createApp({ logger: spy, db });
    const email = newEmail();
    const secret = 'a very secret passphrase';
    const body = JSON.stringify({ email, password: secret });
    const reg = await request(loggedApp)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(body);
    const token = cookieJar(reg).split('=')[1]!;
    await request(loggedApp)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send(body);
    await request(loggedApp)
      .post('/api/auth/logout')
      .set('Cookie', cookieJar(reg))
      .set('Content-Type', 'application/json')
      .send('{}');
    const hash = (await db.prisma.user.findUniqueOrThrow({ where: { email } })).passwordHash;
    const log = JSON.stringify(calls);
    expect(calls.length).toBeGreaterThan(0);
    for (const sensitive of [secret, token, hash]) expect(log).not.toContain(sensitive);
  });

  it('hides database failures behind a generic 500 that echoes no input or hash', async () => {
    const failing = createApp({
      logger,
      db: {
        ...db,
        prisma: {
          user: {
            create: () => Promise.reject(new Error('boom: INSERT passwordHash=scrypt$secret')),
          },
        },
      } as unknown as Database,
    });
    const res = await request(failing)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ email: newEmail(), password: PASSWORD }));
    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: { code: 'internal_error', message: 'Something went wrong on our side.' },
    });
    expect(JSON.stringify(errorLog.mock.calls)).not.toContain('scrypt$secret');
  });
});

describe('access integration', () => {
  const fakeReq = (headers: Record<string, string> = {}, query = {}, body = {}) =>
    ({ headers, query, body }) as unknown as Request;
  const auth = () => createAuth({ prisma: db.prisma, secureCookies: false });

  it('resolves an anonymous request to the anonymous subject with public access', async () => {
    const subject = await resolveSubject(fakeReq(), auth());
    expect(subject).toEqual({ kind: 'anonymous' });
    expect(canAccess(subject, 'public', NOW)).toBe(true);
    expect(canAccess(subject, 'premium', NOW)).toBe(false);
  });

  it('resolves a real session to that user, who still holds only public access', async () => {
    const { email, cookie } = await register();
    const subject = await resolveSubject(fakeReq({ cookie }), auth());
    const row = await db.prisma.user.findUniqueOrThrow({ where: { email } });
    expect(subject).toEqual({ kind: 'user', userId: row.id, entitlements: [] });
    expect(accessLevelOf(subject, NOW)).toBe('public');
    expect(canAccess(subject, 'premium', NOW)).toBe(false);
  });

  it('lets a future server-written entitlement apply to the authenticated subject', async () => {
    const { cookie } = await register();
    const subject = await resolveSubject(fakeReq({ cookie }), auth());
    if (subject.kind !== 'user') throw new Error('expected a user');
    const granted = { ...subject, entitlements: [{ level: 'premium' as const, expiresAt: null }] };
    expect(canAccess(granted, 'premium', NOW)).toBe(true);
  });

  it('cannot be made premium by headers, query or body', async () => {
    const { cookie } = await register();
    const subject = await resolveSubject(
      fakeReq(
        {
          cookie,
          'x-user-id': 'admin',
          'x-entitlement': 'premium',
          authorization: 'Bearer premium',
        },
        { level: 'premium', entitlements: 'premium' },
        { entitlements: [{ level: 'premium', expiresAt: null }], kind: 'user', userId: 'admin' },
      ),
      auth(),
    );
    expect(canAccess(subject, 'premium', NOW)).toBe(false);
    const anon = await resolveSubject(
      fakeReq({ 'x-entitlement': 'premium' }, { level: 'premium' }, { entitlements: ['premium'] }),
      auth(),
    );
    expect(anon).toEqual({ kind: 'anonymous' });

    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send(
        JSON.stringify({
          email: newEmail(),
          password: PASSWORD,
          entitlements: ['premium'],
          level: 'premium',
        }),
      );
    expect(res.body).toEqual({
      user: { id: expect.any(String) as string, email: expect.any(String) as string },
    });
  });
});
