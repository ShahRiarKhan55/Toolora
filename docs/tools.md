# Tools

How the tool registry and routing work, and the exact steps to add a new tool. See `CLAUDE.md` for
the day-to-day rules this implements, and `docs/architecture.md` for the reasoning behind it.

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
SEO tags all read from `TOOLS` — none of them keep their own list.

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
implementation exists with no registry entry.

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

## SEO (current state)

Every tool and category page calls `useDocumentMeta` (`apps/web/src/lib/useDocumentMeta.ts`) to set
`document.title` and the meta description while it is mounted. This helps once JavaScript has run, but
a pure client-side SPA still serves the same initial `<head>` to crawlers and social previews that do
not execute JavaScript — the server-side injection that fixes this for real is Phase 8 (see
`docs/architecture.md`, "SEO strategy"); nothing here replaces that plan.
