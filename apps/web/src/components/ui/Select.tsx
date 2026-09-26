import type { ComponentProps } from 'react';
import { cx } from '../../lib/cx';
import { controlStyles } from './controlStyles';
import { Field } from './Field';
import type { FieldOwnProps } from './Field';
import { ChevronDownIcon } from './icons';

type SelectProps = Omit<ComponentProps<'select'>, 'className'> &
  FieldOwnProps & { className?: string };

/** A native <select> (best keyboard, mobile and screen-reader support) with a custom chevron. */
export function Select({
  label,
  hint,
  error,
  hideLabel,
  id,
  className,
  children,
  ...rest
}: SelectProps) {
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
        <div className="relative">
          <select
            {...rest}
            {...control}
            className={cx(controlStyles, 'min-h-11 appearance-none pr-10')}
          >
            {children}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}
    </Field>
  );
}
