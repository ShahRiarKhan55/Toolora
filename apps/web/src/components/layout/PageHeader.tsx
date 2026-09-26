import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

interface PageHeaderProps {
  /** Rendered as the page's single h1. */
  title: string;
  description?: ReactNode;
  className?: string;
  /** Extra content under the description, such as badges. */
  children?: ReactNode;
}

export function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <header className={cx('max-w-3xl', className)}>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      {description && <p className="mt-3 text-lg text-muted-foreground">{description}</p>}
      {children}
    </header>
  );
}
