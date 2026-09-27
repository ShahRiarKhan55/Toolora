# CLAUDE.md — Toolora

Guidance for anyone (human or AI agent) working in this repository. **Keep this file current**: when a
decision, command or rule changes, update it in the same change.

## Purpose

Toolora is a multi-purpose web toolbox: many genuinely useful, free online tools grouped into categories
(Japan, Student, Developer; AI later). The plan is free tools → organic traffic → later monetization
(premium features / ads). The MVP is ~10 polished tools, built so it can grow to 50–100+.

The MVP deliberately has **no** auth, payments, ads, analytics or paid/external APIs. Do not add any
of these, or any paid service, without asking the owner first. Never deploy anything without asking.

## Status

| Phase | Scope                                                       | State |
| ----- | ----------------------------------------------------------- | ----- |
| 0–1   | Analysis, monorepo, tooling, server skeleton                | done  |
| 2     | Design system + app shell                                   | done  |
| 3     | Tool registry, routing, first 10 tools, client-side search  | done  |
| 8     | Server-side SEO injection (per-route tags), sitemap, robots | next  |
| 9–11  | Full test pass, lint/build, UX/a11y/perf review             |       |

Phase 3's brief absorbed what this table originally split across phases 3–7 (registry + routing, the
Japan/Student/Developer tools, and client-side search), so those rows were merged rather than left
stale — see `docs/tools.md` for what actually landed. Update this table as phases land.

The app now has real routes (`react-router-dom`), a working tool registry with all 10 MVP tools, and a
client-side search over it (`apps/web/src/lib/searchTools.ts`). What's still outstanding: server-side
SEO tag injection, `sitemap.xml`/`robots.txt` (Phase 8) — pages set `document.title`/meta client-side
today (`useDocumentMeta`), which does not help crawlers/social previews that do not execute JavaScript.

## Architecture

npm-workspaces monorepo. **Every command is run from the repository root.**

```
apps/web         React 19 + Vite 8 + Tailwind 4 SPA. All tool logic runs here, in the browser.
apps/server      Express 5 API (+ later: serves the built SPA, injects SEO tags, sitemap/robots).
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
  _category_ page; a tool's own route is a sibling, e.g. `/tools/japanese-yen-converter`) — never
  stored twice. Homepage cards, category pages, search and per-route document title/description are
  all generated from it; the sitemap/robots generation itself is still Phase 8. Nothing hard-codes a
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

## Rules against fake functionality

- Every shipped tool and control must really work. No placeholder pages presented as working, no
  disabled "coming soon" tools in the registry, no hard-coded demo output.
- No fake analytics, user counts, testimonials, reviews, "trusted by" claims, or made-up statistics.
- Anything that is not live must say so in the UI (e.g. the yen converter's exchange rates are
  user-editable and **not** real-time until a real provider is added — and adding one needs approval).
- Do not describe unbuilt features as existing in docs, UI copy or commit messages.

## Privacy principles

- Local tools (JSON, Base64, UUID, word counter, GPA, percentage, timestamp, age, era, yen) process input
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
- Every tool/category page calls `useDocumentMeta` (`apps/web/src/lib/useDocumentMeta.ts`) to set
  `document.title`/meta description from the registry client-side. This is a stopgap: a client-rendered
  SPA still hides per-page tags from crawlers and social previews that do not run JS, so the server
  will inject route-specific tags into `index.html` from the registry (Phase 8), and generate
  `sitemap.xml` / `robots.txt` from the same registry. Canonical URLs and `og:url` wait on a known
  production origin.
- Lazy-load tools, keep bundles small, and keep layout stable (Core Web Vitals).

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
