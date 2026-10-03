import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { CopyButton } from '../../components/ui/CopyButton';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { csvToJson, jsonToCsv } from './logic';

type Direction = 'csv-to-json' | 'json-to-csv';

const EXAMPLES: Record<Direction, string> = {
  'csv-to-json': 'name,city,note\nAya,"Tokyo, Japan","Says ""hello"""\nKen,Osaka,',
  'json-to-csv':
    '[\n  { "name": "Aya", "city": "Tokyo, Japan" },\n  { "name": "Ken", "age": 31 }\n]',
};

export function CsvJsonConverterTool() {
  const [direction, setDirection] = useState<Direction>('csv-to-json');
  const [hasHeader, setHasHeader] = useState(true);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isCsvInput = direction === 'csv-to-json';

  function handleConvert() {
    const result = isCsvInput ? csvToJson(input, hasHeader) : jsonToCsv(input);
    if (!result.ok) {
      setOutput('');
      setError(result.message);
      return;
    }
    setError(null);
    setOutput(result.value);
  }

  function handleDirectionChange(next: Direction) {
    setDirection(next);
    setInput('');
    setOutput('');
    setError(null);
  }

  function handleReset() {
    setInput('');
    setOutput('');
    setError(null);
  }

  function handleExample() {
    setInput(EXAMPLES[direction]);
    setOutput('');
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Select
        label="Direction"
        value={direction}
        onChange={(event) => handleDirectionChange(event.target.value as Direction)}
      >
        <option value="csv-to-json">CSV → JSON</option>
        <option value="json-to-csv">JSON → CSV</option>
      </Select>

      <Textarea
        label={isCsvInput ? 'CSV input' : 'JSON input'}
        mono
        rows={10}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={isCsvInput ? 'Paste CSV here…' : 'Paste a JSON array here…'}
        wrap="off"
      />

      {isCsvInput && (
        <Checkbox
          label="First row is a header"
          hint="Rows become objects keyed by the header names"
          checked={hasHeader}
          onChange={(event) => setHasHeader(event.target.checked)}
        />
      )}

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConvert}>Convert</Button>
        <Button variant="secondary" onClick={handleExample}>
          Load example
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not convert">
          {error}
        </Alert>
      )}

      {output && !error && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Result</p>
            <CopyButton text={output} label="Copy result" />
          </div>
          <Textarea label="Result" hideLabel mono readOnly rows={10} value={output} wrap="off" />
        </div>
      )}
    </div>
  );
}
