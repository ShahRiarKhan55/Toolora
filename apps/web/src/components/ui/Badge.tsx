import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'error';

const tones: Record<Tone, string> = {
  neutral: 'border-border bg-surface-muted text-muted-foreground',
  primary: 'border-primary/30 bg-primary-soft text-primary-soft-foreground',
  success: 'border-success/30 bg-success-soft text-success',
  warning: 'border-warning/30 bg-warning-soft text-warning',
  error: 'border-error/30 bg-error-soft text-error',
};

/** A short status label. The tone is decoration: the text must say what the status is. */
export function Badge({
  tone = 'neutral',
  className,
  ...rest
}: ComponentProps<'span'> & { tone?: Tone }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
