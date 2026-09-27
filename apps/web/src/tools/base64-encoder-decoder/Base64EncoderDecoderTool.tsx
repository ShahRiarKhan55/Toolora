import { useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { BASE64_DECODE_ERROR_MESSAGES, decodeBase64ToText, encodeTextToBase64 } from './logic';

type Mode = 'encode' | 'decode';

export function Base64EncoderDecoderTool() {
  const [mode, setMode] = useState<Mode>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function run(nextMode: Mode, value: string) {
    if (nextMode === 'encode') {
      setError(null);
      setOutput(encodeTextToBase64(value));
      return;
    }
    const result = decodeBase64ToText(value);
    if (!result.ok) {
      setOutput('');
      setError(BASE64_DECODE_ERROR_MESSAGES[result.error]);
      return;
    }
    setError(null);
    setOutput(result.value);
  }

  function handleConvert() {
    run(mode, input);
  }

  function handleModeChange(nextMode: Mode) {
    setMode(nextMode);
    setInput('');
    setOutput('');
    setError(null);
  }

  function handleSwap() {
    if (error) return;
    const nextMode: Mode = mode === 'encode' ? 'decode' : 'encode';
    setMode(nextMode);
    setInput(output);
    setOutput('');
    setError(null);
  }

  function handleReset() {
    setInput('');
    setOutput('');
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Select
        label="Mode"
        value={mode}
        onChange={(event) => handleModeChange(event.target.value as Mode)}
      >
        <option value="encode">Text → Base64</option>
        <option value="decode">Base64 → Text</option>
      </Select>

      <Textarea
        label={mode === 'encode' ? 'Text' : 'Base64'}
        mono={mode === 'decode'}
        rows={8}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={mode === 'encode' ? 'Type or paste text…' : 'Paste Base64 here…'}
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleConvert}>{mode === 'encode' ? 'Encode' : 'Decode'}</Button>
        <Button variant="secondary" onClick={handleSwap} disabled={!output || Boolean(error)}>
          Swap &amp; use result as input
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not decode">
          {error}
        </Alert>
      )}

      {output && !error && (
        <div className="space-y-2" aria-live="polite">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted-foreground">Result</p>
            <CopyButton text={output} label="Copy result" />
          </div>
          <Textarea
            label="Result"
            hideLabel
            mono={mode === 'encode'}
            readOnly
            rows={8}
            value={output}
          />
        </div>
      )}
    </div>
  );
}
