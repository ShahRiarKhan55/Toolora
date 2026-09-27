import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Textarea } from '../../components/ui/Textarea';
import { formatJson, minifyJson } from './logic';

const SAMPLE = '{\n  "name": "Toolora",\n  "tools": ["json", "base64", "uuid"],\n  "free": true\n}';

export function JsonFormatterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleFormat() {
    const result = formatJson(input);
    if (!result.ok) {
      setOutput('');
      setError(result.failure.message);
      return;
    }
    setError(null);
    setOutput(result.value);
  }

  function handleMinify() {
    const result = minifyJson(input);
    if (!result.ok) {
      setOutput('');
      setError(result.failure.message);
      return;
    }
    setError(null);
    setOutput(result.value);
  }

  function handleReset() {
    setInput('');
    setOutput('');
    setError(null);
  }

  function handleSample() {
    setInput(SAMPLE);
    setOutput('');
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Textarea
        label="JSON input"
        mono
        rows={10}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Paste JSON here…"
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleFormat}>Format</Button>
        <Button variant="secondary" onClick={handleMinify}>
          Minify
        </Button>
        <Button variant="secondary" onClick={handleSample}>
          Load example
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Invalid JSON">
          {error}
        </Alert>
      )}

      {output && !error && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Result</p>
            <CopyButton text={output} label="Copy result" />
          </div>
          <Textarea label="Result" hideLabel mono readOnly rows={10} value={output} />
        </div>
      )}
    </div>
  );
}
