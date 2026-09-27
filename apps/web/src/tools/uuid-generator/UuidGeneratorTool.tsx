import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { COUNT_ERROR_MESSAGES, generateUuids, parseCount } from './logic';

export function UuidGeneratorTool() {
  const [count, setCount] = useState('1');
  const [uuids, setUuids] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function handleGenerate() {
    const outcome = parseCount(count);
    if (!outcome.ok) {
      setUuids([]);
      setError(COUNT_ERROR_MESSAGES[outcome.error]);
      return;
    }
    setError(null);
    setUuids(generateUuids(outcome.value));
  }

  function handleClear() {
    setUuids([]);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          label="How many?"
          inputMode="numeric"
          value={count}
          onChange={(event) => setCount(event.target.value)}
          className="w-40"
        />
        <Button onClick={handleGenerate}>{uuids.length > 0 ? 'Regenerate' : 'Generate'}</Button>
        <Button variant="secondary" onClick={handleClear} disabled={uuids.length === 0}>
          Clear
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not generate">
          {error}
        </Alert>
      )}

      {uuids.length > 0 && !error && (
        <div className="space-y-3" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">
              {uuids.length} {uuids.length === 1 ? 'UUID' : 'UUIDs'}
            </p>
            <CopyButton text={uuids.join('\n')} label="Copy all" />
          </div>
          <ul className="divide-y divide-border rounded-control border border-border bg-surface-muted">
            {uuids.map((uuid, index) => (
              <li key={`${uuid}-${index}`} className="flex items-center justify-between gap-3 p-3">
                <code className="min-w-0 truncate font-mono text-sm">{uuid}</code>
                <CopyButton text={uuid} label="Copy" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
