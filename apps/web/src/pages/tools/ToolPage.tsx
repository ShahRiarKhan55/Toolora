import { CATEGORIES, categoryRoute, TOOLS, toolPageMeta } from '@toolora/shared';
import type { ToolMeta } from '@toolora/shared';
import { Suspense } from 'react';
import { ToolPageLayout } from '../../components/layout/ToolPageLayout';
import { getRelatedTools } from '../../lib/relatedTools';
import { PUBLIC_SITE_ORIGIN } from '../../lib/siteUrl';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { TOOL_IMPLEMENTATIONS } from '../../tools';

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

export function ToolPage({ tool }: { tool: ToolMeta }) {
  useDocumentMeta(toolPageMeta(tool, PUBLIC_SITE_ORIGIN));
  const category = categoryById.get(tool.category)!;
  const implementation = TOOL_IMPLEMENTATIONS[tool.id]!;
  const Component = implementation.Component;

  return (
    <ToolPageLayout
      title={tool.name}
      description={tool.description}
      localOnly={tool.localOnly}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: `${category.name} Tools`, href: categoryRoute(category.id) },
        { label: tool.name },
      ]}
      howToUse={implementation.content.howToUse}
      about={implementation.content.about}
      faq={implementation.content.faq}
      relatedTools={getRelatedTools(TOOLS, tool)}
    >
      <Suspense fallback={<p role="status">Loading tool…</p>}>
        <Component />
      </Suspense>
    </ToolPageLayout>
  );
}
