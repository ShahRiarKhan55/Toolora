import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import { controlStyles } from './controlStyles';
import { Field } from './Field';
import type { FieldOwnProps } from './Field';

type TextareaProps = Omit<ComponentProps<'textarea'>, 'className'> &
  FieldOwnProps & {
    className?: string;
    /** Monospaced text, for code-like content such as JSON or Base64. */
    mono?: boolean;
  };

export function Textarea({
  label,
  hint,
  error,
  hideLabel,
  id,
  className,
  mono,
  rows = 6,
  ...rest
}: TextareaProps) {
  return (
    <Field
      id={id}
      label={label}
      hint={hint}
      error={error}
      hideLabel={hideLabel}
      required={rest.required}
      className={className}
    >
      {(control) => (
        <textarea
          rows={rows}
          {...rest}
          {...control}
          className={cx(controlStyles, 'resize-y', mono && 'font-mono text-sm')}
        />
      )}
    </Field>
  );
}
