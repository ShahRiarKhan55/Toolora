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
                        │   serve SPA, inject per-route SEO tags                              │
                        │   Prisma 7 ─► SQLite (User, Session)                                │
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

### 5. SEO strategy _(Phases 5 and 8 done)_

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
- **Server-side injection (Phase 8).** `pageMeta.ts` in `packages/shared` is the single definition of each
  route's metadata (registry-derived); pages feed it to `useDocumentMeta`, and `resolveRouteMeta(pathname,
search, origin)` mirrors the router for the server. In production `createApp({ webDistDir })` mounts
  `routes/spa.ts` _after_ `/api` and the SEO routes: static assets, then every other extension-less GET gets
  `index.html` with the region between `<!--seo:start-->` and `<!--seo:end-->` replaced by `renderSeoHead`
  output (title, description, robots, canonical, `og:*`, `twitter:*`, JSON-LD with the id
  `page-structured-data`). Unknown routes and unknown tool slugs answer 404 with `noindex,follow` and no
  canonical/`og:url`; empty categories answer 200 `noindex,follow`; `/tools?q=…` keeps canonical `/tools`.
  All values are HTML-escaped; JSON-LD escapes `<`. Because the client hook upserts by selector, it updates
  the server-rendered elements instead of adding new ones. Without `apps/web/dist` (dev, API tests) the
  server serves only the API and SEO files; Vite serves the SPA with the static defaults between the markers.
  The web bundle and the server must both see `VITE_PUBLIC_SITE_URL`. The SPA is still client-rendered
  (no SSR): the page body is empty until JS runs; only head tags are server-rendered.

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

### Tool expansion _(Phase 7)_

- **No new framework.** The registry + `tools/index.ts` map scaled from 10 to 17 tools unchanged: seven
  entries, seven folders, seven lines in the map. Home, "All tools", category pages, search, related tools,
  breadcrumbs, JSON-LD and `sitemap.xml` picked the tools up with no per-tool wiring.
- **Small additions only.** Seven icon ids (`regex`, `table`, `code`, `scale`, `calendar-range`,
  `map-pin`, `phone`), a shared `Checkbox` (regex flags, CSV header option), and registry tests that
  now also require a globally unique `order`, unique routes and unique descriptions.
- **No dynamic execution.** Regex Tester only compiles the pattern with `new RegExp`; CSV, JSON→TS and
  the formatters are hand-written parsers/generators over `JSON.parse` output. User text reaches the DOM
  only as React text children (never `dangerouslySetInnerHTML`), and generated code is plain text.
- **Honest limits are product copy.** The GPA converter states its single proportional formula and that
  institutions differ; the postal/phone formatters say they format but never verify, and the phone
  formatter leaves digits ungrouped for area codes it cannot determine rather than guessing.
- **Bundle.** Each new tool is its own 2–5 kB chunk. Tool _copy_ (`content.tsx`) is still imported
  eagerly, so the main chunk grows by a few kB per tool (~103 kB gzip at 17 tools); if that becomes a
  concern, lazy-load `content` next to `Component` — not needed yet.

### 6. Database

Prisma 7 + SQLite via `@prisma/adapter-better-sqlite3`. Every tool runs in the browser and stores
nothing; the only models are `User` and `Session` (Phase 12, see 6b), created by the migration in
`prisma/migrations/`. Apply migrations with `npm run db:deploy` (`db:migrate` is the dev-time
equivalent that also generates new ones). `/api/health` runs `SELECT 1` through the real adapter. Server
tests build an in-memory database from the real migration files (`apps/server/tests/migratedDb.ts`), so
tests run against the shipped schema. A candidate future feature is a "suggest a tool" form, which would
store user-submitted text and therefore needs an explicit go-ahead and a privacy note first.

SQLite URLs are resolved against the process working directory, and Prisma's CLI does the same, so all
commands must run from the repo root (they do, via the root npm scripts).

### 6a. Production HTTP behaviour _(Phase 10)_

The built server is self-contained (no Vite). helmet supplies CSP (no inline scripts exist in the build; JSON-LD is
non-executable), HSTS, nosniff, frame and referrer policy; `app.ts` adds `Permissions-Policy` and `Cache-Control: no-store` on
`/api`. `routes/spa.ts` serves `/assets` as `immutable` for a year (Vite hashes the names) and everything else with
revalidation; HTML is `no-cache` so deploys never serve stale SEO tags. There is deliberately no CORS and no compression in
Express (TLS and compression belong to the proxy/platform; adding `compression` is a later option if Toolora is ever exposed
without one). Dotfiles are ignored by `express.static`; paths ending in an extension never fall back to HTML. Tests:
`apps/server/tests/production.test.ts`.

### 6c. Dynamic data: live currency rates _(Phase 18)_

Browser → `GET /api/currency/rates` (`routes/currency.ts`) → `services/currency/currencyService.ts` → provider adapter →
external provider. The browser never calls a provider; the URLs are fixed in the adapters and built only from a whitelisted
currency code (`CURRENCY_CODES`, `packages/shared/src/currency.ts`), so there is no proxy and no SSRF surface. No database,
no accounts, no new environment variables, no secrets: neither provider needs a key.

- **Endpoint:** `GET /api/currency/rates?base=JPY&symbols=BDT,USD` (`symbols` optional = all 16 supported; case-insensitive;
  max 16, no duplicates; any other parameter is a 400). Success: `{ base, rates, updatedAt, source, cached }` with
  `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=600`. Errors are the standard
  `{ error: { code, message } }` with `no-store`: `missing_parameter`, `invalid_parameter`, `invalid_currency`,
  `duplicate_symbols`, `too_many_symbols` (400); `method_not_allowed` (405, `Allow: GET, HEAD`); `rate_limited` (429,
  `Retry-After`); `upstream_unavailable` (502); `upstream_timeout` (504, only when every provider timed out).
- **Providers** (`services/currency/providers/`), tried in order, first success wins: (1) `exchangerate-api` - open.er-api.com
  open-access endpoint, no key, includes BDT and JPY, **updated once a day** (terms require attribution to
  exchangerate-api.com; add the link when the UI ships); (2) `fawazahmed0` - the `@fawazahmed0/currency-api` JSON on the
  jsDelivr CDN, no key, daily, date-only timestamp. Both are reference rates, **not real-time or tradable**; UI copy must say
  "daily reference rates" with the `updatedAt`. Free public endpoints have no SLA; either can change or disappear.
  Each adapter validates the response with zod and requires a positive finite rate for every supported currency, otherwise it
  is `malformed`. 4 s timeout per provider call, redirects refused.
- **Replace a provider / add one:** implement `RateProvider` (`latest(base) → RateTable`) using `getJson` + `buildTable`, and
  list it in `createCurrencyService`'s default `providers`. A keyed provider reads its key from `process.env` in
  `config.ts` (zod) and is passed in from `productionApp.ts`; never `VITE_*`, never logged. Historical rates are not
  implemented (the interface has no such method yet; add it with the first provider that supports it).
- **Another dynamic-data domain:** a new folder under `services/<domain>/` with its own types, providers and service, reusing
  `TtlCache`, `rateLimit` and `HttpError`, mounted in `app.ts` behind an optional dependency like `currency`.
- **Cache** (`services/cache.ts`): 1 h TTL per base currency, at most 64 entries, concurrent misses share one upstream call,
  failures are not cached. It is in memory, so on Vercel it only lives as long as a warm function instance and each instance
  has its own; the `s-maxage` header lets Vercel's CDN absorb most repeats. Treat both as best-effort.
- **Rate limit** (`middleware/rateLimit.ts`): 60 requests/min per `req.ip` on `/api/currency` only (tools and other routes are
  unaffected). Per-process fixed window with a bounded client map: it stops accidental hammering, **not** a distributed or
  determined abuser (each serverless instance counts separately, cold starts reset it). `vercel.ts` sets `trust proxy 1` so
  the key is the real client address; behind any other proxy set the same, otherwise all clients share the proxy's address.
  A shared store (Redis etc.) is the later upgrade; the middleware is the seam.
- Tests: `services/currency/currencyService.test.ts`, `middleware/rateLimit.test.ts`, `tests/currency.test.ts`.

### 6b. Accounts and entitlements _(Phase 11 boundary, Phase 12 real authentication)_

> **Closed at launch (Phase 15).** `ACCOUNTS_ENABLED` is `false`: the API below is not mounted (404), the UI entry
> points are hidden. See `docs/deployment.md`. The rest of this section describes the behaviour when it is on.

**Today.** Every tool is public and runs in the browser; no tool needs an account. Phase 12 added a small
real account system (register, sign in, sign out, a server-verified session) and connected it to the
Phase 11 access model. **Payments, subscriptions, checkout, pricing, webhooks, email verification, password
reset and social login are not implemented**, and no tool is premium.

**Account model** (`prisma/schema.prisma`, migration `20261003000000_accounts_and_sessions`):

- `User`: `id` (uuid), `email` (unique; trimmed and lower-cased on every write and lookup), `passwordHash`,
  `createdAt`. There is no entitlement table: nothing writes entitlements yet (see "future payment flow").
- `Session`: `id`, `tokenHash` (unique), `userId`, `createdAt`, `expiresAt`.

**Passwords** (`apps/server/src/auth/password.ts`). scrypt from `node:crypto` (memory-hard, no dependency),
N=2^16, r=8, p=1, 16-byte random salt, NFKC-normalized input. The stored string is
`scrypt$N$r$p$salt$hash`, so the cost can be raised later without invalidating old hashes. Comparison is
`timingSafeEqual`. Policy: 10-128 characters, no composition rules (NIST 800-63B); the upper bound limits
hashing work per request. There is no breached/common-password check yet.

**Sessions** (`apps/server/src/auth/auth.ts`). A 32-byte random token (`randomBytes`), sent only in a cookie;
the database stores its SHA-256, so a leaked database cannot be replayed (SHA-256 is acceptable because the
token is high-entropy, unlike a password). Lifetime is a fixed 14 days from sign-in (no sliding renewal);
expired sessions are rejected and deleted on use, and a user's expired rows are pruned on their next sign-in.
Register and login always issue a new token and delete the session the request carried (no fixation);
logout deletes the row and clears the cookie.

**Cookie.** `HttpOnly`, `SameSite=Lax`, `Path=/`, no `Domain`, expires with the session. In production it is
also `Secure` and named `__Host-toolora_session` (browsers then refuse it unless Secure, Path=/ and
Domain-less). Outside production it is `toolora_session` and not Secure so plain-HTTP development works.
No token is in a URL, in `localStorage` or in any response body; the web app only ever sees `{ id, email }`.

**API** (all JSON, all under `/api/auth`, `Cache-Control: no-store`):

| Route            | Result                                                                        |
| ---------------- | ----------------------------------------------------------------------------- |
| `POST /register` | 201 `{ user }` + cookie; 400 invalid email/password; 409 `email_in_use`       |
| `POST /login`    | 200 `{ user }` + cookie; 401 one generic `invalid_credentials`; 400 malformed |
| `GET /session`   | 200 `{ user }` or `{ user: null }` (also for invalid or expired cookies)      |
| `POST /logout`   | 200 `{ user: null }`, cookie cleared; fine when already signed out            |

Login answers identically for an unknown email and a wrong password and hashes a dummy value for unknown
emails to keep timing alike. **Registration necessarily reveals that an email is taken** (409): without
email verification there is no way to tell the user without telling an enumerator. Unknown routes and wrong
methods stay JSON 404s; failures never expose database errors.

**CSRF** (`sameOriginJson` in `routes/auth.ts`). The cookie is `SameSite=Lax` (not attached to cross-site
POSTs), every state-changing request must be `application/json` (a cross-site HTML form cannot send it, and
there is no CORS, so a foreign page cannot get a preflight approved), and it must be same-origin by
`Sec-Fetch-Site` or, where a browser omits that, an `Origin` whose host equals `Host`. No token framework:
the app is same-origin, has no cross-origin client and no state-changing GET. Limits: a request with neither
header (a non-browser client) is accepted, which is not a CSRF vector; a proxy that rewrites `Host` breaks the
fallback check for old browsers; sibling subdomains are not defended against if other apps ever share the
domain; `SameSite=Lax` is browser behaviour, not a server guarantee.

**`resolveSubject(req, auth)`** (`apps/server/src/access.ts`) is the one place HTTP becomes an access subject:
request -> `resolveSubject` -> anonymous or `{ kind: 'user', userId, entitlements: [] }` -> `canAccess`. It
trusts only the session cookie, verified against the session table; no header, query or body value can name
a user or an entitlement (tested). `canAccess` stays pure and HTTP-free. Entitlements are always empty, so a
signed-in user holds `public` exactly like an anonymous visitor; `/api/auth/session` is the only caller
today and nothing is gated.

**Boundaries from Phase 11 (unchanged).** _Declaration_ - `ToolMeta.access?: AccessLevel`, read with
`requiredAccess(tool)`; every tool is public (tested). _Decision_ - `Subject`, `accessLevelOf`,
`canAccess(subject, required, now)`: pure, deterministic, expired entitlements ignored; it lives in the
server so the web bundle cannot import it.

**Future payment flow (not built):** browser -> Toolora server (starts checkout) -> payment provider ->
signed webhook -> server verifies the signature -> server writes an `Entitlement` row (a new model, added
with the payment phase) -> `resolveSubject` reads it for the session's user. The browser is never trusted
to say a payment succeeded. Never store card data.

**Web.** `/account` (noindex, outside the sitemap) has the sign-in/create-account form and the signed-in
state; the header shows "Sign in" or "Account". `AuthProvider` asks `/api/auth/session` once on load.

**Limitations and production notes.**

- **No per-client rate limiting; this stays a deployment requirement.** Scrypt makes each guess costly for the
  server too, so unthrottled login/register is a CPU/memory DoS surface (measured: 40 parallel logins delayed a
  static file by ~350 ms). The app only has a resource guard: at most 8 password hashes may be pending, further
  ones get `503 busy` at once (`auth/password.ts`). It does not slow down guessing by one client. Put rate
  limiting in front of `/api/auth/*` before launch (it needs the proxy's view of the client IP, which the app
  cannot know without a deployment decision).
- No email verification, password reset, account deletion/change, "sign out everywhere" or common-password
  check. A forgotten password cannot be recovered yet.
- Sessions are a fixed 14 days, with no idle timeout and no device list.
- HTTPS is required in production (Secure cookie). The proxy must preserve `Host`. Node needs no
  `trust proxy` setting: `Secure` is set from `NODE_ENV`, not from the connection.
- The SQLite file holds the accounts: it needs a persistent volume and backups. SQLite suits one server
  instance; scaling out means a different database.
- Logs carry method, path, status, duration and request id only; credentials, tokens and hashes are never
  logged (tested), and 5xx messages are generic.

**Rules:** entitlement state is never trusted from the client; premium access to any server capability is
authorised server-side via `canAccess`; no secret goes in a `VITE_*` variable; webhooks must be signature-
verified before they change state; auth failures use one generic response; anonymous use stays supported for
every public tool.

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
  production origin, which does not exist yet. In production the server replaces the marked region of this
  file per request (Phase 8); in dev the static defaults stay and `useDocumentMeta` sets the rest (see
  "SEO strategy" above).

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

#### Currency Converter UI _(Phase 19)_

`apps/web/src/tools/currency-converter/`: `api.ts` (the only network code: `GET /api/currency/rates?base=XXX`, 10 s timeout,
validates the body, maps failures to `timeout | rate-limited | unavailable | malformed | unsupported`; server messages are
never shown), `logic.ts` (amount parsing, formatting, sources, copy text, popular pairs; pure and tested),
`CurrencyConverterTool.tsx`. One request per _base_ currency, kept in component state, so changing the target currency, the
amount or revisiting a base costs nothing; there is no polling and no automatic retry (a "Try again" button appears only
after a failure). The result shows the rate, its date (`updatedAt`, UTC), the source and whether Toolora's server answered
from its cache (the rate date is unaffected). ExchangeRate-API's attribution link is always visible; when the fallback
supplied the rate the UI names it instead and mentions the primary. Display metadata (name, symbol) is in
`CURRENCY_INFO` (shared); there are deliberately no flags (EUR spans countries; Windows renders no flag emoji). The picker
is a native `<select>` (type-ahead by code, best mobile/a11y behaviour). Variant pages: see `docs/tools.md`.
