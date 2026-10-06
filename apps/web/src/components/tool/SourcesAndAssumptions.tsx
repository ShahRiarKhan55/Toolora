import { useId } from 'react';
import { SOURCES } from '../../config/japanMoneyRules';
import type { RuleScope, SourceId } from '../../config/japanMoneyRules';

interface SourcesAndAssumptionsProps {
  /** e.g. "2026 (令和8年)": the rule year the numbers on this page describe. */
  ruleYearLabel: string;
  /** What the estimate takes for granted. Kept short; the most important come first. */
  assumptions: readonly string[];
  sourceIds: readonly SourceId[];
}

const SCOPE_LABELS: Record<RuleScope, string> = {
  nationwide: 'Nationwide rule',
  insurer: 'Depends on your insurer',
  municipality: 'Depends on your city or prefecture',
};

/**
 * The "where do these numbers come from" block shared by the Japan money tools: the rule year, the
 * assumptions that matter most, and links to the official pages behind each rule. The assumptions
 * stay visible; the longer source list sits in a native <details> so it does not crowd the result.
 */
export function SourcesAndAssumptions({
  ruleYearLabel,
  assumptions,
  sourceIds,
}: SourcesAndAssumptionsProps) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="space-y-3 border-t border-border pt-6">
      <h2 id={headingId} className="text-lg font-bold tracking-tight">
        Sources and assumptions
      </h2>
      <p className="text-sm">
        <span className="font-semibold">Rules year: {ruleYearLabel}.</span>{' '}
        <span className="text-muted-foreground">
          An estimate for learning and planning, not an official calculation. Toolora is not
          connected to any government body.
        </span>
      </p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {assumptions.map((assumption) => (
          <li key={assumption}>{assumption}</li>
        ))}
      </ul>
      <details className="group rounded-control border border-border bg-surface-muted px-4 py-1">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold">
          Official sources ({sourceIds.length})
        </summary>
        <ul className="space-y-3 pb-3 text-sm">
          {sourceIds.map((id) => {
            const source = SOURCES[id];
            return (
              <li key={id}>
                <a
                  className="font-semibold text-primary underline"
                  href={source.url}
                  rel="noopener noreferrer"
                >
                  {source.publisher}: {source.title}
                </a>
                <span className="block text-muted-foreground">{source.establishes}</span>
                <span className="block text-xs text-muted-foreground">
                  Rule year: {source.ruleYear} · {SCOPE_LABELS[source.scope]}
                </span>
              </li>
            );
          })}
        </ul>
      </details>
    </section>
  );
}
