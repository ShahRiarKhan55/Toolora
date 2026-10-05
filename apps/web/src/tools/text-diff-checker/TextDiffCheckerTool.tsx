import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { cx } from '../../lib/cx';
import { DIFF_ERROR_MESSAGES, diffLines } from './logic';
import type { DiffLineType, DiffResult } from './logic';

const ROW: Record<DiffLineType, { sign: string; label: string; row: string }> = {
  same: { sign: ' ', label: 'Unchanged', row: '' },
  added: { sign: '+', label: 'Added', row: 'bg-success-soft' },
  removed: { sign: '−', label: 'Removed', row: 'bg-error-soft' },
};

function plural(count: number, noun: string) {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

export function TextDiffCheckerTool() {
  const [original, setOriginal] = useState('');
  const [changed, setChanged] = useState('');
  const [result, setResult] = useState<DiffResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function compare() {
    const outcome = diffLines(original, changed);
    if (!outcome.ok) {
      setResult(null);
      setError(DIFF_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setResult(outcome.value);
  }

  function swap() {
    setOriginal(changed);
    setChanged(original);
    setResult(null);
    setError(null);
  }

  function clear() {
    setOriginal('');
    setChanged('');
    setResult(null);
    setError(null);
  }

  const identical = result !== null && result.added === 0 && result.removed === 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <Textarea
          label="Original text"
          mono
          rows={10}
          wrap="off"
          value={original}
          onChange={(event) => setOriginal(event.target.value)}
        />
        <Textarea
          label="Changed text"
          mono
          rows={10}
          wrap="off"
          value={changed}
          onChange={(event) => setChanged(event.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={compare}>Compare</Button>
        <Button variant="secondary" onClick={swap}>
          Swap texts
        </Button>
        <Button variant="secondary" onClick={clear}>
          Clear
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Both texts stay in your browser: nothing is uploaded or saved. Lines are compared exactly,
        including case and spaces.
      </p>

      {error && (
        <Alert tone="error" title="Could not compare">
          {error}
        </Alert>
      )}

      {result && !error && (
        <div className="space-y-3">
          <p role="status" className="text-sm font-semibold">
            {identical
              ? result.unchanged === 0
                ? 'Both texts are empty.'
                : 'The texts are identical.'
              : `${plural(result.added, 'line')} added, ${plural(result.removed, 'line')} removed, ${result.unchanged} unchanged.`}
          </p>
          {result.lines.length > 0 && (
            <div className="overflow-x-auto rounded-control border border-border">
              <table className="w-full border-collapse font-mono text-sm">
                <caption className="sr-only">Line-by-line differences</caption>
                <thead className="sr-only">
                  <tr>
                    <th scope="col">Original line</th>
                    <th scope="col">Changed line</th>
                    <th scope="col">Change</th>
                    <th scope="col">Text</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lines.map((line, index) => {
                    const { sign, label, row } = ROW[line.type];
                    return (
                      <tr key={index} className={cx(row)}>
                        <td className="w-12 px-2 text-right text-muted-foreground select-none">
                          {line.oldLine}
                        </td>
                        <td className="w-12 px-2 text-right text-muted-foreground select-none">
                          {line.newLine}
                        </td>
                        <td className="w-8 px-2 text-center font-bold select-none">
                          <span aria-hidden="true">{sign}</span>
                          <span className="sr-only">{label}</span>
                        </td>
                        <td className="pr-3 whitespace-pre">{line.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
