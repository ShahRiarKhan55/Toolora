# Architecture

This document explains how Toolora is put together and **why**. For day-to-day rules see `CLAUDE.md`.
Items marked _(planned)_ are designed but not built yet.

## Goals that drive the design

1. **Cheap to run.** No paid services; the tools themselves need no server at all.
2. **Private by construction.** Tool input is processed in the browser and never leaves it.
3. **Easy to add tools.** A new tool = one registry entry + one self-contained folder.
4. **Discoverable.** Search-engine and social-preview friendly, fast to load.
5. **Boring, maintainable tech.** TypeScript strict mode everywhere; few dependencies.

## System overview

```
                        ┌────────────────────────────── browser ──────────────────────────────┐
                        │  apps/web (React SPA)                                               │
  user ───────────────► │   pages ── tool modules (lazy chunks) ── pure logic.ts              │
                        │        ▲                                                            │
                        │        └── registry metadata (from packages/shared)                 │
                        └───────────────┬─────────────────────────────────────────────────────┘
                                        │ only for static assets, /api/health, and (planned) HTML
                                        ▼
                        ┌────────────────────────────── server ───────────────────────────────┐
                        │  apps/server (Express 5)                                            │
                        │   /api/*  health (+ future features)                                │
                        │   (planned) serve SPA, inject per-route SEO tags, sitemap, robots   │
                        │   Prisma 7 ─► SQLite (no models yet)                                │
                        └─────────────────────────────────────────────────────────────────────┘

           packages/shared: registry metadata, SEO helpers, constants — imported by both apps
```

Tool input never crosses the browser→server boundary. The server exists for delivery (HTML/SEO),
operations (health) and future features that genuinely need persistence.

## Workspaces

| Workspace         | Responsibility                                   | Runtime  |
| ----------------- | ------------------------------------------------ | -------- |
| `apps/web`        | UI, routing, all tool logic                      | browser  |
| `apps/server`     | HTTP API, static/SEO delivery, database access   | Node 22+ |
| `packages/shared` | Types and data both sides need (no React/Node)   | both     |
| `prisma/`         | Schema and migrations for the server's SQLite DB | —        |

Tests are co-located with code; server integration tests live in `apps/server/tests/`. The suggested
top-level `tests/` folder was intentionally not created: an empty folder would mislead, and it can be
added when cross-app end-to-end tests (e.g. Playwright) are introduced.

## Key decisions

### 1. `packages/shared` ships as TypeScript source

`exports` points at `src/index.ts`. Vite, Vitest, tsx and esbuild compile it as part of whoever imports it,
so there is no separate build step, no stale `dist/` and no watch process. The server's production build
(`apps/server/build.mjs`, esbuild) inlines `@toolora/*` workspace packages and leaves third-party
packages external. Trade-off: shared code must stay simple, framework-free TypeScript.

### 2. Tool logic is browser-side and lives with the tool

Each tool folder owns its pure `logic.ts`, so tools stay independent modules. Only data needed by both
apps (registry metadata) goes in `shared`. This keeps the server from ever importing tool logic.

### 3. Tool registry _(planned, Phase 3)_

One typed array in `packages/shared`, entries shaped like:

```ts
interface ToolMeta {
  id: string; // unique, kebab-case; equals the folder name in apps/web/src/tools/
  slug: string; // URL segment → /tools/<category>/<slug>
  name: string;
  description: string; // ≤ ~160 chars; used for cards and the meta description
  category: 'japan' | 'student' | 'developer' | 'ai';
  icon: string; // identifier resolved by the web icon map
  keywords: string[]; // search synonyms ("jpy", "gpa", "epoch", …)
  order?: number; // manual ordering
  featured?: boolean; // homepage "recommended"
}
```

The route is **derived** by a helper, not stored, so it cannot drift from category/slug. The web app maps
`id` → lazily-loaded component (`import.meta.glob` over `tools/*`); a unit test fails if a registry entry
has no component or a component has no entry. Cards, category pages, search, sitemap and SEO tags all read
this one list.

### 4. Search _(planned, Phase 7)_

Client-side, over the registry: normalise (case, whitespace, kana/width where useful), match against name,
keywords and description with simple ranking. No search service, no server round-trip, no dependency.
Adding a tool to the registry adds it to search automatically.

### 5. SEO strategy _(planned, Phase 8)_

A pure Vite SPA serves the same `<head>` for every URL, which hurts crawlers and social previews that do
not execute JavaScript. Instead of adopting an SSR framework, the Express server (already required for
`/api`) serves the built `index.html` and substitutes route-specific `<title>`, description, canonical,
Open Graph tags and JSON-LD, computed by shared helpers from the registry. `sitemap.xml` and `robots.txt`
are generated from the same registry. The client updates `document.title`/meta on navigation with a
small hook (React 19's native metadata hoisting would create duplicates next to the server-injected
tags). Possible later upgrade: build-time prerendering of static HTML, which would also allow fully
static hosting.

### 6. Database

Prisma 7 + SQLite via `@prisma/adapter-better-sqlite3`. **There are no models yet**: every MVP tool
runs in the browser, so nothing needs storing. `/api/health` runs `SELECT 1` through the real adapter,
so the wiring is exercised and tested (in-memory SQLite). The first model arrives with the first feature
that truly needs persistence; a candidate is a "suggest a tool" form (the brief mentions adding
categories "based on user demand"), which would store user-submitted text and therefore needs an explicit
go-ahead and a privacy note first.

SQLite URLs are resolved against the process working directory, and Prisma's CLI does the same, so all
commands must run from the repo root (they do, via the root npm scripts).

### 7. Errors and logging

- `config.ts` validates the environment with zod at startup and fails fast with a readable message.
- `errorHandler` maps every error to `{ "error": { "code", "message" } }`. Unknown errors become a generic
  500; body-parser 4xx errors become a generic 400/413. Stack traces and internals go to logs only, in
  every environment.
- `logger.ts` is a ~50-line leveled logger: JSON lines in production, readable output in development,
  silent in tests. `requestLogger` logs method, path, status, duration and a request id (also returned as
  `X-Request-Id`) — never query strings, headers or bodies.
- Express 5 forwards rejected promises from async handlers to the error handler automatically.

### 8. Web app structure and design system _(Phase 2)_

```
apps/web/src/
  index.css            design tokens (@theme) + global base styles (focus ring, smooth scroll)
  App.tsx              SiteLayout > HomePage (single route until Phase 3)
  components/ui/       Button, ButtonLink, Field, Input, Textarea, Select, Card, Badge, Alert,
                       EmptyState, CopyButton, icons        (framework-level building blocks)
  components/layout/   SiteLayout, Header, Footer, Container, Section, PageHeader, Breadcrumbs,
                       ToolPageLayout
  components/brand/    Logo (text + inline SVG mark; no image assets)
  config/              navigation.ts (nav items, link targets), categoryPresentation.ts (icon/colour)
  pages/home/          HomePage and its sections
  lib/cx.ts            class-name joiner (instead of a clsx dependency)
```

Decisions and why:

- **Tokens are the only palette.** `index.css` clears Tailwind's default colours and shadows
  (`--color-*: initial`) and defines semantic tokens instead. Components can therefore not reach for an
  arbitrary colour, and a re-theme is a one-file change. Text/background pairs were chosen for WCAG AA;
  form-control borders use a darker `border-strong` to reach 3:1. There is no dark mode yet.
- **No router yet.** The project had none, and choosing one is a Phase 3 concern (it needs the registry's
  routes). Until then, category and "All Tools" links are plain anchors to sections of the home page,
  built by `config/navigation.ts`; the only page is the home page. When routing lands, change those
  helpers and (if the router needs it) the anchor elements in `Header`/`Footer`/`Breadcrumbs`.
- **Categories in `shared`, presentation in `web`.** `CATEGORIES`/`CategoryId` (name, description) are
  site structure both apps may need (nav, SEO, the registry's `ToolMeta.category`); icons and colours are
  UI-only and stay in `apps/web`. This is _not_ the tool registry.
- **Mobile navigation is a disclosure, not a modal.** A "Menu" button with `aria-expanded`/`aria-controls`
  toggles an inline panel; Escape (returning focus to the button), choosing a link, or pressing outside
  closes it. Page scrolling is never locked, and no focus trap is needed.
- **`Field` wires accessibility once.** Input/Textarea/Select render through `Field`, which binds the
  label, hint and error (`aria-describedby`, `aria-invalid`, an announced `role="alert"` error with an
  icon) so tools cannot forget it.
- **Home-page search is a disabled placeholder** that says why. A working search needs the registry
  (Phase 7 builds it over the registry); a fake one is against the project's rules.
- **SEO of the home page.** `index.html` carries the title, description, theme colour, favicon and basic
  Open Graph tags. A canonical URL and `og:url`/`og:image` are deliberately absent: they need the
  production origin, which does not exist yet. Phase 8's server-side injection adds them; nothing
  about that design changed.

### 9. Toolchain pins

See `CLAUDE.md` → "Pinned toolchain choices" for TypeScript 6 (not 7), Prisma 7.10 (not the 8.0 RC on
`latest`) and ESLint 10 with a jsx-a11y peer override, and why.

## Testing strategy

- Vitest 5 with `test.projects`: `web` (jsdom), `server` (node), `shared` (node). `npm test` runs all.
- Pure `logic.ts` gets exhaustive unit tests; UI gets Testing Library tests for the flows users
  perform; the API is tested through supertest against a real Prisma client on in-memory SQLite.
- Regression tests are proven to fail without the fix (see the request-path logging test).

## Performance approach

Route-level and tool-level code splitting; no UI kit; Tailwind emits only used classes; no third-party
network requests; all tool work is local computation. Current baseline (Phase 2): web JS ≈ 73 kB gzip
(React 19 + the app shell), CSS ≈ 5 kB gzip, server bundle ≈ 9 kB (plus external dependencies).
