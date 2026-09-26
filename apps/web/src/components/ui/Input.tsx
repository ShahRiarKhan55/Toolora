import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import { controlStyles } from './controlStyles';
import { Field } from './Field';
import type { FieldOwnProps } from './Field';

type InputProps = Omit<ComponentProps<'input'>, 'className'> &
  FieldOwnProps & { className?: string };

/** `className` styles the wrapper; the control itself is styled by the design system. */
export function Input({ label, hint, error, hideLabel, id, className, ...rest }: InputProps) {
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
      {(control) => <input {...rest} {...control} className={cx(controlStyles, 'min-h-11')} />}
    </Field>
  );
}
