import { Router } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';
import { resolveSubject } from '../access';
import type { Auth } from '../auth/auth';
import { normalizeEmail } from '../auth/auth';
import { HttpError } from '../errors';

const EMAIL_MESSAGE = 'Enter a valid email address.';
const email = z
  .string(EMAIL_MESSAGE)
  .max(254, EMAIL_MESSAGE)
  .transform(normalizeEmail)
  .pipe(z.email(EMAIL_MESSAGE));

// Length, not composition rules (NIST 800-63B). The upper bound only limits hashing work per request.
const registerBody = z.object({
  email,
  password: z
    .string('Enter a password.')
    .min(10, 'Use at least 10 characters for your password.')
    .max(128, 'Passwords can be at most 128 characters.'),
});

// Login accepts any well-formed pair: policy errors would only tell an attacker about the rules.
const loginBody = z.object({
  email: z.string().max(254).transform(normalizeEmail),
  password: z.string().min(1).max(128),
});

function parse<T>(schema: z.ZodType<T>, body: unknown, fallback: string): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(400, 'invalid_request', result.error.issues[0]?.message ?? fallback);
  }
  return result.data;
}

/**
 * CSRF defence for the cookie session (see docs/architecture.md, "Accounts"): the cookie is
 * SameSite=Lax so browsers do not attach it to cross-site POSTs, and on top of that every
 * state-changing request must be same-origin JSON. Browsers state where a request came from in
 * `Sec-Fetch-Site`; for those that do not, a present `Origin` must match `Host`. A request with
 * neither header is not a cross-site browser request. There is no CORS, so a foreign page cannot
 * send `application/json` here without a preflight that is refused.
 */
const sameOriginJson: RequestHandler = (req, _res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    next();
    return;
  }
  const fetchSite = req.get('sec-fetch-site');
  const origin = req.get('origin');
  let sameOrigin: boolean;
  if (fetchSite !== undefined) {
    sameOrigin = fetchSite === 'same-origin' || fetchSite === 'none';
  } else if (origin !== undefined) {
    sameOrigin = URL.canParse(origin) && new URL(origin).host === req.get('host');
  } else {
    sameOrigin = true;
  }
  if (!sameOrigin) {
    next(new HttpError(403, 'forbidden', 'Cross-site requests are not allowed.'));
  } else if (!req.is('application/json')) {
    next(new HttpError(415, 'unsupported_media_type', 'Send the request as JSON.'));
  } else {
    next();
  }
};

/** Express 5 forwards rejected promises to the error handler, so handlers can simply be async. */
export function authRouter({ auth }: { auth: Auth }): Router {
  const router = Router();
  router.use(sameOriginJson);

  router.post('/register', async (req, res) => {
    const body = parse(registerBody, req.body ?? {}, EMAIL_MESSAGE);
    const user = await auth.register(body.email, body.password);
    await auth.startSession(req, res, user.id);
    res.status(201).json({ user });
  });

  router.post('/login', async (req, res) => {
    const body = parse(loginBody, req.body ?? {}, 'Enter your email and password.');
    const user = await auth.verifyLogin(body.email, body.password);
    await auth.startSession(req, res, user.id);
    res.json({ user });
  });

  router.get('/session', async (req, res) => {
    const subject = await resolveSubject(req, auth);
    res.json({ user: subject.kind === 'user' ? await auth.findUser(subject.userId) : null });
  });

  router.post('/logout', async (req, res) => {
    await auth.endSession(req, res);
    res.json({ user: null });
  });

  return router;
}
