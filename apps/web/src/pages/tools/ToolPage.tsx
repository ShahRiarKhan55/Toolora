import { CATEGORIES, categoryRoute } from '@toolora/shared';
import type { ToolMeta } from '@toolora/shared';
import { Suspense } from 'react';
import { ToolPageLayout } from '../../components/layout/ToolPageLayout';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { TOOL_IMPLEMENTATIONS } from '../../tools';

const categoryById = new Map(CATEGORIES.map((category) => [category.id, category]));

export function ToolPage({ tool }: { tool: ToolMeta }) {
  useDocumentMeta(tool.seoTitle, tool.seoDescription);
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
    >
      <Suspense fallback={<p role="status">Loading tool…</p>}>
        <Component />
      </Suspense>
    </ToolPageLayout>
  );
}
