# Toolora

Toolora is a multi-purpose web toolbox: free, genuinely useful online tools grouped into categories —
**Japan** (yen converter, era converter, age calculator), **Student** (GPA, percentage, word counter) and
**Developer** (JSON, Base64, UUID, timestamps). Tools run in your browser, so your input is not sent
anywhere.

> **Status: early development (Phase 1 of 11).** The repository contains the monorepo, tooling, a
> minimal web skeleton and a working API skeleton. **No tools are implemented yet.** See the status table
> in [`CLAUDE.md`](./CLAUDE.md).

## Architecture in brief

- **`apps/web`** — React 19 + TypeScript + Vite + Tailwind CSS. All tool logic runs client-side.
- **`apps/server`** — Node.js + Express 5 + TypeScript. Health endpoint today; will also serve the built
  site with SEO tags, `sitemap.xml` and `robots.txt`. Prisma 7 + SQLite for future persistence.
- **`packages/shared`** — framework-free TypeScript shared by both (tool registry metadata, SEO helpers).
- **Tests** — Vitest, React Testing Library, supertest. **Lint/format** — ESLint (with jsx-a11y) + Prettier.

More in [`docs/architecture.md`](./docs/architecture.md).

## Prerequisites

- **Node.js ≥ 22.12** (developed on 24; see `.nvmrc`) and npm ≥ 10.
- No C/C++ toolchain is needed on current Node: `better-sqlite3` downloads a prebuilt binary (verified on
  Windows 11 / Node 24 with no compiler installed).

## Installation

```bash
npm install        # installs all workspaces and generates the Prisma client
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
├─ prisma/            schema.prisma (+ migrations/ once a model exists)
├─ docs/              architecture.md (tools.md arrives with the registry)
├─ CLAUDE.md          Working rules for contributors and AI agents
├─ eslint.config.js, .prettierrc.json, tsconfig*.json, vitest.config.ts, prisma.config.ts
└─ package.json       npm workspaces + root scripts
```

## Adding a new tool _(available from Phase 3)_

The tool registry does not exist yet. The intended workflow — documented in detail in `docs/tools.md`
once implemented — is:

1. Add one entry (id, slug, name, description, category, icon, keywords) to the registry in `packages/shared`.
2. Create `apps/web/src/tools/<tool-id>/` with the pure `logic.ts` (+ tests), the UI component built from
   shared components, and the explanatory content.
3. `npm run check`. The card, category page, route, search entry, sitemap entry and SEO tags appear
   automatically.

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
- Environment: `NODE_ENV=production`, `PORT`, `DATABASE_URL` (a persistent path if a model is ever added),
  optional `LOG_LEVEL`. Production logs are JSON lines on stdout.
- Behind a reverse proxy/CDN, terminate TLS there. Serving the SPA and SEO tags from the server is Phase 8.
- Any paid hosting, domain or service must be approved by the project owner first.

## License

Not yet chosen.
