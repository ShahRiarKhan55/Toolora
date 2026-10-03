import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { PHONE_ERROR_MESSAGES, formatPhoneNumber } from './logic';
import type { PhoneKind, PhoneResult } from './logic';

const KIND_LABELS: Record<PhoneKind, string> = {
  mobile: 'Mobile pattern',
  'ip-phone': 'IP phone (050) pattern',
  'toll-free': 'Toll-free pattern',
  'navi-dial': 'Navi-dial (0570) pattern',
  landline: 'Landline pattern',
};

export function JapanesePhoneNumberFormatterTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState<PhoneResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFormat() {
    const outcome = formatPhoneNumber(input);
    if (!outcome.ok) {
      setResult(null);
      setError(PHONE_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function handleReset() {
    setInput('');
    setResult(null);
    setError(null);
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        handleFormat();
      }}
    >
      <Input
        label="Phone number"
        type="tel"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        error={error ?? undefined}
        hint="For example 09012345678, 03-1234-5678 or +81 90 1234 5678. The format is tidied, not checked against any real number."
        autoComplete="off"
        placeholder="090-1234-5678"
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Format</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {result && !error && (
        <div className="space-y-4">
          {result.domestic !== null && result.international !== null ? (
            <>
              <ResultBox
                label={`Domestic format · ${result.kind ? KIND_LABELS[result.kind] : ''}`}
                value={result.domestic}
                copyLabel="Copy domestic format"
              />
              <div
                aria-live="polite"
                className="rounded-control border border-border bg-surface-muted p-4"
              >
                <p className="text-sm font-semibold text-muted-foreground">International format</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-lg font-semibold">{result.international}</p>
                  <CopyButton text={result.international} label="Copy international format" />
                </div>
              </div>
            </>
          ) : (
            <div aria-live="polite" className="space-y-4">
              <Alert tone="warning" title="Digits kept, grouping not applied">
                The digit count is plausible, but Toolora cannot tell where the area code ends for
                this number, so it is not hyphenated rather than guessed.
              </Alert>
              <ResultBox label="Digits" value={result.digits} copyLabel="Copy digits" />
            </div>
          )}
        </div>
      )}
    </form>
  );
}
