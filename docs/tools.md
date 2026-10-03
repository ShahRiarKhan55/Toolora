# Tools

How the tool registry and routing work, and the exact steps to add a new tool. See `CLAUDE.md` for
the day-to-day rules this implements, and `docs/architecture.md` for the reasoning behind it.

## Current catalog (17 tools)

| Category  | Tool (route `/tools/<slug>`)                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Japan     | `japanese-yen-converter`, `japanese-era-converter`, `japanese-age-calculator`, `japanese-postal-code-formatter`, `japanese-phone-number-formatter`   |
| Student   | `gpa-calculator`, `percentage-grade-calculator`, `word-counter`, `gpa-percentage-converter`, `date-difference-calculator`                            |
| Developer | `json-formatter`, `base64-encoder-decoder`, `uuid-generator`, `unix-timestamp-converter`, `regex-tester`, `csv-json-converter`, `json-to-typescript` |

Phase 7 added the last seven of each row. Notes on what they do and deliberately do not do:

- **Regex Tester** — native `RegExp` only (flags g/i/m/s/u), live results with positions (UTF-16 units),
  numbered/named groups, a 1000-match cap. Empty pattern shows nothing; invalid pattern/flags show the
  engine's message. A catastrophically backtracking pattern can still stall the tab (no worker).
- **CSV ↔ JSON** — hand-written RFC 4180-style parser (quotes, `""`, commas/newlines in quotes, CRLF,
  blank lines skipped, stray text after a closing quote is an error). CSV→JSON keeps every value a
  string; JSON→CSV takes an array of objects (union of keys) or of arrays, nested values as JSON text.
  Comma-delimited only.
- **JSON → TypeScript** — infers a shape from one sample: nested objects become named interfaces
  (identical shapes reused, clashes numbered), array items merge (missing keys become optional, differing
  types a union, `null` last), `unknown[]` for empty arrays, all numbers `number`.
- **GPA ↔ Percentage** — one documented proportion (`GPA ÷ scale max × 100`, 4/5/10 scales, 2 decimals).
  Always shows a warning that institutions use their own tables; not presented as authoritative.
- **Date Difference** — strict `YYYY-MM-DD` via `lib/isoDate` (UTC midnight, no locale/DST); end date not
  counted; reversed dates are swapped and flagged; the y/m/d breakdown uses the same borrow convention
  as the age calculator.
- **Postal code** — NFKC-normalizes (full-width digits, hyphen variants, leading 〒), requires exactly
  7 digits with an optional separator after the 3rd, outputs `XXX-XXXX`. Format only; no existence check.
- **Phone number** — NFKC + separator stripping, `+81`/`0081` → domestic. Groups mobile (090/080/070),
  050, toll-free (0120/0800), 0570, 03/06 and five metro codes (045/052/075/078/092); anything else keeps
  its digits ungrouped with a visible notice. Never verifies a number.

## Routes

```
/                          Home page
/tools                     All Tools — searchable list of every tool
/tools/<category>          Category page (japan | student | developer | ai)
/tools/<slug>              A single tool
```

Category ids and tool slugs share one path segment (`/tools/:param`); `ToolsSlugRoute` resolves
which one a request means by checking the category list first, then the registry, and renders a 404
page if neither matches. Nothing hard-codes a per-category or per-tool route — add a tool to the
registry and its route exists.

## The registry

`packages/shared/src/tools.ts` exports `TOOLS: readonly ToolMeta[]`, the single source of truth for
every tool's metadata:

```ts
interface ToolMeta {
  id: string; // kebab-case, equals the folder name in apps/web/src/tools/
  slug: string; // URL segment: /tools/<slug>
  name: string;
  description: string; // card text
  category: CategoryId; // 'japan' | 'student' | 'developer' | 'ai'
  icon: ToolIconId; // resolved to a component by apps/web/src/config/toolPresentation.ts
  keywords: readonly string[]; // matched by search alongside name/description/category
  seoTitle: string;
  seoDescription: string;
  localOnly: boolean; // true for every current tool: runs entirely in the browser
  order: number; // display order within its category and in "All tools"
}
```

Helpers: `toolRoute(slug)`, `categoryRoute(category)`, `getToolBySlug(slug)`,
`getToolsByCategory(category)`. The home page, "All tools", category pages, search, breadcrumbs and
SEO tags and the sitemap all read from `TOOLS` — none of them keep their own list.

Every tool in `TOOLS` is fully working; there are no disabled or "coming soon" entries (see CLAUDE.md,
"Rules against fake functionality"). A category with no tools yet (currently `ai`) shows an
`EmptyState` on its category page instead of fake registry rows.

## Tool implementation

Each tool owns a folder at `apps/web/src/tools/<tool-id>/`:

```
logic.ts        pure functions — the actual calculation/processing, fully unit-tested
logic.test.ts   normal, edge, invalid and boundary cases
<Name>Tool.tsx  the workspace UI (inputs, actions, result) built from components/ui/*
<Name>Tool.test.tsx
content.tsx     exports `content: ToolContent` — howToUse / about / faq, handed to ToolPageLayout
```

`apps/web/src/tools/index.ts` is the one place that maps a registry `id` to its implementation:

```ts
'my-tool-id': {
  Component: lazy(() => import('./my-tool-id/MyToolTool').then((m) => ({ default: m.MyToolTool }))),
  content: myToolContent,
},
```

Each `Component` is behind its own `import()`, so Vite gives it its own chunk — a tool's code only
downloads when its page is visited. `content` is small and imported eagerly. `pages/tools/ToolPage.tsx`
looks up a tool's implementation and renders it inside `ToolPageLayout`, wrapped in `<Suspense>`.

`apps/web/src/tools/registry.test.ts` fails if a registry entry has no implementation, or an
implementation exists with no registry entry. `packages/shared/src/tools.test.ts` enforces unique ids,
slugs, routes, names, descriptions, SEO titles/descriptions and a globally unique `order` (so listing
order never depends on array position), plus valid categories and icons.

## Adding a tool

1. **Confirm it can run fully in the browser.** If it needs a server or an external API, stop and ask
   the project owner first (see CLAUDE.md's MVP scope rules).
2. **Add one entry** to `TOOLS` in `packages/shared/src/tools.ts` (id, slug, name, description,
   category, icon, keywords, seoTitle, seoDescription, localOnly, order). If it needs a new icon, add
   the id to `TOOL_ICON_IDS` there and draw the icon in `apps/web/src/components/ui/icons.tsx`, then
   map it in `apps/web/src/config/toolPresentation.ts` (a missing mapping is a compile error).
3. **Write `logic.ts` and its tests first.** Keep it a pure, framework-free function (or set of
   functions); it should not know about React or the DOM.
4. **Build `<Name>Tool.tsx`** from `components/ui/*` (Input, Textarea, Select, Button, Alert,
   ResultBox, CopyButton, ...) — do not invent a new page layout or duplicate an existing component.
   Include validation with friendly errors, and reset/copy where it makes sense.
5. **Write `content.tsx`** (how to use, about, FAQ) and register the tool in `apps/web/src/tools/index.ts`.
6. **Run `npm run check`.** The route, registry test, home page card, category page, "All tools"
   listing and search all pick the new tool up automatically — nothing else to wire by hand.
7. Update this file and `CLAUDE.md`'s status table if the change affects either.

## Search

`apps/web/src/lib/searchTools.ts` is a small, local, case-insensitive filter over `TOOLS` — no
backend, no third-party service. It matches a tool's name, description, category name and keywords.
The "All tools" page (`/tools?q=...`) is the primary search surface; the home page's hero search box
submits into it.

`/tools` also takes an optional `?category=<id>` param, applied on top of the search filter (a chip
per category, plus "All categories"). Both params are ordinary `useSearchParams` state, so browser
back/forward and reload behave naturally with no extra code; either can appear alone or combined
(`/tools?category=japan&q=age`). An unrecognised `category` value is treated as "all categories"
rather than erroring or showing nothing.

## Related tools _(Phase 4)_

`apps/web/src/lib/relatedTools.ts` exports `getRelatedTools(tools, current, limit = 3)`, used by
`ToolPage` to fill `ToolPageLayout`'s "Related tools" section. It is deterministic and reads only
the registry — there is no second, manually maintained list of tool relationships:

1. Exclude `current`.
2. Same-category tools first, then every other tool, each group sorted by the registry's `order`
   field (not array position) as the tie-breaker.
3. Take the first `limit` (default 3).

Because the result is always a subset of the `tools` array passed in, it can never surface a tool
that isn't actually registered.

Category pages also cross-link to every other category ("Browse other categories"), and show a
visible tool count, so a reader is never stuck without a way to the rest of the site.

## SEO (current state)

Every page calls `useDocumentMeta` (`apps/web/src/lib/useDocumentMeta.ts`). A tool page takes its title
(`seoTitle`), description (`seoDescription`), canonical (`toolRoute(slug)`) and `WebApplication` JSON-LD
from its registry entry; `sitemap.xml` lists every tool automatically. Adding a tool needs no SEO work
beyond writing a unique `seoTitle`/`seoDescription`. The `ai` category has no tools, so it is `noindex`
and absent from the sitemap until it has one. Details: `docs/architecture.md`, "SEO strategy". The server also
injects the tags into the HTML it serves (`resolveRouteMeta`), so a new tool needs no server change.
