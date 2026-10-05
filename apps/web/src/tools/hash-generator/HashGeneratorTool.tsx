import { useEffect, useState } from 'react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { CopyButton } from '../../components/ui/CopyButton';
import { Textarea } from '../../components/ui/Textarea';
import { HASH_ALGORITHMS, hashAll } from './logic';
import type { HashAlgorithm } from './logic';

type Hashes = Record<HashAlgorithm, string>;

export function HashGeneratorTool() {
  const [input, setInput] = useState('');
  const [computed, setComputed] = useState<{ text: string; hashes: Hashes } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (input === '') return;
    let current = true;
    hashAll(input).then(
      (result) => {
        if (current) {
          setComputed({ text: input, hashes: result });
          setFailed(false);
        }
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [input]);

  // Only hashes of the text currently in the box are shown, never a previous edit's.
  const hashes = computed?.text === input ? computed.hashes : null;
  const showHashes = input !== '' && hashes !== null && !failed;

  return (
    <div className="space-y-6">
      <Textarea
        label="Text to hash"
        rows={6}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Type or paste text…"
        hint="The text is encoded as UTF-8, so a trailing space or line break changes the hash."
      />
      <div>
        <Button variant="secondary" onClick={() => setInput('')}>
          Clear
        </Button>
      </div>

      {failed && (
        <Alert tone="error" title="Hashing is not available">
          Your browser did not provide the Web Crypto API, which is only available on secure (HTTPS
          or localhost) pages.
        </Alert>
      )}

      {input === '' && (
        <p className="text-sm text-muted-foreground">
          Enter some text to see its SHA-256, SHA-384 and SHA-512 hashes.
        </p>
      )}

      {showHashes && (
        <div className="space-y-4" aria-live="polite">
          {HASH_ALGORITHMS.map((algorithm) => (
            <div key={algorithm}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-muted-foreground">{algorithm}</h3>
                <CopyButton text={hashes[algorithm]} label={`Copy ${algorithm}`} />
              </div>
              <p className="mt-1 rounded-control border border-border bg-surface-muted p-3 font-mono text-sm break-all">
                <span className="sr-only">{algorithm} hash: </span>
                {hashes[algorithm]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
