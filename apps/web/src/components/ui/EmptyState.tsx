import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  /** Heading element to use, so the state fits the surrounding outline. */
  as?: 'h2' | 'h3';
  action?: ReactNode;
  children?: ReactNode;
}

export function EmptyState({ icon, title, as: Heading = 'h3', action, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-border-strong bg-surface px-6 py-10 text-center sm:py-14">
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-pill bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <Heading className="text-lg font-semibold">{title}</Heading>
      {children && <p className="mt-2 max-w-md text-muted-foreground">{children}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
