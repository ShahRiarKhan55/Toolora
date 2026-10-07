# CLAUDE.md — Toolora

Guidance for anyone (human or AI agent) working in this repository. **Keep this file current**: when a
decision, command or rule changes, update it in the same change.

## Purpose

Toolora is a multi-purpose web toolbox: many genuinely useful, free online tools grouped into categories
(Japan, Student, Developer; AI later). The plan is free tools → organic traffic → later monetization
(premium features / ads). The MVP is ~10 polished tools, built so it can grow to 50–100+.

The MVP deliberately has **no** payments, ads, analytics or paid/external APIs, and only a minimal optional
account system (Phase 12; no tool needs it). Do not add any
of these, or any paid service, without asking the owner first. Never deploy anything without asking.

## Status

| Phase | Scope                                                                                     | State                                  |
| ----- | ----------------------------------------------------------------------------------------- | -------------------------------------- |
| 0–1   | Analysis, monorepo, tooling, server skeleton                                              | done                                   |
| 2     | Design system + app shell                                                                 | done                                   |
| 3     | Tool registry, routing, first 10 tools, client-side search                                | done                                   |
| 4     | Product quality: related tools, category filter/discovery, content/a11y pass              | done                                   |
| 5     | SEO foundation: canonical/OG/Twitter/robots meta, JSON-LD, sitemap, robots                | done                                   |
| 6     | Production readiness: route focus/scroll, error boundary, target sizes                    | done                                   |
| 7     | Tool expansion: 7 new tools (regex, CSV↔JSON, JSON→TS, GPA↔%, dates, JP postal/phone)     | done                                   |
| 8     | Server-side injection of per-route tags into `index.html` (SPA delivery)                  | done                                   |
| 9     | Discovery: curated `related` links, populated-only category links, concise home           | done                                   |
| 10    | Production hardening: cache headers, Permissions-Policy, prod HTTP regression tests       | done                                   |
| 11    | Accounts/entitlements boundary (access levels, server decision seam; no enforcement)      | done                                   |
| 12    | Accounts + authentication foundation (register/login/logout, cookie sessions)             | done                                   |
| 13    | Full test pass, lint/build, UX/a11y/perf review                                           | done                                   |
| 15    | Launch minimum: Privacy + Contact pages, public accounts closed (`ACCOUNTS_ENABLED`)      | done                                   |
| 17    | Vercel deployment preparation (stateless Express function)                                | done, deployed                         |
| 18    | Dynamic data foundation: `/api/currency/rates`, provider fallback, cache, rate limit      | done                                   |
| 19    | Currency 2.0: Currency Converter on the Phase 18 API, `/tools/jpy-to-bdt` + `bdt-to-jpy`  | done                                   |
| 20    | Currency category; historical rates researched and deferred (no suitable provider)        | done                                   |
| 21    | 8 new tools; Text, Finance and Time categories; `react-markdown` for Markdown Preview     | done                                   |
| 22    | Read-only product/SEO/docs audit (no code changes)                                        | done                                   |
| 23    | 6 new tools, header search, recent tools + favorites (localStorage), category intros      | done, deployed                         |
| 24    | Read-only product strategy/architecture audit (no code changes)                           | done                                   |
| 25    | Japan Money & Work Suite: take-home pay, student work limits, furusato nozei (2026 rules) | done, deployed (`fe25bc3`)             |
| 26    | Read-only production audit (no code changes)                                              | done                                   |
| 27    | Docs truth, GitHub Actions CI, Privacy page accuracy, region + measurement decisions      | implemented, uncommitted, not deployed |

Phase 3's brief absorbed what this table originally split across phases 3–7 (registry + routing, the
Japan/Student/Developer tools, and client-side search), so those rows were merged rather than left
stale — see `docs/tools.md` for what actually landed. Phase 4 is a separate, later product-quality pass
(not part of that original 3–7 merge): a deterministic related-tools system, category filtering on
`/tools`, category cross-links, a heading-outline fix on the empty states, and expanded navigation/
accessibility test coverage — see `docs/tools.md` ("Search", "Related tools"). Update this table as
phases land. Production (https://toolora-smoky.vercel.app, Vercel project `toolora`, deployed from `main` on the GitHub
remote `ShahRiarKhan55/Toolora`) runs the Phase 25 build, commit `fe25bc3`: 34 tools, 7 live categories (the AI category is empty and
excluded), 47 sitemap URLs, accounts disabled. **Not implemented:** Google Sign-In, accounts, PWA, payments/Stripe, subscriptions, AI
tools, Postgres, saved scenarios or history, analytics, ads. Phase 27 (docs, CI, Privacy wording) is in the working tree only.

The app now has real routes (`react-router-dom`), a working tool registry with all 34 tools (10 MVP, 7 from Phase 7, 8 from Phase 21,
6 from Phase 23, 3 from Phase 25), and a
client-side search over it (`apps/web/src/lib/searchTools.ts`). Phase 5 added the SEO foundation
(see "SEO principles"): every page sets canonical/OG/Twitter/robots tags and JSON-LD client-side
(`useDocumentMeta`), and the server generates `sitemap.xml`/`robots.txt` from the registry. Phase 8 made
the server serve the built SPA and inject the same per-route tags (and JSON-LD) into `index.html`, so
crawlers/social previews that do not run JavaScript see them (see "SEO principles"). Phase 6 was an audit-driven polish pass
(see `docs/architecture.md`, "Resilience and navigation"); it added no features or dependencies.

## Architecture

npm-workspaces monorepo. **Every command is run from the repository root.**

```
apps/web         React 19 + Vite 8 + Tailwind 4 SPA. All tool logic runs here, in the browser.
apps/server      Express 5 API; also serves the built SPA with per-route SEO tags injected, plus sitemap/robots.
packages/shared  Framework-free TypeScript shared by both (tool registry metadata, SEO helpers, site
                 constants). Shipped as *source* (package.json `exports` → src/index.ts); consumers'
                 bundlers compile it. It must not import React, Express or Node-only APIs.
prisma/          schema.prisma (SQLite). apps/server/src/generated/ is generated and git-ignored.
docs/            architecture.md (why), tools.md (the registry, routing and how to add a tool).
```

Details and rationale: `docs/architecture.md`.

### Pinned toolchain choices (do not "fix" these by upgrading blindly)

- **TypeScript 6.0.x, not 7.x** — typescript-eslint supports `<6.1.0`. TS 6 also changed defaults:
  `types` is empty unless listed, so each tsconfig lists its own (`node`, `vite/client`).
- **Prisma 7.10.0, not `latest`** — npm's `latest` tag currently points at an 8.0 release candidate.
  Prisma warns "update available"; ignore it until 8.x is stable. Prisma 7 uses driver adapters
  (`@prisma/adapter-better-sqlite3`) and `prisma.config.ts`; it does not read `.env` by itself.
- **ESLint 10 with an `overrides` entry** for `eslint-plugin-jsx-a11y` (its peer range stops at 9, but it
  works — verified by a probe file that triggers `alt-text` etc.). If ESLint or the plugin is bumped,
  re-verify the a11y rules still fire.
- npm 11 prints "install scripts not yet covered by allowScripts" for `prisma`, `esbuild`,
  `better-sqlite3`. They currently run fine. If a future npm blocks them, use `npm approve-scripts`.

## Commands

```
npm install          install everything (postinstall generates the Prisma client)
npm run dev          web (Vite) + server (tsx watch) together
npm run dev:web      web only        npm run dev:server   server only
npm test             vitest run (all workspaces)      npm run test:watch
npm run lint         eslint .        npm run lint:fix
npm run format       prettier --write .   |   npm run format:check
npm run typecheck    tsc for root + every workspace
npm run build        server bundle (esbuild) + web bundle (Vite)
npm run check        format:check + lint + typecheck + test + build  ← run before declaring done
npm run build:vercel what Vercel runs (build + copy the web build to public/); CI runs it after check
npm start            run the built server (node apps/server/dist/index.js)
npm run db:generate  regenerate Prisma client     npm run db:migrate   create/apply a dev migration
```

Vite defaults to port 5173 and silently falls back to the next free port if it is taken. The API listens
on 3001 (`PORT`); the Vite dev proxy forwards `/api` to 3001. Configuration lives in `.env` (optional,
git-ignored; see `.env.example`).

## Coding standards

- TypeScript `strict` plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals/Parameters`,
  `verbatimModuleSyntax`. No `any`, no `@ts-ignore`/`@ts-expect-error` without a written reason.
  Do not silence lint or type errors to get green — fix the cause. Never lower a check to pass.
- Prettier is the formatter (`.prettierrc.json`); ESLint is the linter (type-aware rules on).
- Match the surrounding code's style, naming and comment density. Comments explain _why_, not _what_.
- Reuse components and helpers; do not copy-paste between tools. Prefer the platform/standard library
  over a new dependency. Every new dependency needs a reason (bundle size, maintenance, security).
- Web: function components, accessible by default (see UI rules), Tailwind utilities + design tokens
  defined once in the CSS `@theme` in `apps/web/src/index.css`. No UI kit, no animation library.
- Server: config validated with zod at startup (`config.ts`); all errors go through `errorHandler`.
- Write files as UTF-8 **without BOM** and LF line endings (Windows PowerShell 5.1's
  `Set-Content -Encoding utf8` adds a BOM — do not use it for source files).

## Testing requirements

- Vitest (+ React Testing Library for components, supertest for the API). Import from `vitest`
  explicitly (no globals). Unit tests sit next to the code (`*.test.ts[x]`); server integration tests
  live in `apps/server/tests/`.
- **Every tool ships with tests** covering: normal input, edge cases, invalid input, boundaries, and
  empty input. Specific must-haves: leap years and date boundaries (age), Japanese era boundaries,
  invalid JSON, Unicode Base64, timestamp seconds vs milliseconds, GPA edge cases.
- Test behavior a user or client can observe, not implementation details.
- **Bug fixes start with a failing test** that reproduces the bug; confirm it fails without the fix.
- A change is not done until `npm run check` passes. Report failures honestly; never claim success
  from a partial run. Verify servers/UI by actually running them, not just by compiling.

## Tool architecture (Phase 3 — the contract, and how it works today)

Full detail and the "adding a tool" walkthrough live in `docs/tools.md`; the short version:

- Tool **metadata** lives in one registry, `TOOLS` in `packages/shared/src/tools.ts` (id, slug, name,
  description, category, icon identifier, keywords, seoTitle, seoDescription, localOnly, order). The
  route is derived — **`/tools/<slug>`, flat, not nested under its category** (`/tools/japan` is the
  _category_ page; a tool's own route is a sibling, e.g. `/tools/japanese-era-converter`) — never
  stored twice. Homepage cards, category pages, search and per-route document title/description are
  all generated from it; the sitemap/robots and server-injected tags are generated from it too. Nothing hard-codes a
  tool list.
- Tool **implementation** lives in `apps/web/src/tools/<tool-id>/`: `logic.ts` (pure, tested),
  `<Name>Tool.tsx` (UI built from shared components), `content.tsx` for the explanatory copy, tests.
  `apps/web/src/tools/index.ts` maps each registry id to its `{ Component, content }`; `Component` is
  behind its own `import()`, so Vite gives each tool its own chunk.
- A test (`apps/web/src/tools/registry.test.ts`) enforces registry ↔ implementation parity (no
  metadata without a component and vice versa).

### Rules for adding a tool

1. Confirm it can run fully in the browser. If it needs a server or external API, stop and ask.
2. Add the registry entry; create the tool folder; write `logic.ts` **and its tests first**.
3. Build the UI from shared components — do not invent a new page layout.
4. Include validation, friendly errors, reset/copy where sensible, and explanatory content for users/SEO.
5. Register it in `apps/web/src/tools/index.ts`.
6. Run `npm run check`. Update `docs/tools.md`, and this file if any rule changed.

## Local preferences (Phase 23)

Recently used tools and favorites live in the visitor's `localStorage` (`apps/web/src/lib/toolPrefs.ts`, keys
`toolora:recent-tools` and `toolora:favorite-tools`). They store **tool slugs only** (never input or results), are validated
against the registry on every read, are capped (5 recents), never reach the server, and must degrade silently when storage is
blocked. This is the only thing Toolora writes to browser storage; do not extend it to tool input without the owner's approval.
Header search (`components/layout/HeaderSearch.tsx`) reuses `searchTools`; there is no search endpoint.

## Japan money rules (Phase 25)

The take-home pay, furusato nozei and student work tools are estimates built on **versioned rule data**: `apps/web/src/config/japanMoneyRules/`
(`rules.ts` numbers with their source, `sources.ts` what each official source establishes, shown on every tool page as "Sources and
assumptions"). Calculations are in `lib/japanTax.ts` and `lib/japanPayroll.ts` (whole-yen integer arithmetic, rounding documented
inline); the UI never holds a tax number. Income tax follows the NTA year-end adjustment procedure (taxable income down to ¥1,000, × 102.1%, final amount down to ¥100); resident tax is a
**steady-state estimate** from the entered income (the real bill reflects the previous year) and must be labelled so; employer social insurance
in the student checker is separate conditions with **no wage threshold** (the ¥88,000 requirement ended 2026-10-01). Rules: every result shows its rule year (`JAPAN_MONEY_RULE_YEAR_LABEL`, currently 2026 / 令和8年);
nothing is fetched at runtime and there is no server endpoint; wording is "estimate", never "official", and never implies government
affiliation or advice; the student checker keeps immigration, tax and insurance limits separate and must never collapse them into one
number; salary and household inputs are never stored (the only browser storage is still the Phase 23 slug lists). **When a new
year's rules are published, add a new rules version and bump the year; do not edit a number in place.** New numbers need an
authoritative source (NTA, MHLW, JPS, ISA, 総務省 or a local government) read from the primary page, not a calculator site; if sources
conflict or cannot be verified, ship less. Known limits are listed in `docs/tools.md`, "Phase 25 tools".

## Rules against fake functionality

- Every shipped tool and control must really work. No placeholder pages presented as working, no
  disabled "coming soon" tools in the registry, no hard-coded demo output.
- No fake analytics, user counts, testimonials, reviews, "trusted by" claims, or made-up statistics.
- Anything that is not live must say so in the UI (e.g. the Currency Converter shows **daily reference
  rates** with their date and source; never call them live, real-time or transaction rates).
- Do not describe unbuilt features as existing in docs, UI copy or commit messages.

## Privacy principles

**Measurement decision (Phase 27): Toolora stays analytics-free.** No counters, no event endpoint, no third-party scripts, no Vercel Web
Analytics/Speed Insights. Quality is judged from Search Console, host infrastructure metrics, synthetic checks and direct feedback.
Any future first-party count needs the owner's explicit approval and the minimum dataset in `docs/architecture.md`, 11. The Privacy
page must say exactly what is true: most tools are browser-only, the Currency Converter asks Toolora's server for rates (base currency
only), and recent/favorite tool slugs sit in localStorage.

- Local tools (every tool in the registry except the Currency Converter, which fetches rates for the base currency only) process input
  **in the browser only**. Never send tool input to the server; never put it in URLs or storage without
  the user asking. Say so in the UI where it reassures users.
- Server logs contain method, path, status, duration and request id only — never query strings,
  headers or bodies (`requestLogger.ts`, covered by tests).
- Prefer no third-party requests (fonts, scripts, analytics). Randomness uses `crypto.getRandomValues` /
  `crypto.randomUUID`, never `Math.random`.
- API errors never expose stack traces or internals in any environment; details go to logs only.

## SEO principles

- Every route has a unique `<title>`, meta description, canonical URL, Open Graph tags, one `<h1>` and a
  sensible heading hierarchy; clean URLs; useful explanatory content per tool; no keyword stuffing.
- Every page calls `useDocumentMeta({ title, description, path?, robots?, structuredData? })`
  (`apps/web/src/lib/useDocumentMeta.ts`), which owns title, description, robots, canonical, `og:*`,
  `twitter:*` and JSON-LD and clears whatever a page does not supply. Never set head tags any other way.
  The 404 page passes no `path` and `noindex,follow`; empty categories are `noindex,follow`; search/filter
  query strings never get their own canonical.
- **Server-injected head (Phase 8).** Per-route metadata is defined once in `packages/shared/src/pageMeta.ts`
  (`homeMeta`, `categoryMeta`, `toolPageMeta`, `resolveRouteMeta`, ...). The pages pass it to
  `useDocumentMeta`; in production `apps/server/src/routes/spa.ts` resolves the request path with
  `resolveRouteMeta`, renders escaped tags (`seoHead.ts`) and replaces the `<!--seo:start-->…<!--seo:end-->`
  region of the built `index.html` (unknown routes: HTTP 404 + `noindex,follow`, no canonical). The client
  hook updates those same elements in place (no duplicates). New pages must get their metadata from
  `pageMeta.ts` and a case in `resolveRouteMeta`, never a separate server table. Set `VITE_PUBLIC_SITE_URL`
  at **web build time and server runtime**: a bundle built without it overwrites the server's absolute
  canonicals/JSON-LD with relative ones after hydration. In dev (Vite) there is no injection.
- **`VITE_PUBLIC_SITE_URL`** is the single production origin (no trailing slash), read by web and server
  and inlined into the web bundle at build time. Unset → relative canonicals, no JSON-LD, `sitemap.xml` 404. Never invent or placeholder it; set the real one for production builds.
- `sitemap.xml`/`robots.txt` are generated from `TOOLS`/`CATEGORIES` (`packages/shared/src/sitemap.ts`,
  served by `apps/server/src/routes/seo.ts`); never hand-list URLs. JSON-LD is `WebSite` (home) and
  `WebApplication` (tools) from registry data only — no ratings, reviews, prices or organization claims.
- Lazy-load tools, keep bundles small, and keep layout stable (Core Web Vitals).

## CI and deployment (Phase 27)

`.github/workflows/ci.yml` runs `npm ci`, `npm run check` and `npm run build:vercel` on every push and pull request (Node from `.nvmrc`,
no secrets). It never deploys: Vercel's GitHub integration deploys `main` to Production and other branches to Previews, so there is no
manual deploy command. `VITE_PUBLIC_SITE_URL` is Production-scoped only. Function region is `iad1`; moving it to `hnd1` is recommended
(evidence in `docs/architecture.md`, 10) but waits for an owner-approved deploy. Live project facts: `docs/deployment.md`.

## Production serving (Phase 10)

`npm run build` then `NODE_ENV=production npm start` (from the repo root; `npm start` does not set `NODE_ENV`). Express sets helmet headers
(CSP `script-src 'self'`, HSTS, ...) plus `Permissions-Policy`; **no CORS** (same-origin app - do not add it without a concrete
cross-origin client). Caching: `/assets/*` immutable 1 y, HTML `no-cache`, `/api/*` `no-store`. Responses are not compressed by
Express - the proxy/platform must do it. `/api/health` pings SQLite (the DB holds the accounts: run `npm run db:deploy` first).
Payments will need a real DB strategy and are deferred. Vercel (Phase 17, `vercel.json`, `server.mjs`, `docs/deployment.md`): stateless while accounts are closed — `/api/health` skips the DB ping then; accounts must not be enabled on Vercel without a persistent database. Regression tests: `apps/server/tests/production.test.ts`.

## Dynamic data (Phase 18)

Live data goes browser → `/api/<domain>` → `apps/server/src/services/<domain>` → provider adapter; the browser never calls
providers, no generic proxy endpoints, no keys in `VITE_*`. Currency is the first domain (keyless providers, daily
reference rates - never call them real-time). Cache and rate limiter are in-memory and best-effort on Vercel. Details:
`docs/architecture.md` 6c.

**Currency Converter (Phase 19)** is the one tool that is not `localOnly`: it loads rates for the _base currency only_
from `/api/currency/rates` (the amount never leaves the browser). Variant pages (`TOOL_VARIANTS` in
`packages/shared/src/tools.ts`: `/tools/jpy-to-bdt`, `/tools/bdt-to-jpy`) are the same tool opened with a preset: own
route, SEO metadata and copy (`tools/currency-converter/variantContent.tsx`), no second implementation, no tool card.
Keep the ExchangeRate-API attribution link visible, credit the fallback provider truthfully, and never put a rate in
static copy. Currency is its own category (`/tools/currency`). Historical charts are deferred: no provider has clear redistribution terms (`docs/architecture.md` 6c).

## Accounts and entitlements (Phase 11 boundary, Phase 12 authentication)

**Launch state (Phase 15): accounts are closed.** `ACCOUNTS_ENABLED = false` in `packages/shared/src/site.ts` hides the
header link, turns `/account` into a noindex notice and stops the server mounting `/api/auth`. Code, models and tests
stay. Owner-supplied deploy values and the pre-reopen checklist: `docs/deployment.md`. The text below describes the
system as it behaves when the flag is on.

Real accounts exist (`User`, `Session`; email + scrypt password; HttpOnly cookie session under `/api/auth`, UI at
`/account`) - see `docs/architecture.md`, 6b. Payments, subscriptions, checkout, webhooks, email verification,
password reset and social login do **not** exist; all tools stay public and anonymous use must keep working.
Authentication rules: only `resolveSubject(req, auth)` turns a request into a Subject (never read cookies/headers
elsewhere for identity); never store or log passwords, raw session tokens or hashes; session tokens live only in the
HttpOnly cookie (never URLs, `localStorage` or response bodies); state-changing `/api` routes must be same-origin
JSON (`sameOriginJson`); no CORS; login failures stay one generic response; apply migrations with `npm run db:deploy`;
per-client rate limiting is absent and must be added in front of `/api/auth/*` before launch (the app only caps pending password hashes, `503 busy`). Phase 11 groundwork: `ToolMeta.access` (default
`'public'`) declares a future requirement; `apps/server/src/access.ts` decides (`canAccess`), and
`resolveSubject` is the one place a request becomes a Subject. Rules: never trust
client-sent entitlement state; premium checks for server capabilities happen server-side; never put secrets in
`VITE_*`; never store card data; payment webhooks must be signature-verified; auth errors are generic. No
entitlement/payment models exist yet; add them with the payment phase.

## Accessibility and UI rules

Semantic HTML first; every control has a visible label and keyboard access and a visible focus ring;
errors are announced (`role="alert"` / `aria-live`) and tied to inputs; results use `aria-live="polite"`;
colour contrast meets WCAG AA; touch targets are comfortable; layouts work on mobile, tablet, desktop.
`eslint-plugin-jsx-a11y` is on — do not disable its rules.

### UI conventions (Phase 2 — the design system)

- **Tokens only.** Tailwind's default palette and shadows are cleared in `index.css`, so `bg-slate-50` or
  `text-blue-600` do not exist. Use the semantic tokens: `background`, `surface`, `surface-muted`,
  `foreground`, `muted-foreground`, `border`, `border-strong`, `primary` (+ `-hover`, `-foreground`,
  `-soft`, `-soft-foreground`), `success`/`warning`/`error` (+ `-soft`), `accent-<category>` (+ `-soft`),
  `focus`; shape/elevation `rounded-control|card|pill`, `shadow-card|raised`; widths `max-w-page|content`.
  Need a new colour? Add a token (and check AA contrast); never an arbitrary value like `bg-[#123456]`.
- **Building blocks** live in `apps/web/src/components/`: `ui/` (Button, ButtonLink, Input, Textarea,
  Select, Field, Card, Badge, Alert, EmptyState, CopyButton, ResultBox, icons), `layout/` (SiteLayout,
  Header, Footer, Container, Section, PageHeader, Breadcrumbs, ToolPageLayout), and `tool/` (ToolCard —
  the tool summary card used on the home page, "All tools" and category pages). Reuse them; add a
  component only when a real tool needs it. Form controls always go through `Field` (label, hint,
  announced error). `ResultBox` is the shared "labelled result + copy" pattern most calculator/converter
  tools need — use it before writing a bespoke result block.
- **One `<main>`, one `<h1>`.** `SiteLayout` owns `<main id="main">`; pages render inside it. Tool pages
  are `ToolPageLayout` with the tool as its children; pass `localOnly` only if the tool truly runs in the
  browser. Heading outline: h1 → h2 sections → h3 cards, no skipped levels.
- **One focus style**, set globally in `index.css` (`:focus-visible`); never remove it. Interactive
  targets are at least 44px tall (`sm` buttons are the documented exception). State is never colour-only:
  pair it with text or an icon. No new animations beyond simple colour transitions.
- **Category display** (name, description) comes from `CATEGORIES` in `packages/shared`; icons and colours
  from `apps/web/src/config/categoryPresentation.ts`. This is site structure, not the tool registry.
