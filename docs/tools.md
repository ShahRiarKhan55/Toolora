# Tools

How the tool registry and routing work, and the exact steps to add a new tool. See `CLAUDE.md` for
the day-to-day rules this implements, and `docs/architecture.md` for the reasoning behind it.

## Current catalog (34 tools)

| Category  | Tool (route `/tools/<slug>`)                                                                                                                                                                                                                                                                                                                                 |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Japan     | `japanese-era-converter`, `japanese-age-calculator`, `japanese-postal-code-formatter`, `japanese-phone-number-formatter`, `japanese-consumption-tax-calculator`, `kana-width-converter`, `japan-take-home-pay-calculator`, `japan-student-work-limit-checker`, `japan-furusato-nozei-limit-estimator` (the Currency Converter moved to Currency in Phase 20) |
| Currency  | `currency-converter`                                                                                                                                                                                                                                                                                                                                         |
| Student   | `gpa-calculator`, `percentage-grade-calculator`, `word-counter`, `gpa-percentage-converter`, `date-difference-calculator`                                                                                                                                                                                                                                    |
| Developer | `json-formatter`, `base64-encoder-decoder`, `uuid-generator`, `unix-timestamp-converter`, `regex-tester`, `csv-json-converter`, `json-to-typescript`, `url-encoder-decoder`, `html-entity-encoder-decoder`, `hash-generator`, `jwt-decoder`                                                                                                                  |
| Text      | `text-case-converter`, `markdown-preview`, `text-diff-checker`                                                                                                                                                                                                                                                                                               |
| Finance   | `compound-interest-calculator`, `loan-payment-calculator`, `percentage-calculator`                                                                                                                                                                                                                                                                           |
| Time      | `time-zone-converter`, `business-days-calculator`                                                                                                                                                                                                                                                                                                            |

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
/tools/<category>          Category page (japan | currency | student | developer | text | finance | time | ai)
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
  category: CategoryId; // 'japan' | 'currency' | 'student' | 'developer' | 'text' | 'finance' | 'time' | 'ai'
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

## Variant pages _(Phase 19)_

`TOOL_VARIANTS` (shared) lists SEO landing pages that are an existing tool opened with a preset, e.g.
`/tools/jpy-to-bdt` → `currency-converter` with `{ from: 'JPY', to: 'BDT' }`. A variant has its own slug (same flat
namespace as tools and categories), SEO text and copy (`TOOL_VARIANT_CONTENT`), is in the sitemap and
`resolveRouteMeta`, but is not a card, not searchable and not a second implementation. The tool's component
receives the preset as its `preset` prop. Add a pair by adding one `TOOL_VARIANTS` entry and its copy.

**Retired URLs:** `LEGACY_TOOL_REDIRECTS` (shared) maps a removed tool route to its replacement
(`/tools/japanese-yen-converter` → `/tools/currency-converter`); `routes/spa.ts` answers it with a 301 (query string kept)
before any page handling. They are not in the registry or sitemap. Production/Vercel only (Express serves every page route).

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
2. The tool's own optional `related` ids from the registry (Phase 9, hand-picked, most relevant first;
   unknown ids are skipped), then same-category tools, then every other tool, the fallback groups
   sorted by the registry's `order` field (not array position).
3. De-duplicate and take the first `limit` (default 3).

Phase 9 added `related` because pure category/order selection left 8 of 17 tools with no related-link
inbound. A test now requires every tool to be linked from at least one other tool page. Home,
header/footer, "Browse other categories" and the All-tools filters list only categories that have
tools (`getPopulatedCategories()`), so the noindex AI category is never a discovery link.

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

## Currency category (Phase 20)

`currency` is a first-class category (`CATEGORY_IDS`, shown second after Japan). The Currency Converter lives there; route
and variants (`/tools/jpy-to-bdt`, `/tools/bdt-to-jpy`) are unchanged. The category page lists the pair variants of its tools
under "Popular conversions", derived from `TOOL_VARIANTS` (add a variant and the link appears). It is indexable and in the sitemap
because it has a tool. Historical rates are deliberately not built; see `docs/architecture.md` 6c.

## Phase 21 tools

Eight deterministic, browser-only tools (`localOnly: true`, no accounts, no network). Shared helpers: `components/tool/TextResult`
(read-only plain-text result + copy), `components/tool/CurrencySelect` and `lib/formatMoney` (display-only currency label for the
two finance tools; no rates), `lib/isoDate` and `lib/parseDecimal` (reused).

- **URL Encoder / Decoder** — `encodeURIComponent`/`decodeURIComponent` only (component semantics, explained in the UI; `+` is not a
  space). Lone surrogates become U+FFFD instead of throwing; malformed `%` sequences give an error, never a crash.
- **HTML Entity Encoder / Decoder** — escapes `& < > " '` (optionally all non-ASCII as `&#N;`). Decoding uses a detached
  `<textarea>` (tags stay text, nothing executes) and rejects `&name;` that is not a real entity or a numeric one outside Unicode.
  Output is only ever shown in a read-only textarea.
- **Text Case Converter** — lower, UPPER, Title (every word), Sentence, camel, Pascal, snake, kebab. Locale-independent; line breaks
  kept; programming cases work per line and split existing camelCase/acronyms. No language-aware title casing.
- **Markdown Preview** — `react-markdown` (React elements, no `innerHTML`) with an allow-list of elements: headings (shown from
  h3 down so the page keeps one h1), paragraphs, em/strong, links (`rel="noopener noreferrer nofollow"`, `javascript:`/`data:` URLs
  dropped by the library), lists, code, fenced code, blockquotes, rules. Raw HTML is never parsed; images are not allowed (no outside
  requests). Dependency cost: it adds a lazy chunk only for this tool.
- **Compound Interest** — `A = P(1 + r/n)^(nt)`, yearly/half-yearly/quarterly/monthly/daily (365), time in years or months, principal > 0,
  rate 0–100 %, time ≤ 100 years. Rounded only for display.
- **Loan Payment** — standard amortization (`P·r / (1 − (1+r)^−n)`, 0 % handled), monthly/biweekly(26)/weekly(52), term in years or
  months (≤ 100 years), yearly amortization summary whose columns add up to the totals.
- **Time Zone Converter** — `Intl.DateTimeFormat` only (zone list from `Intl.supportedValuesOf` plus UTC). A local time is resolved by
  bracketing the zone offset a day either side: no candidate = skipped by a DST gap (error), two = repeated (earlier used and flagged).
  Years 1900–2100.
- **Business Days** — Monday–Friday, no holidays (stated in the UI). Both ends included by default (like `NETWORKDAYS`); either can be
  excluded; reversed dates are swapped and flagged.

## Phase 25 tools (Japan Money & Work Suite)

Status: **implemented, not committed, not pushed, not deployed.** Three browser-only tools in the existing Japan category, on the
**2026 (令和8年)** rules. Rule data: `apps/web/src/config/japanMoneyRules/`; calculations: `lib/japanTax.ts`, `lib/japanPayroll.ts`;
shared "Sources and assumptions" block: `components/tool/SourcesAndAssumptions.tsx`. All are estimates; none is an official calculation.

- **Japan Take-Home Pay Calculator** — monthly or annual gross salary, age 18–64, prefecture (Kyokai Kenpo rate), insurance toggles.
  Employment income deduction (min ¥740,000, NTA No.1410), basic deduction (¥1.04M up to ¥4.89M, No.1199), income tax brackets plus
  2.1 % reconstruction tax (No.2260), resident tax (10 %, ¥430,000 basic deduction, adjustment credit, ¥5,000 per capita), health
  insurance + 0.23 % child support levy + 1.62 % care insurance (40–64), pension 9.15 % on grades up to ¥650,000, employment insurance 0.5 %.
  Employee shares rounded 50 sen down / above up. Verified against the published grade tables and hand-derived examples.
- **Japan Student Part-Time Work Limit Checker** — four separate systems, never one number: immigration (28 h/week all jobs; 8 h/day in a
  school's long vacation for 留学; 家族滞在 28 h with no vacation exception; unrestricted statuses; permission required), tax lines
  (resident tax ¥1.19M, own income tax ¥1.78M, 勤労学生 ¥1.63M, tax dependant ¥1.36M, 特定親族特別控除 ¥1.97M for 19–22), health-insurance
  dependant (< ¥1.3M, < ¥1.5M for 19–22) and a note that employer social insurance excludes students (¥88,000 wage test ended 2026-10-01).
- **Japan Furusato Nozei Limit Estimator** — 総務省 formula: limit = resident income tax × 20 % ÷ (90 % − rate × 1.021) + ¥2,000, rate bracket
  from Sakai City's published table (inclusive bounds), taxable income after social insurance, optional spouse (¥620,000 income test),
  dependants (general, 19–22) and other deductions.

Related links are curated and reciprocal (take-home ↔ percentage, currency, consumption tax, student, furusato; student ↔ furusato;
student and furusato ↔ percentage).

**Not modelled, by design:** bonuses (insurance on bonuses differs), dependants and other deductions in take-home pay, company health
societies, local per-capita add-ons (e.g. +¥300 Osaka Pref., +¥500 Kagoshima Pref.) and lower resident-tax exemption limits in 2nd/3rd-grade
municipalities, ages 65+, self-employment, home loan deduction, one-stop furusato treatment, elderly/disabled dependants and
single-parent or working-student deductions in the furusato estimate.

**Rounding and the salary table (verified against the NTA's 令和8年分 material).** Salary → employment income uses NTA No.1410 and, below
¥6.6M, the ¥4,000-bucket table; all 1,080 rows read from the NTA's 令和8年分 table (年末調整のしかた, pages 47–54) match the code
(`lib/fixtures/nta2026SalaryIncomeTable.ts`, tested in `lib/japanTax.test.ts`). Income tax follows the NTA year-end adjustment procedure:
taxable income rounded down to ¥1,000 → tax from the quick-reference table → × 102.1% (reconstruction tax included) → the result
rounded down to ¥100. It is the full-year amount; monthly withholding is settled at year-end adjustment and can differ.

**Resident tax is a steady-state estimate.** Resident tax billed in a year generally reflects the previous year's income. The take-home tool
has one salary input, so it applies the 令和9年度 rules (income earned in 2026) to that salary as if the same had been earned the year
before. `PayrollResult.residentTaxModel` is `'steady-state'`, and the UI, assumptions, summary and FAQ say so. It is not the current
year's actual bill; the municipality sets that.

**Premiums are estimates of the employee share.** Health, child support levy and care insurance are summed before the half-share is
rounded (50 sen or less down); pension and employment insurance are rounded the same way. A payslip can differ by about ¥1 a month per
line. The tool does not reproduce any employer's payroll.

**Student checker and social insurance.** Employer social insurance is shown as separate conditions, never as an income limit: scheduled
20 hours a week at one employer (met at 20, not at 19.99), employer with 51+ employees (user-selected), not a student (an exclusion that
stays in force whatever else is met), and the ¥88,000 monthly wage requirement, shown as **abolished on 2026-10-01** (Japan Pension
Service). Pay is never compared with a social-insurance figure (tested for independence from income).

**Remaining assumptions to re-check on audit:** (1) health, child support and care premiums are summed before rounding, where the published
table lists them separately (±¥1 a month); (2) the ¥450,000 resident-tax exemption is the figure Nagoya City states, not a nationwide rule, and applies to a single person (a Hokkaido village page shows resident tax starting at a salary of ¥1.12M instead of ¥1.19M;
municipality-specific limits are not modelled and the UI says so); (3) the ¥430,000 resident-tax basic deduction is confirmed by
municipal pages for 令和9年度 (Tambasasayama, Nakasatsunai), not by a 総務省 page; (4) the 28-hour immigration rule is stated as the ISA
words it ("1週"), without a claim about how a week is counted.

## Phase 23 tools and local discovery

Six more browser-only tools (`localOnly: true`), each with pure `logic.ts`, tests and copy like the rest:

- **Japanese Consumption Tax Calculator** (Japan) — standard 10 % and reduced 8 % only, tax-exclusive → tax-inclusive and back.
  Exact BigInt arithmetic on hundredths of a yen (no float artifacts); the tax is rounded to whole yen (floor / half-up / ceil,
  user's choice) and the other figure follows, so pre-tax + tax = total. Up to 2 decimals, ≤ ¥999,999,999,999. No exemptions,
  special cases, invoice system or advice (stated in the UI).
- **Kana & Width Converter** (Japan) — hiragana ↔ katakana by Unicode offset (ー, kanji and punctuation untouched; ヷ–ヺ stay);
  full ↔ half width for ASCII, ideographic space and katakana (voiced marks split/merge: ガ ↔ ｶﾞ), scope selectable. Kana
  punctuation 。「」、・ converts with katakana. ヮヰヱヵヶ have no half-width form.
- **Percentage Calculator** (Finance) — X% of Y, X is what % of Y, percentage change (relative to |old|), increase/decrease by %.
  Results cleaned to 12 significant digits; division by zero and change-from-zero give messages.
- **Text Diff Checker** (Text) — line diff (LCS after trimming the common start/end), no dependency. Compare-on-click; capped at
  4 M table cells (≈ 2000 × 2000 differing lines) with a friendly error. Rendered as a table of text nodes (never `innerHTML`), with
  +/− signs and screen-reader labels besides colour. No inline word-level highlighting.
- **Hash Generator** (Developer) — SHA-256/384/512 via `crypto.subtle.digest` over UTF-8, shown together as lowercase hex. No MD5/SHA-1.
- **JWT Decoder** (Developer) — splits three Base64URL parts (no padding accepted), decodes UTF-8 JSON objects, lists the registered
  claims (`iss sub aud exp nbf iat jti`; time claims as UTC dates, exp/nbf compared with the device clock). **Decodes only; never
  verifies** — the UI says so, and that tokens stay local. JWE (5 parts) is rejected.

**Header search** — a toggle under the header bar (so it cannot overflow the nav at any width) with the same `searchTools` filter as
`/tools`: up to six links to tools, Enter opens `/tools?q=…`. **Recently used** (last 5 opened tool pages) and **Favorites**
(star button on each tool page) are shown on the home page only when non-empty; storage rules are in `CLAUDE.md`, "Local
preferences". **Category intros** live in `apps/web/src/config/categoryIntro.ts` (Japan, Currency, Text, Finance, Time).
