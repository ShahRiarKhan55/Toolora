import { useState } from 'react';
import { TextResult } from '../../components/tool/TextResult';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { Textarea } from '../../components/ui/Textarea';
import { decodeHtmlEntities, encodeHtmlEntities } from './logic';

export function HtmlEntityEncoderDecoderTool() {
  const [input, setInput] = useState('');
  const [nonAscii, setNonAscii] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function encode() {
    setError(null);
    setOutput(encodeHtmlEntities(input, nonAscii));
  }

  function decode() {
    const result = decodeHtmlEntities(input);
    if (!result.ok) {
      setOutput(null);
      setError(`These look like entities but are not valid: ${result.entities.join(' ')}`);
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
        label="Text or HTML entities"
        rows={6}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={'<p class="note">Tom & Jerry</p>  or  &lt;p&gt;Tom &amp; Jerry&lt;/p&gt;'}
        hint="The result is always shown as plain text. It is never rendered as HTML."
      />

      <Checkbox
        label="Also encode non-ASCII characters"
        hint="writes é as &#233; when encoding"
        checked={nonAscii}
        onChange={(event) => setNonAscii(event.target.checked)}
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
