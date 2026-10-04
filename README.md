# Toolora

Toolora is a multi-purpose web toolbox: free, genuinely useful online tools grouped into categories —
**Japan** (yen, era, age, postal-code and phone-number tools), **Student** (GPA, percentage/grade
calculator, word counter, GPA ↔ percentage, date difference) and **Developer** (JSON formatter, Base64,
UUID, Unix timestamp, regex tester, CSV ↔ JSON, JSON → TypeScript). All 17 tools run entirely in your
browser, so your input is never sent anywhere.

> **Status: early development (Phase 7 of 11).** The repository has the monorepo, tooling, the design
> system and app shell, a working API skeleton, real routing (`react-router-dom`), a tool registry, and
> 17 tools — all working, tested and searchable/filterable at `/tools`, with related-tools
> navigation on every tool page, and a client-side SEO foundation (canonical/Open Graph/Twitter tags,
> JSON-LD, `sitemap.xml`, `robots.txt`). See the status table in [`CLAUDE.md`](./CLAUDE.md) and the
> registry/routing details in [`docs/tools.md`](./docs/tools.md).

## Architecture in brief

- **`apps/web`** — React 19 + TypeScript + Vite + Tailwind CSS + React Router. All tool logic runs
  client-side; each tool is its own lazy-loaded chunk.
- **`apps/server`** — Node.js + Express 5 + TypeScript. Health endpoint, `sitemap.xml` and `robots.txt`
  (generated from the registry); serves the built SPA with per-route SEO tags and JSON-LD injected into `index.html`. Prisma 7 + SQLite for future persistence.
- **`packages/shared`** — framework-free TypeScript shared by both (the tool registry, categories, SEO
  helpers).
- **Tests** — Vitest, React Testing Library, supertest. **Lint/format** — ESLint (with jsx-a11y) + Prettier.

More in [`docs/architecture.md`](./docs/architecture.md) and [`docs/tools.md`](./docs/tools.md).

## Prerequisites

- **Node.js ≥ 22.12** (developed on 24; see `.nvmrc`) and npm ≥ 10.
- No C/C++ toolchain is needed on current Node: `better-sqlite3` downloads a prebuilt binary (verified on
  Windows 11 / Node 24 with no compiler installed).

## Installation

```bash
npm install        # installs all workspaces and generates the Prisma client
npm run db:deploy  # creates/updates the SQLite file (accounts); the tools themselves need no database
```

Optional: copy `.env.example` to `.env` to override the defaults (port, database file, log level).

## Development commands

Run everything **from the repository root**.

| Command                                  | What it does                                                    |
| ---------------------------------------- | --------------------------------------------------------------- |
| `npm run dev`                            | Web (Vite, http://localhost:5173) + API (http://localhost:3001) |
| `npm run dev:web` / `npm run dev:server` | Run one side only                                               |
| `npm test` / `npm run test:watch`        | Run the test suite (all workspaces)                             |
| `npm run lint` / `npm run lint:fix`      | ESLint                                                          |
| `npm run format` / `format:check`        | Prettier                                                        |
| `npm run typecheck`                      | TypeScript for every workspace                                  |
| `npm run build`                          | Production builds of server and web                             |
| `npm run check`                          | Format check + lint + typecheck + test + build                  |
| `npm start`                              | Run the built server                                            |
| `npm run db:generate` / `db:migrate`     | Prisma client generation / dev migrations                       |
| `npm run db:deploy`                      | Apply the committed migrations (local setup and deployment)     |

If port 5173 is already used by another project, Vite automatically picks the next free port — read the
URL it prints.

## Project structure

```
toolora/
├─ apps/
│  ├─ web/            React SPA (index.html, src/, vite.config.ts)
│  └─ server/         Express API (src/, tests/, build.mjs)
├─ packages/
│  └─ shared/         Shared TypeScript source (src/)
├─ prisma/            schema.prisma + migrations/ (User, Session)
├─ docs/              architecture.md, tools.md (registry, routing, adding a tool)
├─ CLAUDE.md          Working rules for contributors and AI agents
├─ eslint.config.js, .prettierrc.json, tsconfig*.json, vitest.config.ts, prisma.config.ts
└─ package.json       npm workspaces + root scripts
```

## Adding a new tool

Full walkthrough: [`docs/tools.md`](./docs/tools.md). Short version:

1. Add one entry (id, slug, name, description, category, icon, keywords, seoTitle, seoDescription,
   localOnly, order) to `TOOLS` in `packages/shared/src/tools.ts`.
2. Create `apps/web/src/tools/<tool-id>/` with the pure `logic.ts` (+ tests first), the UI component
   built from shared components, and `content.tsx` for the explanatory copy.
3. Register it in `apps/web/src/tools/index.ts`.
4. `npm run check`. The card, category page, route (`/tools/<slug>`), search entry and page title/
   description, canonical/social tags and `sitemap.xml` entry all appear automatically.

## Testing

`npm test` runs Vitest across three projects (web/jsdom, server/node, shared/node). Every tool must ship
tests for normal, edge, invalid and boundary input. See `CLAUDE.md` for the full requirements.

## Build

```bash
npm run build
```

Produces `apps/web/dist` (static assets) and `apps/server/dist/index.js` (a single bundled file; runtime
dependencies are loaded from `node_modules`).

## Deployment notes

Nothing is deployed and no hosting has been chosen. Things a deployment will need:

- Node ≥ 22.12. Build on the target (or in CI/a Docker build stage): `npm ci && npm run build`, then
  start from the repo root with `npm start` (paths such as the SQLite file are relative to the working
  directory). Do not use `npm ci --omit=dev`: the install-time `prisma generate` needs the dev-only
  `prisma` CLI, and `--ignore-scripts` would skip the `better-sqlite3` native binary.
- Run `npm run db:deploy` against the production `DATABASE_URL` before the first start and after every
  deploy that adds a migration. Accounts need it: without the tables, register/login answer 500.
- Accounts: the session cookie is `Secure` in production, so serve over HTTPS and have the proxy preserve
  `Host`. Put rate limiting/abuse protection in front of `/api/auth/*` before launch (the app only caps pending password hashes, with no per-client limit;
  see `docs/architecture.md`, 6b).
- Environment: `NODE_ENV=production`, `PORT`, `DATABASE_URL` (a persistent path: it holds the accounts),
  optional `LOG_LEVEL`. Production logs are JSON lines on stdout. Set `VITE_PUBLIC_SITE_URL` to the real
  public origin (no trailing slash) **at build time** (the web bundle reads it) and at runtime (the server
  reads it) — canonical/OG/JSON-LD URLs and `sitemap.xml` need it; without it `sitemap.xml` returns 404.
- `npm start` does **not** set `NODE_ENV`; without it the server runs in development mode (debug logs, not JSON). Set `NODE_ENV=production` in the environment.
- Behind a reverse proxy/CDN, terminate TLS there. `npm start` serves the built web app (`apps/web/dist`) itself, injecting per-route SEO tags; unknown routes return 404. The server does **not** compress responses: have the proxy/platform gzip or brotli them (the main JS is ~335 kB raw, ~105 kB gzip).
- Health check: `GET /api/health` → 200 `{status:"ok",...}`, 503 if the SQLite file cannot be queried. It needs no auth and reveals no internals. SQLite holds the accounts and sessions, so it needs a persistent, writable volume.
- HTTP behaviour (all in `apps/server`, tests in `tests/production.test.ts`): helmet headers incl. CSP (`script-src 'self'`), HSTS, `Permissions-Policy`; no CORS headers (same-origin only); `/assets/*` is `immutable` for a year, HTML is `no-cache`, `/api/*` is `no-store`; dotfiles, source and config files are never served, and `/api/*` or missing `*.ext` paths get a JSON 404, not the SPA shell.
- Shutdown: SIGINT/SIGTERM stop accepting connections, close the database and exit (forced after 10 s).
- Any paid hosting, domain or service must be approved by the project owner first.

## License

Not yet chosen.
