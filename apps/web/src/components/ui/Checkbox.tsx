import type { ComponentProps, ReactNode } from 'react';

type CheckboxProps = Omit<ComponentProps<'input'>, 'type' | 'className' | 'children'> & {
  label: ReactNode;
  hint?: ReactNode;
};

/** A native checkbox with a visible, clickable label and a 44px-tall target. */
export function Checkbox({ label, hint, ...rest }: CheckboxProps) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm">
      <input type="checkbox" className="size-5 shrink-0 accent-primary" {...rest} />
      <span>
        <span className="font-semibold">{label}</span>
        {hint && <span className="text-muted-foreground"> — {hint}</span>}
      </span>
    </label>
  );
}
