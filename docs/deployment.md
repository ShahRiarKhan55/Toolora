# Deployment — what the owner still has to supply

Nothing has been deployed, no host was chosen, and the repository has **no Git remote**. This lists the
values the code needs from the owner; none of them may be invented or committed as placeholders.

| Item                     | Where it is used / what is needed                                                                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production domain        | Not chosen. Becomes `VITE_PUBLIC_SITE_URL`.                                                                                                                       |
| `VITE_PUBLIC_SITE_URL`   | Origin, no trailing slash. Set at **web build time and server runtime**. Unset → relative canonicals, no JSON-LD, `sitemap.xml` 404.                              |
| Hosting target           | Not chosen. Must run Node 24 (`npm run build`, `npm run db:deploy`, `NODE_ENV=production npm start`) and keep the repo-root working directory.                    |
| Reverse proxy / HTTPS    | TLS and response compression are not done by Express. The proxy must terminate HTTPS (HSTS is already sent) and compress.                                         |
| Persistent SQLite volume | Self-hosted only: `DATABASE_URL` on a persistent volume. Not applicable on Vercel (accounts stay closed there; see above).                                        |
| Backup location          | None configured. Needed once the database holds anything (i.e. if accounts open).                                                                                 |
| Monitoring endpoint      | `GET /api/health` (200 `{status, database, uptimeSeconds}`) is the probe target; no monitor is configured.                                                        |
| Contact address          | `CONTACT_EMAIL` in `packages/shared/src/site.ts` is `undefined`; the Contact and Privacy pages say "Contact details have not been published yet" until it is set. |
| Per-client rate limiting | Only needed if `ACCOUNTS_ENABLED` is ever set to `true` (see below). Must be configured in front of `/api/auth/*` first.                                          |

## Vercel (Phase 17 preparation — not deployed)

Target host is Vercel's native Express support; no VPS, Docker or managed database. Nothing has been
deployed and no Vercel project exists yet. Repository root is the Vercel project root (the server needs
`packages/shared` and the web build, so `apps/web` cannot be the root).

- `vercel.json`: `framework: express`, `buildCommand: npm run build:vercel`, and `includeFiles` so the
  function can read `apps/web/dist/index.html` (the SEO-injection template, read at runtime).
- Entry: root `server.mjs` re-exports the bundle `apps/server/dist/vercel.js` (built by `npm run build`
  next to `index.js`; same app as `npm start`, but exported instead of listening).
- `npm run build:vercel` = `npm run build` + `scripts/vercel-public.mjs`, which copies the web build into
  git-ignored `public/` **except index.html**. Vercel ignores `express.static`; its CDN serves `public/`,
  and an `index.html` there would bypass per-route SEO injection and the 404 behaviour.
- Env vars (Production and Preview): `VITE_PUBLIC_SITE_URL` (real origin, needed at build **and** runtime —
  owner action once a domain exists). `NODE_ENV`/`PORT` are supplied by Vercel. `DATABASE_URL` is not needed.
- **Stateless:** with `ACCOUNTS_ENABLED=false` nothing opens SQLite (the Prisma client is lazy) and
  `/api/health` skips the database ping (`database: "not-used"`). Vercel's filesystem is not durable, so
  **accounts must stay disabled on Vercel until Toolora has a proper persistent production database**;
  flipping the flag also restores the database ping.
- Static files served from `public/` by the CDN do not get Helmet's headers (only Express responses do);
  `/assets/*` immutable caching is set in `vercel.json`.
- Not verified locally: the Vercel CLI is not installed, so entry detection, `includeFiles` and the
  native `better-sqlite3` trace on Vercel's build are unconfirmed until the first preview deploy.

## Accounts are closed at launch

`ACCOUNTS_ENABLED` (`packages/shared/src/site.ts`) is `false`. Effects: no Sign in/Account link in the
header; `/account` is a noindex page with a notice and no form; the web app makes no `/api/auth` request;
the server does not mount `/api/auth` at all, so those paths are JSON 404s and no cookie is ever set. The
authentication code, Prisma `User`/`Session` models, migration and tests are unchanged.

**Before flipping it to `true`:** add per-client rate limiting (proxy or app) in front of `/api/auth/*`
(the app only caps pending password hashes, answering `503 busy`), and update the Privacy page and
`docs/architecture.md` 6b. Email verification, password reset and account deletion do not exist.
