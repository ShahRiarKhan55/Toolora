import { useState } from 'react';
import { TextResult } from '../../components/tool/TextResult';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { URL_DECODE_ERROR_MESSAGES, decodeUrlComponent, encodeUrlComponent } from './logic';

export function UrlEncoderDecoderTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function encode() {
    setError(null);
    setOutput(encodeUrlComponent(input));
  }

  function decode() {
    const result = decodeUrlComponent(input);
    if (!result.ok) {
      setOutput(null);
      setError(URL_DECODE_ERROR_MESSAGES[result.error]);
      return;
    }
    setError(null);
    setOutput(result.value);
  }

  function clear() {
    setInput('');
    setOutput(null);
    setError(null);
  }

  return (
    <div className="space-y-6">
      <Textarea
        label="Text or percent-encoded string"
        rows={6}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Type or paste text, or something like caf%C3%A9%20au%20lait…"
        hint="Encode treats the input as one URL component (a query value, a path segment): it also escapes / ? & = # and :. Do not encode a whole URL this way."
      />

      <div className="flex flex-wrap gap-3">
        <Button onClick={encode}>Encode</Button>
        <Button onClick={decode}>Decode</Button>
        <Button variant="secondary" onClick={clear}>
          Clear
        </Button>
      </div>

      {error && (
        <Alert tone="error" title="Could not decode">
          {error}
        </Alert>
      )}
      {output !== null && !error && <TextResult value={output} mono />}
    </div>
  );
}
