import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import { GPA_SCALES, gpaToPercentage, percentageToGpa } from './logic';

type Direction = 'gpa-to-percentage' | 'percentage-to-gpa';

export function GpaPercentageConverterTool() {
  const [direction, setDirection] = useState<Direction>('gpa-to-percentage');
  const [scaleMax, setScaleMax] = useState<number>(4);
  const [value, setValue] = useState('');
  const [result, setResult] = useState<{ text: string; label: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toPercentage = direction === 'gpa-to-percentage';

  function handleConvert() {
    const outcome = toPercentage
      ? gpaToPercentage(value, scaleMax)
      : percentageToGpa(value, scaleMax);
    if (!outcome.ok) {
      setResult(null);
      setError(outcome.message);
      return;
    }
    setError(null);
    setResult(
      toPercentage
        ? { label: 'Estimated percentage', text: `${outcome.value}%` }
        : { label: `Estimated GPA (out of ${scaleMax})`, text: String(outcome.value) },
    );
  }

  function clearResult() {
    setResult(null);
    setError(null);
  }

  function handleReset() {
    setValue('');
    clearResult();
  }

  return (
    <div className="space-y-6">
      <Alert tone="warning" title="An estimate, not an official conversion">
        Institutions, countries and employers use their own conversion tables, and many are not a
        straight proportion. Use the result as a rough guide and check the rule your institution
        requires.
      </Alert>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Convert"
          value={direction}
          onChange={(event) => {
            setDirection(event.target.value as Direction);
            setValue('');
            clearResult();
          }}
        >
          <option value="gpa-to-percentage">GPA → percentage</option>
          <option value="percentage-to-gpa">Percentage → GPA</option>
        </Select>
        <Select
          label="GPA scale"
          value={scaleMax}
          onChange={(event) => {
            setScaleMax(Number(event.target.value));
            clearResult();
          }}
        >
          {GPA_SCALES.map((scale) => (
            <option key={scale.max} value={scale.max}>
              {scale.label} (maximum {scale.max})
            </option>
          ))}
        </Select>
      </div>

      <form
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleConvert();
        }}
      >
        <Input
          label={toPercentage ? `GPA (0 to ${scaleMax})` : 'Percentage (0 to 100)'}
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          hint={
            toPercentage
              ? `Formula: percentage = GPA ÷ ${scaleMax} × 100`
              : `Formula: GPA = percentage ÷ 100 × ${scaleMax}`
          }
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-3">
          <Button type="submit">Convert</Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>

      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}

      {result && !error && <ResultBox label={result.label} value={result.text} />}
    </div>
  );
}
