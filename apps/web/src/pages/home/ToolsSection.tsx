import { TOOLS } from '@toolora/shared';
import { Section } from '../../components/layout/Section';
import { ToolCard } from '../../components/tool/ToolCard';
import { ButtonLink } from '../../components/ui/Button';

export function ToolsSection() {
  return (
    <Section
      id="tools"
      title="All tools"
      description="Every Toolora tool, free and running in your browser."
      tone="muted"
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((tool) => (
          <li key={tool.id}>
            <ToolCard tool={tool} />
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href="/tools" variant="secondary">
          Search all tools
        </ButtonLink>
      </div>
    </Section>
  );
}
