import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Container } from './Container';

interface SectionProps {
  /** Becomes the element id, so the section can be a link target (`/#id`). */
  id?: string;
  title: string;
  description?: ReactNode;
  tone?: 'default' | 'muted';
  children: ReactNode;
}

/** A page section: a labelled landmark region with an h2 and consistent vertical rhythm. */
export function Section({ id, title, description, tone = 'default', children }: SectionProps) {
  const headingId = useId();
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cx(
        'py-12 sm:py-16',
        tone === 'muted' && 'border-y border-border bg-surface-muted',
      )}
    >
      <Container>
        <div className="max-w-2xl">
          <h2 id={headingId} className="text-2xl font-bold tracking-tight sm:text-3xl">
            {title}
          </h2>
          {description && <p className="mt-2 text-lg text-muted-foreground">{description}</p>}
        </div>
        <div className="mt-8">{children}</div>
      </Container>
    </section>
  );
}
