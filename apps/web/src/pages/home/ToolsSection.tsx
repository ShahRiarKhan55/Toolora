import {
  ALL_TOOLS_ROUTE,
  getPopulatedCategories,
  getToolsByCategory,
  TOOLS,
} from '@toolora/shared';
import { Section } from '../../components/layout/Section';
import { ToolCard } from '../../components/tool/ToolCard';
import { ButtonLink } from '../../components/ui/Button';

const TOOLS_PER_CATEGORY = 3;

// Derived from the registry (first tools of each category by `order`), so there is no second list.
const featuredTools = getPopulatedCategories().flatMap((category) =>
  getToolsByCategory(category.id).slice(0, TOOLS_PER_CATEGORY),
);

export function ToolsSection() {
  return (
    <Section
      id="tools"
      title="Featured tools"
      description="A few free tools from each category; nearly all run in your browser."
      tone="muted"
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {featuredTools.map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href={ALL_TOOLS_ROUTE} variant="secondary">
          Browse all {TOOLS.length} tools
        </ButtonLink>
      </div>
    </Section>
  );
}
