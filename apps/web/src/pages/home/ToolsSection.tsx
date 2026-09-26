import { Section } from '../../components/layout/Section';
import { EmptyState } from '../../components/ui/EmptyState';
import { SearchIcon } from '../../components/ui/icons';

export function ToolsSection() {
  return (
    <Section id="tools" title="All tools" tone="muted">
      <EmptyState icon={<SearchIcon className="size-6" />} title="The first tools are on their way">
        Toolora does not have any tools yet. The first ones for Japan, students and developers are
        being built and will appear here as soon as they are ready.
      </EmptyState>
    </Section>
  );
}
