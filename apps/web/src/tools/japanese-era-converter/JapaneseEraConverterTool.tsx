import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import type { EraId } from './logic';
import {
  ERA_TO_GREGORIAN_ERROR_MESSAGES,
  eraToGregorian,
  ERAS,
  GREGORIAN_TO_ERA_ERROR_MESSAGES,
  gregorianToEra,
} from './logic';

const DEFAULT_ERA_ID = ERAS[ERAS.length - 1]!.id;

function GregorianToEraForm() {
  const [date, setDate] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleConvert() {
    const outcome = gregorianToEra(date);
    if (!outcome.ok) {
      setResult('');
      setError(GREGORIAN_TO_ERA_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(`${outcome.value.era.name} ${outcome.value.eraYear}`);
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Gregorian date → era</h2>
      <Input
        label="Gregorian date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Button onClick={handleConvert}>Convert to era</Button>
      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}
      {result && !error && <ResultBox label="Era" value={result} />}
    </div>
  );
}

function EraToGregorianForm() {
  const [eraId, setEraId] = useState(DEFAULT_ERA_ID);
  const [eraYear, setEraYear] = useState('1');
  const [result, setResult] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleConvert() {
    const outcome = eraToGregorian(eraId, eraYear);
    if (!outcome.ok) {
      setResult('');
      setNote(null);
      setError(ERA_TO_GREGORIAN_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(String(outcome.value.gregorianYear));
    setNote(
      outcome.value.isPartialYear
        ? `${outcome.value.era.name} ${outcome.value.eraYear} does not cover the whole of ${outcome.value.gregorianYear}.`
        : null,
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Era → Gregorian year</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select label="Era" value={eraId} onChange={(e) => setEraId(e.target.value as EraId)}>
          {ERAS.map((era) => (
            <option key={era.id} value={era.id}>
              {era.name}
            </option>
          ))}
        </Select>
        <Input
          label="Era year"
          inputMode="numeric"
          value={eraYear}
          onChange={(e) => setEraYear(e.target.value)}
        />
      </div>
      <Button onClick={handleConvert}>Convert to Gregorian</Button>
      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}
      {result && !error && (
        <div className="space-y-2">
          <ResultBox label="Gregorian year" value={result} />
          {note && (
            <p className="text-sm text-muted-foreground" role="status">
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function JapaneseEraConverterTool() {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      <GregorianToEraForm />
      <EraToGregorianForm />
    </div>
  );
}
