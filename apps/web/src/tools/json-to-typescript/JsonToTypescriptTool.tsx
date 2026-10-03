import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { jsonToTypeScript, validateTypeName } from './logic';

const EXAMPLE =
  '{\n  "id": 1,\n  "name": "Aya",\n  "email": null,\n  "tags": ["a", "b"],\n  "address": { "city": "Tokyo", "zip": "100-0001" },\n  "orders": [{ "id": 1, "total": 9.5 }, { "id": 2 }]\n}';

export function JsonToTypescriptTool() {
  const [json, setJson] = useState('');
  const [rootName, setRootName] = useState('Root');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const nameError = validateTypeName(rootName);

  function handleGenerate() {
    const result = jsonToTypeScript(json, rootName);
    if (!result.ok) {
      setOutput('');
      // A bad name is already shown at its own field; only JSON problems go in the alert.
      setError(nameError ? null : result.message);
      return;
    }
    setError(null);
    setOutput(result.value);
  }

  function handleReset() {
    setJson('');
    setRootName('Root');
    setOutput('');
    setError(null);
  }

  function handleExample() {
    setJson(EXAMPLE);
    setOutput('');
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Input
        label="Root type name"
        value={rootName}
        onChange={(event) => setRootName(event.target.value)}
        error={nameError}
        spellCheck={false}
        autoComplete="off"
        className="sm:max-w-xs [&_input]:font-mono"
      />

      <Textarea
        label="JSON input"
        mono
        rows={10}
        value={json}
        onChange={(event) => setJson(event.target.value)}
        placeholder="Paste a JSON sample here…"
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleGenerate}>Generate TypeScript</Button>
        <Button variant="secondary" onClick={handleExample}>
          Load example
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not generate types">
          {error}
        </Alert>
      )}

      {output && !error && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Result</p>
            <CopyButton text={output} label="Copy result" />
          </div>
          <Textarea label="Result" hideLabel mono readOnly rows={12} value={output} wrap="off" />
        </div>
      )}
    </div>
  );
}
