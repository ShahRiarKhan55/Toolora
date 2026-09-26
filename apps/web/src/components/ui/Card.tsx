import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Pick the semantic element: `article` for self-contained items, `section` for labelled regions. */
  as?: 'div' | 'section' | 'article';
}

export function Card({ as: Tag = 'div', className, ...rest }: CardProps) {
  return (
    <Tag
      className={cx(
        'rounded-card border border-border bg-surface p-5 shadow-card sm:p-6',
        className,
      )}
      {...rest}
    />
  );
}
