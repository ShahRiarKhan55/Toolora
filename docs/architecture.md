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
                        │   /sitemap.xml, /robots.txt (from the registry)                       │
                        │   (planned) serve SPA, inject per-route SEO tags                    │
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

### 3. Tool registry _(Phase 3)_

One typed array, `TOOLS`, in `packages/shared/src/tools.ts`:

```ts
interface ToolMeta {
  id: string; // unique, kebab-case; equals the folder name in apps/web/src/tools/
  slug: string; // URL segment → /tools/<slug> (flat, not nested under the category)
  name: string;
  description: string; // card text
  category: 'japan' | 'student' | 'developer' | 'ai';
  icon: ToolIconId; // identifier resolved by apps/web/src/config/toolPresentation.ts
  keywords: readonly string[]; // search synonyms ("jpy", "gpa", "epoch", …)
  seoTitle: string;
  seoDescription: string;
  localOnly: boolean; // true for every current tool
  order: number; // manual ordering within a category and in "All tools"
}
```

The route is **derived** by a helper (`toolRoute`/`categoryRoute`), not stored, so it cannot drift from
the slug/category id. `apps/web/src/tools/index.ts` maps `id` → a lazily-loaded component (a hand-written
map of ten `import()` calls, not `import.meta.glob` — simple enough not to need the extra indirection at
this scale) plus its `content`; `registry.test.ts` fails if a registry entry has no implementation or an
implementation has no entry. Cards, category pages, search and per-route document title/description all
read this one list; the sitemap, `robots.txt` and per-route SEO tags are generated from it too.

Deliberately _not_ in `ToolMeta`: a `featured` or `status` flag. Every MVP tool is fully built and listed
plainly (CLAUDE.md's "no disabled 'coming soon' tools" rule) — extend the type when a real need for either
shows up, rather than pre-building for a "later" that would let the registry describe tools that don't
work yet.

### 4. Search _(Phase 3, category filter added in Phase 4)_

`apps/web/src/lib/searchTools.ts`: client-side, case-insensitive substring match over the registry's
name, description, category name and keywords. No search service, no server round-trip, no dependency
(kana/width normalisation and ranking are not implemented — the catalogue is small enough that a plain
filter is enough). The "All tools" page (`/tools?q=...`) is the primary surface; the home page's hero
search box submits into it. Adding a tool to the registry adds it to search automatically. Phase 4
added an optional `?category=` param, applied after the text filter, with a chip per category — both
params live in `useSearchParams`, so back/forward and reload work for free.

### 4a. Related tools _(Phase 4)_

`apps/web/src/lib/relatedTools.ts` derives a small, deterministic set of "related tools" for a tool
page straight from `TOOLS`: same category first, then other categories, each tie-broken by the
registry's `order` field, always excluding the current tool. `ToolPageLayout` renders whatever it is
given (via `ToolCard`, the same card used everywhere else) — it has no opinion on the algorithm. There
is deliberately no second, hand-maintained "related tools" map: doing that risks drifting out of sync
with the registry and pointing at a tool that no longer exists.

### 5. SEO strategy _(Phase 5 done; server-side tag injection still planned)_

A pure Vite SPA serves the same `<head>` for every URL, which hurts crawlers and social previews that do
not execute JavaScript. Instead of adopting an SSR framework, the Express server (already required for
`/api`) serves the built `index.html` and substitutes route-specific `<title>`, description, canonical,
Open Graph tags and JSON-LD, computed by shared helpers from the registry. The client updates `document.title`/meta on navigation with a
small hook (React 19's native metadata hoisting would create duplicates next to the server-injected
tags). Possible later upgrade: build-time prerendering of static HTML, which would also allow fully
static hosting.

**What exists today (Phase 5):**

- **Public origin.** `VITE_PUBLIC_SITE_URL` (repo-root `.env`, see `.env.example`) is the one configured
  production origin. `resolvePublicSiteOrigin` (`packages/shared/src/url.ts`) trims it and strips
  trailing slashes; the web app reads it via `import.meta.env` (`lib/siteUrl.ts`, Vite `envDir` is the repo
  root), the server via `process.env` (`config.ts`). Because Vite inlines it, set it when building the web
  bundle. Unset (dev): canonical/`og:url` are same-origin-relative, JSON-LD is omitted and `sitemap.xml` is
  404 — no domain is ever invented. Never use a placeholder like `https://example.com`.
- **Per-route tags.** `useDocumentMeta({ title, description, path?, robots?, ogType?, structuredData? })`
  writes title, description, robots, canonical, `og:*`, `twitter:*` (summary card) and JSON-LD on every
  call and removes anything not supplied, so no tag survives from the previous route. All pages use it:
  home, `/tools`, category and tool pages (canonical = their own route) and the 404 page (`noindex,follow`,
  no canonical/`og:url`). `/tools?q=…&category=…` canonicalizes to `/tools` (or to the category page for a
  bare category filter) via `allToolsCanonicalPath`. A category with no tools is `noindex,follow`.
- **Structured data** (`structuredData.ts`): `WebSite` on the home page, `WebApplication` on tool pages,
  built only from registry/site constants. No ratings, reviews, prices or organization/author claims.
- **`sitemap.xml` / `robots.txt`** (`sitemap.ts`, served by `apps/server/src/routes/seo.ts`): generated
  per request from `TOOLS` and `CATEGORIES` (home, `/tools`, non-empty categories, every tool). `robots.txt`
  allows everything and lists the sitemap only when an origin is configured.
- **Limitation.** These tags are still set client-side; crawlers/social scrapers that do not run
  JavaScript see only `index.html`'s static head. Server-side injection remains to be built.

### Resilience and navigation _(Phase 6)_

- **Route changes.** `RouteChangeHandler` scrolls to the top and focuses `<main>` when the _pathname_
  changes (not for `?q=`/`?category=` changes), because client-side navigation otherwise leaves keyboard
  and screen-reader users on the old link at the old scroll position.
- **Error boundary.** `ErrorBoundary` wraps the routes (keyed by path, inside the shell so header and
  footer survive). It catches render errors and failed lazy tool chunks and shows an announced
  `Alert` with a reload button instead of a blank page. It logs to the browser console only.
- **Target size.** Footer and breadcrumb links are `min-h-11` (they were ~20px tall).
- **Audit results, no change needed:** the main bundle is ~97 kB gzip (React + React Router + app
  shell and every tool's static copy, ~14 kB of source); each tool is its own 1–5 kB chunk; fonts are
  system fonts; the web build emits no source maps (the server bundle's map is not served); no
  horizontal overflow from 320 px to 1440 px.

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

### 8. Web app structure and design system _(Phase 2, extended in Phase 3)_

```
apps/web/src/
  index.css            design tokens (@theme) + global base styles (focus ring, smooth scroll)
  App.tsx              SiteLayout > react-router <Routes> (see docs/tools.md for the route list)
  main.tsx             BrowserRouter > App
  components/ui/       Button, ButtonLink, Field, Input, Textarea, Select, Card, Badge, Alert,
                       EmptyState, CopyButton, ResultBox, icons  (framework-level building blocks)
  components/layout/   SiteLayout, Header, Footer, Container, Section, PageHeader, Breadcrumbs,
                       ToolPageLayout
  components/brand/    Logo (text + inline SVG mark; no image assets)
  components/tool/     ToolCard (the tool summary card used by home, "All tools" and category pages)
  config/              navigation.ts, categoryPresentation.ts, toolPresentation.ts (icon/colour per
                       tool, keyed by ToolIconId so a new id is a compile error until it is styled)
  pages/home/          HomePage and its sections
  pages/tools/         AllToolsPage, CategoryPage, ToolPage, ToolsSlugRoute
  pages/NotFoundPage.tsx
  tools/<tool-id>/     one folder per tool: logic.ts, <Name>Tool.tsx, content.tsx, tests (docs/tools.md)
  tools/index.ts       registry id → { lazy Component, content }; tools/types.ts; tools/registry.test.ts
  lib/                 cx.ts (class-name joiner), searchTools.ts, relatedTools.ts, useDocumentMeta.ts,
                       isoDate.ts, parseDecimal.ts — small helpers shared across tools instead of
                       copy-pasted
```

Decisions and why:

- **Tokens are the only palette.** `index.css` clears Tailwind's default colours and shadows
  (`--color-*: initial`) and defines semantic tokens instead. Components can therefore not reach for an
  arbitrary colour, and a re-theme is a one-file change. Text/background pairs were chosen for WCAG AA;
  form-control borders use a darker `border-strong` to reach 3:1. There is no dark mode yet.
- **Routing: `react-router-dom` (Phase 3).** The simplest well-maintained option for a client-rendered
  SPA; no server rendering or loader/data APIs are used. `ToolsSlugRoute` resolves `/tools/:param`
  against the category list, then the registry, so category pages and tool pages share one route
  without a hand-written list per category. `Header`/`Footer`/`Breadcrumbs`/`Logo`/`ButtonLink` render
  `<Link>` (client-side navigation); `ButtonLink`'s public prop stayed named `href` for continuity even
  though it now forwards to `<Link to>` internally.
- **Categories in `shared`, presentation in `web`.** `CATEGORIES`/`CategoryId` (name, description) are
  site structure both apps may need (nav, SEO, the registry's `ToolMeta.category`); icons and colours are
  UI-only and stay in `apps/web`. This is _not_ the tool registry.
- **Mobile navigation is a disclosure, not a modal.** A "Menu" button with `aria-expanded`/`aria-controls`
  toggles an inline panel; Escape (returning focus to the button), choosing a link, or pressing outside
  closes it. Page scrolling is never locked, and no focus trap is needed.
- **`Field` wires accessibility once.** Input/Textarea/Select render through `Field`, which binds the
  label, hint and error (`aria-describedby`, `aria-invalid`, an announced `role="alert"` error with an
  icon) so tools cannot forget it.
- **The home-page search box is a real search (Phase 3).** It submits to `/tools?q=...`, which filters
  with `searchTools` (see "Search" above) — no longer the disabled Phase 2 placeholder, now that the
  registry and a working search exist.
- **SEO of the home page.** `index.html` carries the title, description, theme colour, favicon and basic
  Open Graph tags. A canonical URL and `og:url`/`og:image` are deliberately absent: they need the
  production origin, which does not exist yet. Phase 5 sets them client-side from `VITE_PUBLIC_SITE_URL`;
  server-side injection into this file is still to do. Other routes' tags are set by
  `useDocumentMeta` (see "SEO strategy" above).

### 9. Toolchain pins

See `CLAUDE.md` → "Pinned toolchain choices" for TypeScript 6 (not 7), Prisma 7.10 (not the 8.0 RC on
`latest`) and ESLint 10 with a jsx-a11y peer override, and why.

## Testing strategy

- Vitest 5 with `test.projects`: `web` (jsdom), `server` (node), `shared` (node). `npm test` runs all.
- Pure `logic.ts` gets exhaustive unit tests (normal, edge, invalid, boundary — see CLAUDE.md's
  per-tool must-haves: leap years/date boundaries, era boundaries, invalid JSON, Unicode Base64,
  timestamp seconds vs milliseconds, GPA edge cases); UI gets Testing Library tests for the flows
  users perform (input → action → result, validation, reset, copy); the API is tested through
  supertest against a real Prisma client on in-memory SQLite; the registry has its own tests
  (uniqueness, valid categories, non-empty metadata) plus a registry ↔ implementation parity test.
- Regression tests are proven to fail without the fix (see the request-path logging test, and
  `japanese-age-calculator/logic.test.ts`'s day-borrow reconstruction test, added after a real bug).

## Performance approach

Route-level and tool-level code splitting (each tool is its own chunk, verified in the Phase 3 build —
typically 1–5 kB gzip per tool); no UI kit; Tailwind emits only used classes; no third-party network
requests; all tool work is local computation. Current baseline (Phase 3): main web JS ≈ 96 kB gzip
(React 19 + React Router + the app shell + registry), CSS ≈ 5 kB gzip, server bundle ≈ 9 kB (plus
external dependencies).
