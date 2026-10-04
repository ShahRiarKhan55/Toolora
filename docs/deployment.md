# Deployment — what the owner still has to supply

Nothing has been deployed, no host was chosen, and the repository has **no Git remote**. This lists the
values the code needs from the owner; none of them may be invented or committed as placeholders.

| Item                     | Where it is used / what is needed                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production domain        | Not chosen. Becomes `VITE_PUBLIC_SITE_URL`.                                                                                                                             |
| `VITE_PUBLIC_SITE_URL`   | Origin, no trailing slash. Set at **web build time and server runtime**. Unset → relative canonicals, no JSON-LD, `sitemap.xml` 404.                                    |
| Hosting target           | Not chosen. Must run Node 24 (`npm run build`, `npm run db:deploy`, `NODE_ENV=production npm start`) and keep the repo-root working directory.                          |
| Reverse proxy / HTTPS    | TLS and response compression are not done by Express. The proxy must terminate HTTPS (HSTS is already sent) and compress.                                               |
| Persistent SQLite volume | `DATABASE_URL` (default `file:./prisma/dev.db`) must point at a persistent volume. While accounts are closed the tables are empty but `/api/health` still pings the DB. |
| Backup location          | None configured. Needed once the database holds anything (i.e. if accounts open).                                                                                       |
| Monitoring endpoint      | `GET /api/health` (200 `{status, database, uptimeSeconds}`) is the probe target; no monitor is configured.                                                              |
| Contact address          | `CONTACT_EMAIL` in `packages/shared/src/site.ts` is `undefined`; the Contact and Privacy pages say "Contact details have not been published yet" until it is set.       |
| Per-client rate limiting | Only needed if `ACCOUNTS_ENABLED` is ever set to `true` (see below). Must be configured in front of `/api/auth/*` first.                                                |

## Accounts are closed at launch

`ACCOUNTS_ENABLED` (`packages/shared/src/site.ts`) is `false`. Effects: no Sign in/Account link in the
header; `/account` is a noindex page with a notice and no form; the web app makes no `/api/auth` request;
the server does not mount `/api/auth` at all, so those paths are JSON 404s and no cookie is ever set. The
authentication code, Prisma `User`/`Session` models, migration and tests are unchanged.

**Before flipping it to `true`:** add per-client rate limiting (proxy or app) in front of `/api/auth/*`
(the app only caps pending password hashes, answering `503 busy`), and update the Privacy page and
`docs/architecture.md` 6b. Email verification, password reset and account deletion do not exist.
