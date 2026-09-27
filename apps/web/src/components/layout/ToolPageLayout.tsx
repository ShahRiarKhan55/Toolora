import type { ToolMeta } from '@toolora/shared';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { ToolCard } from '../tool/ToolCard';
import { Card } from '../ui/Card';
import { ChevronDownIcon, ShieldIcon } from '../ui/icons';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem } from './Breadcrumbs';
import { Container } from './Container';
import { PageHeader } from './PageHeader';

export interface FaqItem {
  question: string;
  answer: ReactNode;
}

interface ToolPageLayoutProps {
  title: string;
  description: string;
  breadcrumbs: readonly BreadcrumbItem[];
  /** Only set for tools that really process input in the browser; shows the privacy note. */
  localOnly?: boolean;
  /** The tool itself: inputs, results and actions. */
  children: ReactNode;
  howToUse?: ReactNode;
  about?: ReactNode;
  faq?: readonly FaqItem[];
  /**
   * A small set of other tools to suggest next, in display order. Computed from the registry by
   * the caller (see `lib/relatedTools.ts`) — this component just renders whatever it is given.
   */
  relatedTools?: readonly ToolMeta[];
}

// Tools supply plain <p>/<ol>/<ul>/<a> content; this gives it consistent spacing and list styles.
const proseStyles =
  'text-muted-foreground [&>*+*]:mt-3 [&_a]:text-primary [&_a]:underline [&_ol]:list-decimal ' +
  '[&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5';

function ContentSection({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="text-xl font-bold tracking-tight">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * The shared page structure for every tool: breadcrumb, title and description, the workspace, then
 * explanatory content (how to use, about, FAQ). Renders inside SiteLayout's <main>.
 */
export function ToolPageLayout({
  title,
  description,
  breadcrumbs,
  localOnly = false,
  children,
  howToUse,
  about,
  faq,
  relatedTools,
}: ToolPageLayoutProps) {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs items={breadcrumbs} />
      <PageHeader title={title} description={description} className="mt-4">
        {localOnly && (
          <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary-soft-foreground">
            <ShieldIcon className="size-4" />
            Runs in your browser. Your input is not sent anywhere.
          </p>
        )}
      </PageHeader>

      <Card as="section" aria-label="Tool workspace" className="mt-8">
        {children}
      </Card>

      {(howToUse || about || (faq && faq.length > 0)) && (
        <div className="mt-12 max-w-content space-y-10">
          {howToUse && (
            <ContentSection title="How to use">
              <div className={proseStyles}>{howToUse}</div>
            </ContentSection>
          )}
          {about && (
            <ContentSection title="About this tool">
              <div className={proseStyles}>{about}</div>
            </ContentSection>
          )}
          {faq && faq.length > 0 && (
            <ContentSection title="Frequently asked questions">
              <div className="divide-y divide-border rounded-card border border-border bg-surface">
                {faq.map((item) => (
                  <details key={item.question} className="group px-4 py-3">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-semibold">
                      {item.question}
                      <ChevronDownIcon className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                    </summary>
                    <div className={`pb-2 ${proseStyles}`}>{item.answer}</div>
                  </details>
                ))}
              </div>
            </ContentSection>
          )}
        </div>
      )}

      {relatedTools && relatedTools.length > 0 && (
        <div className="mt-12 max-w-content">
          <ContentSection title="Related tools">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {relatedTools.map((tool) => (
                <li key={tool.id}>
                  <ToolCard tool={tool} />
                </li>
              ))}
            </ul>
          </ContentSection>
        </div>
      )}
    </Container>
  );
}
