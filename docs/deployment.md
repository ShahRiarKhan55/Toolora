# Deployment

Toolora is live on Vercel. This file records what is actually configured (verified read-only with the Vercel CLI and API on
2026-10-07, Phase 27) and what the owner still has to supply. Items under **Not configured** are not set up; nothing here may be
invented or committed as a placeholder.

## Current state (verified 2026-10-07)

| Item                                  | Value                                                                                                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production URL                        | https://toolora-smoky.vercel.app (Vercel-provided domain; no custom domain)                                                                                            |
| Vercel project                        | `toolora` (team `shahriarkhan55s-projects`, Hobby plan), root directory `.`                                                                                            |
| Git remote                            | https://github.com/ShahRiarKhan55/Toolora; Vercel's GitHub integration is linked                                                                                       |
| Production branch                     | `main`. A push to `main` deploys to Production; a push to any other branch deploys a Preview                                                                           |
| Production build                      | commit `fe25bc3` (Phase 25): 34 tools, 47 sitemap URLs                                                                                                                 |
| Build command                         | `npm run build:vercel` (also in `vercel.json`); install command and output directory are Vercel's defaults                                                             |
| Runtime                               | Node 24.x, framework preset Express, Fluid compute; function region **`hnd1`** (Tokyo) via `regions` in `vercel.json` (was `iad1` until Phase 27), no failover regions |
| Environment vars                      | One: `VITE_PUBLIC_SITE_URL`, scope **Production only**. Nothing else is set (no `DATABASE_URL`, no secrets, no provider keys)                                          |
| Vercel Web Analytics / Speed Insights | Not enabled (`features.webAnalytics: false`, Speed Insights has no data). See `docs/architecture.md`, 11                                                               |
| Vercel CLI                            | Installed locally (62.2.0, `npm i -g vercel`, logged in); the project is linked in the git-ignored `.vercel/`. **Not needed to deploy**                                |

`VITE_PUBLIC_SITE_URL` is Production-only, so **Preview builds have no site origin**: relative canonicals, no JSON-LD and
`/sitemap.xml` answers 404. That is correct for previews (they must not claim the production origin); do not copy the variable to
Preview. A Preview that is built from the same commit therefore differs from Production in SEO tags only.

## Workflow

Deployment is Git-driven. **There is no manual deploy step and CI never deploys.**

1. **Local development** — `npm install`, then `npm run dev` (web on Vite's port, API on 3001). Node ≥ 22.12 (`.nvmrc` says 24).
2. **Checks** — `npm run check` (format, lint, typecheck, tests, build). On Windows with `core.autocrlf=true`, run
   `npx prettier --write .` first or `format:check` fails on untouched files.
3. **Vercel build** — `npm run build:vercel` is what Vercel runs; run it locally before pushing anything that touches the build.
4. **Push** — push a branch to GitHub. GitHub Actions (`.github/workflows/ci.yml`) runs steps 2 and 3 on every push and pull
   request.
5. **Preview** — the same push creates a Preview deployment on a `*.vercel.app` URL (see the Vercel dashboard or `vercel ls`).
   Use it to eyeball a change; remember it has no `VITE_PUBLIC_SITE_URL`.
6. **Production** — merge or push to `main`. Vercel builds and promotes it automatically (about 30 s). Do not run `vercel --prod`.
7. **Verify Production** — `https://toolora-smoky.vercel.app/api/health` returns 200 `{status:"ok", database:"not-used"}`;
   `/sitemap.xml` lists the expected number of URLs (47 at `fe25bc3`); a tool page's view-source shows its own `<title>` and
   canonical; `/api/currency/rates?base=JPY&symbols=BDT` returns rates. `vercel inspect <url>` shows the commit a deployment was
   built from. Rollback: promote an earlier deployment in the Vercel dashboard.

## How the app runs on Vercel

Repository root is the project root (the server needs `packages/shared` and the web build, so `apps/web` cannot be the root).

- `vercel.json`: `framework: express`, `buildCommand: npm run build:vercel`, `includeFiles` so the function can read
  `apps/web/dist/index.html` (the SEO-injection template, read at runtime), and an immutable cache header for `/assets/*`.
- Entry: root `server.mjs` re-exports the bundle `apps/server/dist/vercel.js` (built by `npm run build` next to `index.js`; the
  same app as `npm start`, exported instead of listening).
- `npm run build:vercel` = `npm run build` + `scripts/vercel-public.mjs`, which copies the web build into git-ignored `public/`
  **except index.html**. Vercel ignores `express.static`; its CDN serves `public/`, and an `index.html` there would bypass
  per-route SEO injection and the 404 behaviour. HTML therefore always goes through the function (see the region note in
  `docs/architecture.md`, 10).
- **Stateless.** With `ACCOUNTS_ENABLED=false` nothing opens SQLite (the Prisma client is lazy) and `/api/health` skips the
  database ping (`database: "not-used"`). Production does not use SQLite or any database for application data. Vercel's
  filesystem is not durable, so **accounts must stay disabled on Vercel until Toolora has a proper persistent production
  database**; flipping the flag also restores the database ping.
- Static files served by the CDN from `public/` do not get Helmet's headers (only Express responses, i.e. HTML and `/api/*`, do).
- The in-memory currency cache and rate limiter are per function instance and best-effort (`docs/architecture.md`, 6c).

## Not configured / owner decisions

| Item                     | State                                                                                                                                                   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custom domain            | None. When one is added, set `VITE_PUBLIC_SITE_URL` to it (Production), redeploy, and re-check canonicals and `sitemap.xml`.                            |
| Contact address          | `CONTACT_EMAIL` in `packages/shared/src/site.ts` is `undefined`; Contact and Privacy say "Contact details have not been published yet" until it is set. |
| Persistent database      | None. Needed before accounts, saved data or payments (planned: Postgres, not started). Backups: none, because nothing is stored.                        |
| Per-client rate limiting | Only needed if `ACCOUNTS_ENABLED` ever becomes `true` (see below). Must be in front of `/api/auth/*` first.                                             |
| Monitoring               | `GET /api/health` is the probe target; no monitor is configured.                                                                                        |
| Function region          | `hnd1`, set in `vercel.json`. Evaluation and measurements: `docs/architecture.md`, 10.                                                                  |
| Self-hosting             | Possible (`npm run build`, `npm run db:deploy`, `NODE_ENV=production npm start`; see README) but not how Toolora runs.                                  |

## Accounts are closed at launch

`ACCOUNTS_ENABLED` (`packages/shared/src/site.ts`) is `false`. Effects: no Sign in/Account link in the header; `/account` is a
noindex page with a notice and no form; the web app makes no `/api/auth` request; the server does not mount `/api/auth` at all,
so those paths are JSON 404s and no cookie is ever set. The authentication code, Prisma `User`/`Session` models, migration and
tests are unchanged. Google Sign-In is **planned for a later phase and not implemented**.

**Before flipping it to `true`:** add per-client rate limiting (proxy or app) in front of `/api/auth/*` (the app only caps
pending password hashes, answering `503 busy`), move to a persistent database, and update the Privacy page and
`docs/architecture.md` 6b. Email verification, password reset and account deletion do not exist.
