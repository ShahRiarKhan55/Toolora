import { useId } from 'react';
import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { ErrorIcon } from './icons';

/** Props shared by Input, Textarea and Select for their label, hint and error. */
export interface FieldOwnProps {
  label: string;
  hint?: ReactNode;
  error?: ReactNode;
  /** Keeps the label for assistive tech but hides it visually (e.g. a search box). */
  hideLabel?: boolean;
}

interface ControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

interface FieldProps extends FieldOwnProps {
  id?: string;
  required?: boolean;
  className?: string;
  /** Receives the props that tie the control to its label, hint and error. */
  children: (control: ControlProps) => ReactNode;
}

/**
 * Label + control + hint + error, wired together for assistive tech: the label is bound with
 * `for`, hint and error via `aria-describedby`, and the error is announced (role="alert") and
 * carries an icon so it is never communicated by colour alone.
 */
export function Field({
  id: idProp,
  label,
  hint,
  error,
  hideLabel,
  required,
  className,
  children,
}: FieldProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cx('mb-1.5 block text-sm font-semibold', hideLabel && 'sr-only')}
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-error">
            *
          </span>
        )}
      </label>
      {children({
        id,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {hint && (
        <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 flex gap-1.5 text-sm font-medium text-error">
          <ErrorIcon className="mt-0.5 size-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
