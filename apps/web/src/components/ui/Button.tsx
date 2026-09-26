import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface StyleProps {
  variant?: Variant;
  size?: Size;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  secondary: 'border border-border-strong bg-surface text-foreground hover:bg-surface-muted',
  ghost: 'text-foreground hover:bg-surface-muted',
};

// md and lg meet the 44px comfortable touch target; sm is for dense, secondary actions.
const sizes: Record<Size, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

function styles({ variant = 'primary', size = 'md' }: StyleProps, className?: string) {
  return cx(base, variants[variant], sizes[size], className);
}

export function Button({
  variant,
  size,
  className,
  type = 'button',
  ...rest
}: ComponentProps<'button'> & StyleProps) {
  return <button type={type} className={styles({ variant, size }, className)} {...rest} />;
}

/** A link that looks like a Button: use for navigation, since a <button> must never navigate. */
export function ButtonLink({
  variant,
  size,
  className,
  children,
  ...rest
}: ComponentProps<'a'> & StyleProps) {
  return (
    <a className={styles({ variant, size }, className)} {...rest}>
      {children}
    </a>
  );
}
