import { CopyButton } from '../ui/CopyButton';
import { Textarea } from '../ui/Textarea';

/** A read-only, copyable text result. Always plain text in a textarea: nothing here is parsed as HTML. */
export function TextResult({
  label = 'Result',
  value,
  mono = false,
}: {
  label?: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <CopyButton text={value} label="Copy result" />
      </div>
      <Textarea label={label} hideLabel mono={mono} readOnly rows={8} value={value} />
    </div>
  );
}
