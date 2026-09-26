import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './icons';

type Tone = 'info' | 'success' | 'warning' | 'error';

const tones = {
  info: {
    box: 'border-primary/30 bg-primary-soft',
    icon: 'text-primary',
    Icon: InfoIcon,
    label: 'Information',
  },
  success: {
    box: 'border-success/30 bg-success-soft',
    icon: 'text-success',
    Icon: SuccessIcon,
    label: 'Success',
  },
  warning: {
    box: 'border-warning/30 bg-warning-soft',
    icon: 'text-warning',
    Icon: WarningIcon,
    label: 'Warning',
  },
  error: {
    box: 'border-error/30 bg-error-soft',
    icon: 'text-error',
    Icon: ErrorIcon,
    label: 'Error',
  },
} satisfies Record<Tone, { box: string; icon: string; Icon: typeof InfoIcon; label: string }>;

interface AlertProps {
  tone?: Tone;
  title?: string;
  className?: string;
  children: ReactNode;
}

/** Errors are announced immediately (role="alert"); the other tones politely (role="status"). */
export function Alert({ tone = 'info', title, className, children }: AlertProps) {
  const { box, icon, Icon, label } = tones[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-control border p-4', box, className)}
    >
      <Icon className={cx('mt-0.5 size-5', icon)} />
      <div className="min-w-0 text-sm">
        <span className="sr-only">{label}: </span>
        {title && <p className="font-semibold">{title}</p>}
        <div className={title ? 'mt-1' : undefined}>{children}</div>
      </div>
    </div>
  );
}
