import { Section } from '../../components/layout/Section';
import { ToolCard } from '../../components/tool/ToolCard';
import { Button } from '../../components/ui/Button';
import { clearRecentTools, useFavoriteTools, useRecentTools } from '../../lib/toolPrefs';

/** Favourites and recent tools: both live in this browser only and render nothing when empty. */
export function PersonalToolsSection() {
  const favorites = useFavoriteTools();
  const recent = useRecentTools();

  return (
    <>
      {favorites.length > 0 && (
        <Section
          id="favorites"
          title="Your favorites"
          description="Tools you starred. Saved in this browser only."
        >
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {favorites.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
        </Section>
      )}
      {recent.length > 0 && (
        <Section
          id="recent"
          title="Recently used"
          description="The last tools you opened. Only tool names are remembered in this browser, never what you type."
          tone={favorites.length > 0 ? 'muted' : 'default'}
        >
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {recent.map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} />
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button variant="secondary" onClick={clearRecentTools}>
              Clear recently used
            </Button>
          </div>
        </Section>
      )}
    </>
  );
}
