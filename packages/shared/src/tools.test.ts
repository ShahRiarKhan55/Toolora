import { describe, expect, it } from 'vitest';
import { meetsAccessLevel, requiredAccess } from './access';
import { CATEGORIES, CATEGORY_IDS } from './categories';
import { categoryMeta } from './pageMeta';
import { getIndexableRoutes } from './sitemap';
import {
  ALL_TOOLS_ROUTE,
  categoryRoute,
  getPopulatedCategories,
  getToolBySlug,
  getToolVariantBySlug,
  TOOL_VARIANTS,
  toolFromVariant,
  getToolsByCategory,
  TOOL_ICON_IDS,
  toolRoute,
  TOOLS,
} from './tools';

describe('TOOLS registry', () => {
  it('only lists existing, distinct, non-self tool ids in `related`', () => {
    const ids = new Set(TOOLS.map((tool) => tool.id));
    for (const tool of TOOLS) {
      const related = tool.related ?? [];
      expect(new Set(related).size, tool.id).toBe(related.length);
      for (const id of related) {
        expect(id, tool.id).not.toBe(tool.id);
        expect(ids.has(id), `${tool.id} -> ${id}`).toBe(true);
      }
    }
  });

  it('getPopulatedCategories excludes categories with no tools', () => {
    const populated = getPopulatedCategories().map((category) => category.id);
    expect(populated).not.toContain('ai');
    expect(populated).toEqual(CATEGORY_IDS.filter((id) => getToolsByCategory(id).length > 0));
  });

  it('keeps every current tool public and free of any account requirement', () => {
    for (const tool of TOOLS) expect(requiredAccess(tool), tool.id).toBe('public');
  });

  it('orders access levels public < premium', () => {
    expect(meetsAccessLevel('public', 'public')).toBe(true);
    expect(meetsAccessLevel('public', 'premium')).toBe(false);
    expect(meetsAccessLevel('premium', 'public')).toBe(true);
    expect(requiredAccess({ access: 'premium' })).toBe('premium');
  });

  it('is not empty', () => {
    expect(TOOLS.length).toBeGreaterThan(0);
  });

  it('has a unique id per tool', () => {
    const ids = TOOLS.map((tool) => tool.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has a unique slug per tool', () => {
    const slugs = TOOLS.map((tool) => tool.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('uses lowercase kebab-case ids and slugs', () => {
    const kebab = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    for (const tool of TOOLS) {
      expect(tool.id).toMatch(kebab);
      expect(tool.slug).toMatch(kebab);
    }
  });

  it('never lets a slug collide with a category id (both live under /tools/<param>)', () => {
    for (const tool of TOOLS) {
      expect(CATEGORY_IDS).not.toContain(tool.slug);
    }
  });

  it('assigns every tool a valid, known category', () => {
    for (const tool of TOOLS) {
      expect(CATEGORY_IDS).toContain(tool.category);
    }
  });

  it('assigns every tool a known icon id', () => {
    for (const tool of TOOLS) {
      expect(TOOL_ICON_IDS).toContain(tool.icon);
    }
  });

  it('gives every tool the required non-empty metadata', () => {
    for (const tool of TOOLS) {
      expect(tool.name.trim()).not.toBe('');
      expect(tool.description.trim()).not.toBe('');
      expect(tool.seoTitle.trim()).not.toBe('');
      expect(tool.seoDescription.trim()).not.toBe('');
      expect(tool.keywords.length).toBeGreaterThan(0);
      for (const keyword of tool.keywords) {
        expect(keyword.trim()).not.toBe('');
      }
    }
  });

  it('keeps card descriptions short enough for a card and a meta description', () => {
    for (const tool of TOOLS) {
      expect(tool.description.length).toBeLessThanOrEqual(160);
      expect(tool.seoDescription.length).toBeLessThanOrEqual(200);
    }
  });

  // A copy-pasted registry entry is easy to leave with a stale name/SEO string; catch it here
  // instead of relying on someone noticing during review (see the Phase 3 audit).
  it('gives every tool a unique name, seoTitle and seoDescription', () => {
    const names = TOOLS.map((tool) => tool.name);
    const seoTitles = TOOLS.map((tool) => tool.seoTitle);
    const seoDescriptions = TOOLS.map((tool) => tool.seoDescription);
    expect(new Set(names).size).toBe(names.length);
    expect(new Set(seoTitles).size).toBe(seoTitles.length);
    expect(new Set(seoDescriptions).size).toBe(seoDescriptions.length);
  });

  it('marks every tool as running locally in the browser, except the rate-backed converter', () => {
    for (const tool of TOOLS) {
      expect(tool.localOnly, tool.id).toBe(tool.id !== 'currency-converter');
    }
  });

  // `order` also drives the "All tools" listing and related-tool tie-breaks, so a repeat anywhere
  // (not just within a category) would make that ordering depend on array position.
  it('gives every tool a globally unique order, so listings are deterministic', () => {
    const orders = TOOLS.map((tool) => tool.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('derives a unique route per tool', () => {
    const routes = TOOLS.map((tool) => toolRoute(tool.slug));
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('gives every tool a unique description, so cards and meta text never repeat', () => {
    const descriptions = TOOLS.map((tool) => tool.description);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it('gives every tool a unique order within its category', () => {
    for (const category of CATEGORY_IDS) {
      const orders = TOOLS.filter((tool) => tool.category === category).map((tool) => tool.order);
      expect(new Set(orders).size).toBe(orders.length);
    }
  });
});

describe('toolRoute / categoryRoute', () => {
  it('derives /tools/<slug> for a tool', () => {
    expect(toolRoute('json-formatter')).toBe('/tools/json-formatter');
  });

  it('derives /tools/<category> for a category', () => {
    expect(categoryRoute('japan')).toBe('/tools/japan');
  });

  it('has every tool route start with the all-tools route', () => {
    for (const tool of TOOLS) {
      expect(toolRoute(tool.slug).startsWith(`${ALL_TOOLS_ROUTE}/`)).toBe(true);
    }
  });
});

describe('getToolBySlug', () => {
  it('finds a tool by its slug', () => {
    expect(getToolBySlug('uuid-generator')?.name).toBe('UUID Generator');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getToolBySlug('does-not-exist')).toBeUndefined();
  });

  it('returns undefined for an empty slug', () => {
    expect(getToolBySlug('')).toBeUndefined();
  });
});

const PHASE_21_TOOLS = {
  'url-encoder-decoder': 'developer',
  'html-entity-encoder-decoder': 'developer',
  'text-case-converter': 'text',
  'markdown-preview': 'text',
  'compound-interest-calculator': 'finance',
  'loan-payment-calculator': 'finance',
  'time-zone-converter': 'time',
  'business-days-calculator': 'time',
} as const;

describe('Phase 21 tools and categories', () => {
  it('registers exactly the eight new tools in their categories, each local-only', () => {
    for (const [id, category] of Object.entries(PHASE_21_TOOLS)) {
      const tool = getToolBySlug(id);
      expect(tool?.id, id).toBe(id);
      expect(tool?.category, id).toBe(category);
      expect(tool?.localOnly, id).toBe(true);
      expect(toolRoute(tool!.slug)).toBe('/tools/' + id);
    }
    // The registry has since grown (Phase 23): its size is asserted there.
    expect(TOOLS.length).toBeGreaterThanOrEqual(17 + 8);
  });

  it('has unique SEO titles and descriptions across the whole registry', () => {
    expect(new Set(TOOLS.map((t) => t.seoTitle)).size).toBe(TOOLS.length);
    expect(new Set(TOOLS.map((t) => t.seoDescription)).size).toBe(TOOLS.length);
    for (const id of Object.keys(PHASE_21_TOOLS)) {
      expect(getToolBySlug(id)!.seoTitle).toMatch(/— Toolora$/);
    }
  });

  it('adds Text, Finance and Time as populated categories without duplicating ids', () => {
    expect(new Set(CATEGORY_IDS).size).toBe(CATEGORY_IDS.length);
    for (const id of ['text', 'finance', 'time'] as const) {
      expect(CATEGORIES.map((c) => c.id)).toContain(id);
      expect(getToolsByCategory(id).length).toBeGreaterThan(0);
      expect(categoryMeta(id).robots).toBe('index,follow');
      expect(getIndexableRoutes().map((r) => r.path)).toContain(categoryRoute(id));
    }
    expect(getToolsByCategory('developer').map((t) => t.id)).toEqual(
      expect.arrayContaining([
        'url-encoder-decoder',
        'html-entity-encoder-decoder',
        'json-formatter',
      ]),
    );
  });

  it('puts every new tool in the sitemap', () => {
    const paths = getIndexableRoutes().map((r) => r.path);
    for (const id of Object.keys(PHASE_21_TOOLS)) expect(paths).toContain('/tools/' + id);
  });

  it('leaves the earlier categories untouched', () => {
    expect(getToolsByCategory('currency').map((t) => t.id)).toEqual(['currency-converter']);
    expect(getToolsByCategory('student').map((t) => t.id)).toEqual(
      expect.arrayContaining(['gpa-calculator', 'percentage-grade-calculator', 'word-counter']),
    );
    expect(getToolsByCategory('ai')).toEqual([]);
  });
});

const PHASE_23_TOOLS = {
  'japanese-consumption-tax-calculator': 'japan',
  'kana-width-converter': 'japan',
  'percentage-calculator': 'finance',
  'text-diff-checker': 'text',
  'hash-generator': 'developer',
  'jwt-decoder': 'developer',
} as const;

describe('Phase 23 tools', () => {
  it('registers exactly six new local-only tools in their categories (31 tools at Phase 23, 34 with Phase 25)', () => {
    for (const [id, category] of Object.entries(PHASE_23_TOOLS)) {
      const tool = getToolBySlug(id);
      expect(tool?.id, id).toBe(id);
      expect(tool?.category, id).toBe(category);
      expect(tool?.localOnly, id).toBe(true);
      expect(toolRoute(tool!.slug)).toBe('/tools/' + id);
    }
    expect(TOOLS).toHaveLength(17 + 8 + 6 + 3);
  });

  it('puts every new tool in the sitemap with distinct SEO text', () => {
    const paths = getIndexableRoutes().map((r) => r.path);
    for (const id of Object.keys(PHASE_23_TOOLS)) {
      expect(paths).toContain('/tools/' + id);
      expect(getToolBySlug(id)!.seoTitle).toMatch(/— Toolora$/);
    }
    expect(new Set(TOOLS.map((t) => t.seoTitle)).size).toBe(TOOLS.length);
  });

  it('links related tools both ways where the pairing is genuine', () => {
    const pairs = [
      ['japanese-consumption-tax-calculator', 'percentage-calculator'],
      ['percentage-calculator', 'compound-interest-calculator'],
      ['percentage-calculator', 'loan-payment-calculator'],
      ['text-diff-checker', 'word-counter'],
      ['text-diff-checker', 'text-case-converter'],
      ['text-diff-checker', 'markdown-preview'],
      ['hash-generator', 'base64-encoder-decoder'],
      ['jwt-decoder', 'base64-encoder-decoder'],
      ['jwt-decoder', 'json-formatter'],
      ['kana-width-converter', 'japanese-postal-code-formatter'],
      ['kana-width-converter', 'japanese-phone-number-formatter'],
      // Phase 25: the Japan money & work suite
      ['japan-take-home-pay-calculator', 'percentage-calculator'],
      ['japan-take-home-pay-calculator', 'currency-converter'],
      ['japan-take-home-pay-calculator', 'japanese-consumption-tax-calculator'],
      ['japan-student-work-limit-checker', 'japan-take-home-pay-calculator'],
      ['japan-student-work-limit-checker', 'percentage-calculator'],
      ['japan-furusato-nozei-limit-estimator', 'japan-take-home-pay-calculator'],
      ['japan-furusato-nozei-limit-estimator', 'percentage-calculator'],
      ['japan-student-work-limit-checker', 'japan-furusato-nozei-limit-estimator'],
    ] as const;
    for (const [a, b] of pairs) {
      expect(getToolBySlug(a)!.related, a + ' -> ' + b).toContain(b);
      expect(getToolBySlug(b)!.related, b + ' -> ' + a).toContain(a);
    }
  });
});

const PHASE_25_TOOLS = [
  'japan-take-home-pay-calculator',
  'japan-student-work-limit-checker',
  'japan-furusato-nozei-limit-estimator',
] as const;

describe('Phase 25 tools (Japan Money & Work Suite)', () => {
  it('registers three local-only tools in the existing Japan category, not a new one', () => {
    for (const id of PHASE_25_TOOLS) {
      const tool = getToolBySlug(id);
      expect(tool?.id, id).toBe(id);
      expect(tool?.slug, id).toBe(id);
      expect(tool?.category, id).toBe('japan');
      expect(tool?.localOnly, id).toBe(true);
      expect(requiredAccess(tool!), id).toBe('public');
      expect(toolRoute(id)).toBe('/tools/' + id);
      expect(getToolsByCategory('japan').map((t) => t.id)).toContain(id);
    }
    expect(CATEGORIES.map((c) => c.id)).not.toContain('money');
    expect(getPopulatedCategories()).toHaveLength(7); // still seven live categories
  });

  it('puts them in the sitemap through the registry, with distinct SEO text that is not "official"', () => {
    const paths = getIndexableRoutes().map((r) => r.path);
    for (const id of PHASE_25_TOOLS) {
      const tool = getToolBySlug(id)!;
      expect(paths).toContain('/tools/' + id);
      expect(tool.seoTitle).toMatch(/— Toolora$/);
      expect(tool.seoDescription).toMatch(/estimate|Educational|check/i);
      expect(`${tool.name} ${tool.seoTitle} ${tool.seoDescription}`).not.toMatch(
        /official government/i,
      );
    }
  });

  it('links the required related tools, and every pairing is reciprocal', () => {
    const related = (id: string) => getToolBySlug(id)!.related ?? [];
    // the three visible related links on the take-home page are the required ones
    expect(related('japan-take-home-pay-calculator').slice(0, 3)).toEqual([
      'percentage-calculator',
      'currency-converter',
      'japanese-consumption-tax-calculator',
    ]);
    for (const id of ['japan-student-work-limit-checker', 'japan-furusato-nozei-limit-estimator']) {
      expect(related(id)).toContain('japan-take-home-pay-calculator');
      expect(related(id)).toContain('percentage-calculator');
    }
    // reciprocity: anything a Phase 25 tool lists lists it back
    for (const id of PHASE_25_TOOLS) {
      for (const other of related(id)) {
        expect(related(other), `${other} -> ${id}`).toContain(id);
      }
    }
  });
});

describe('Currency category', () => {
  it('is a real category that owns the Currency Converter', () => {
    expect(CATEGORIES.map((c) => c.id)).toContain('currency');
    expect(getToolBySlug('currency-converter')?.category).toBe('currency');
    expect(getToolsByCategory('currency').map((t) => t.id)).toEqual(['currency-converter']);
    expect(categoryRoute('currency')).toBe('/tools/currency');
  });

  it('keeps every Japan-specific tool in Japan', () => {
    const japan = getToolsByCategory('japan').map((t) => t.id);
    expect(japan).toEqual(
      expect.arrayContaining([
        'japanese-era-converter',
        'japanese-age-calculator',
        'japanese-postal-code-formatter',
        'japanese-phone-number-formatter',
      ]),
    );
    expect(japan).not.toContain('currency-converter');
  });

  it('has a unique, indexable category meta and sitemap entry', () => {
    const meta = categoryMeta('currency');
    expect(meta.title).toBe('Currency Tools — Toolora');
    expect(meta.robots).toBe('index,follow');
    expect(meta.path).toBe('/tools/currency');
    expect(getIndexableRoutes().map((r) => r.path)).toContain('/tools/currency');
  });
});

describe('getToolsByCategory', () => {
  it('returns only tools in the requested category, ordered by `order`', () => {
    const japanTools = getToolsByCategory('japan');
    expect(japanTools.every((tool) => tool.category === 'japan')).toBe(true);
    expect(japanTools).toEqual([...japanTools].sort((a, b) => a.order - b.order));
  });

  it('returns an empty array for a category with no tools yet', () => {
    expect(getToolsByCategory('ai')).toEqual([]);
  });

  it('together with every other category, accounts for every tool exactly once', () => {
    const total = CATEGORY_IDS.reduce((sum, id) => sum + getToolsByCategory(id).length, 0);
    expect(total).toBe(TOOLS.length);
  });

  describe('TOOL_VARIANTS', () => {
    it('points every variant at a real tool, with unique kebab-case slugs', () => {
      const slugs = TOOL_VARIANTS.map((v) => v.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      for (const variant of TOOL_VARIANTS) {
        expect(getToolBySlug(variant.toolId), variant.slug).toBeDefined();
        expect(variant.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      }
    });

    it('never collides with a tool slug or a category id', () => {
      for (const variant of TOOL_VARIANTS) {
        expect(getToolBySlug(variant.slug), variant.slug).toBeUndefined();
        expect(CATEGORY_IDS as readonly string[]).not.toContain(variant.slug);
      }
    });

    it('has SEO text distinct from every tool and every other variant', () => {
      const all = [...TOOLS, ...TOOL_VARIANTS];
      expect(new Set(all.map((t) => t.seoTitle)).size).toBe(all.length);
      expect(new Set(all.map((t) => t.seoDescription)).size).toBe(all.length);
    });

    it('describes a variant as its tool with the variant slug and text', () => {
      const variant = getToolVariantBySlug('jpy-to-bdt')!;
      const meta = toolFromVariant(variant, getToolBySlug(variant.toolId)!);
      expect(meta.slug).toBe('jpy-to-bdt');
      expect(meta.seoTitle).toBe(variant.seoTitle);
      expect(meta.id).toBe('currency-converter');
    });

    it('presets use two different currencies', () => {
      for (const { preset } of TOOL_VARIANTS) expect(preset.from).not.toBe(preset.to);
    });
  });
});
