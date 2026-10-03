import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { POSTAL_CODE_ERROR_MESSAGES, formatPostalCode } from './logic';

export function JapanesePostalCodeFormatterTool() {
  const [input, setInput] = useState('');
  const [formatted, setFormatted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFormat() {
    const outcome = formatPostalCode(input);
    if (!outcome.ok) {
      setFormatted(null);
      setError(POSTAL_CODE_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setFormatted(outcome.value);
  }

  function handleReset() {
    setInput('');
    setFormatted(null);
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
        label="Postal code"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        error={error ?? undefined}
        hint="For example 1000001, 100-0001 or 〒100-0001. The format is checked, not whether the code exists."
        inputMode="text"
        autoComplete="off"
        placeholder="100-0001"
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit">Format</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>
      {formatted && !error && (
        <ResultBox label="Formatted postal code" value={formatted} copyLabel="Copy postal code" />
      )}
    </form>
  );
}
