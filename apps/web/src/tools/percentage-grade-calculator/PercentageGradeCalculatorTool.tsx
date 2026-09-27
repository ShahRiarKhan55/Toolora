import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ResultBox } from '../../components/ui/ResultBox';
import { Select } from '../../components/ui/Select';
import {
  gradeFromPercentage,
  marksFromPercentage,
  MARKS_FROM_PERCENTAGE_ERROR_MESSAGES,
  percentageChange,
  PERCENTAGE_CHANGE_ERROR_MESSAGES,
  percentageFromMarks,
  PERCENTAGE_FROM_MARKS_ERROR_MESSAGES,
} from './logic';

type Mode = 'from-marks' | 'to-marks' | 'change';

const MODES: { id: Mode; label: string }[] = [
  { id: 'from-marks', label: 'Percentage from marks' },
  { id: 'to-marks', label: 'Marks from a percentage' },
  { id: 'change', label: 'Percentage change' },
];

const percentFormatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

export function PercentageGradeCalculatorTool() {
  const [mode, setMode] = useState<Mode>('from-marks');
  const [obtained, setObtained] = useState('45');
  const [total, setTotal] = useState('50');
  const [percentage, setPercentage] = useState('90');
  const [fromValue, setFromValue] = useState('50');
  const [toValue, setToValue] = useState('75');
  const [result, setResult] = useState<{ label: string; value: string; grade?: string } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  function handleCalculate() {
    if (mode === 'from-marks') {
      const outcome = percentageFromMarks(obtained, total);
      if (!outcome.ok) {
        setResult(null);
        setError(PERCENTAGE_FROM_MARKS_ERROR_MESSAGES[outcome.error]);
        return;
      }
      setError(null);
      setResult({
        label: 'Percentage',
        value: `${percentFormatter.format(outcome.value.percentage)}%`,
        grade: gradeFromPercentage(outcome.value.percentage),
      });
    } else if (mode === 'to-marks') {
      const outcome = marksFromPercentage(percentage, total);
      if (!outcome.ok) {
        setResult(null);
        setError(MARKS_FROM_PERCENTAGE_ERROR_MESSAGES[outcome.error]);
        return;
      }
      setError(null);
      const percentValue = Number(percentage);
      setResult({
        label: 'Marks obtained',
        value: percentFormatter.format(outcome.value.obtained),
        grade: Number.isFinite(percentValue) ? gradeFromPercentage(percentValue) : undefined,
      });
    } else {
      const outcome = percentageChange(fromValue, toValue);
      if (!outcome.ok) {
        setResult(null);
        setError(PERCENTAGE_CHANGE_ERROR_MESSAGES[outcome.error]);
        return;
      }
      setError(null);
      const sign = outcome.value.change > 0 ? '+' : '';
      setResult({
        label: 'Percentage change',
        value: `${sign}${percentFormatter.format(outcome.value.change)}%`,
      });
    }
  }

  function handleReset() {
    setObtained('45');
    setTotal('50');
    setPercentage('90');
    setFromValue('50');
    setToValue('75');
    setResult(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Select
        label="Calculation"
        value={mode}
        onChange={(event) => {
          setMode(event.target.value as Mode);
          setResult(null);
          setError(null);
        }}
      >
        {MODES.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>

      {mode === 'from-marks' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Marks obtained"
            inputMode="decimal"
            value={obtained}
            onChange={(e) => setObtained(e.target.value)}
          />
          <Input
            label="Total marks"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
      )}

      {mode === 'to-marks' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Percentage"
            inputMode="decimal"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
          />
          <Input
            label="Total marks"
            inputMode="decimal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
          />
        </div>
      )}

      {mode === 'change' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Starting value"
            inputMode="decimal"
            value={fromValue}
            onChange={(e) => setFromValue(e.target.value)}
          />
          <Input
            label="Ending value"
            inputMode="decimal"
            value={toValue}
            onChange={(e) => setToValue(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCalculate}>Calculate</Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not calculate">
          {error}
        </Alert>
      )}

      {result && !error && (
        <ResultBox label={result.label} value={result.value}>
          <span>
            {result.value}
            {result.grade && (
              <span className="ml-3 text-base font-semibold text-muted-foreground">
                Grade: {result.grade}
              </span>
            )}
          </span>
        </ResultBox>
      )}
    </div>
  );
}
