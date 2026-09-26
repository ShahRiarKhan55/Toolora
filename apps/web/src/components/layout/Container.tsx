import type { HTMLAttributes } from 'react';
import { cx } from '../../lib/cx';

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** `page` for full layouts, `content` for a comfortable reading width. */
  size?: 'page' | 'content';
}

/** Centres content and applies the responsive page gutters. */
export function Container({ size = 'page', className, ...rest }: ContainerProps) {
  return (
    <div
      className={cx(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        size === 'page' ? 'max-w-page' : 'max-w-content',
        className,
      )}
      {...rest}
    />
  );
}
