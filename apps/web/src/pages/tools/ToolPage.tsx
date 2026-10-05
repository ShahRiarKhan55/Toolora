import {
  CATEGORIES,
  categoryRoute,
  TOOLS,
  toolFromVariant,
  toolPageMeta,
  toolRoute,
} from '@toolora/shared';
import type { ToolMeta, ToolVariant } from '@toolora/shared';
import { Suspense } from 'react';
import { ToolPageLayout } from '../../components/layout/ToolPageLayout';
import { getRelatedTools } from '../../lib/relatedTools';
import { PUBLIC_SITE_ORIGIN } from '../../lib/siteUrl';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { TOOL_IMPLEMENTATIONS, TOOL_VARIANT_CONTENT } from '../../tools';

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

/** A tool's page, or (with `variant`) the same tool opened with a preset under its own URL and copy. */
export function ToolPage({ tool, variant }: { tool: ToolMeta; variant?: ToolVariant }) {
  const page = variant ? toolFromVariant(variant, tool) : tool;
  useDocumentMeta(toolPageMeta(page, PUBLIC_SITE_ORIGIN));
  const category = categoryById.get(tool.category)!;
  const implementation = TOOL_IMPLEMENTATIONS[tool.id]!;
  const content = (variant && TOOL_VARIANT_CONTENT[variant.slug]) || implementation.content;
  const Component = implementation.Component;

  return (
    <ToolPageLayout
      title={page.name}
      description={page.description}
      localOnly={tool.localOnly}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: `${category.name} Tools`, href: categoryRoute(category.id) },
        ...(variant ? [{ label: tool.name, href: toolRoute(tool.slug) }] : []),
        { label: page.name },
      ]}
      howToUse={content.howToUse}
      about={content.about}
      faq={content.faq}
      // The general tool leads its variants' suggestions.
      relatedTools={
        variant ? [tool, ...getRelatedTools(TOOLS, tool, 2)] : getRelatedTools(TOOLS, tool)
      }
    >
      <Suspense fallback={<p role="status">Loading tool…</p>}>
        <Component preset={variant?.preset} />
      </Suspense>
    </ToolPageLayout>
  );
}
