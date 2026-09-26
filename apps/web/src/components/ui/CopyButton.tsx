import { useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { CheckIcon, CopyIcon } from './icons';

type Status = 'idle' | 'copied' | 'failed';

const RESET_AFTER_MS = 2000;

const announcements: Record<Status, string> = {
  idle: '',
  copied: 'Copied to clipboard.',
  failed: 'Copy failed. Select the text and copy it manually.',
};

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
}

/** Copies `text` to the clipboard and reports the outcome visually and to screen readers. */
export function CopyButton({ text, label = 'Copy', className }: CopyButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      // Throws when the Clipboard API is missing (insecure context) or permission is denied.
      await navigator.clipboard.writeText(text);
      setStatus('copied');
    } catch {
      setStatus('failed');
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus('idle'), RESET_AFTER_MS);
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        className={className}
        disabled={text === ''}
        onClick={() => void copy()}
      >
        {status === 'copied' ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        {status === 'copied' ? 'Copied' : status === 'failed' ? 'Copy failed' : label}
      </Button>
      <span role="status" className="sr-only">
        {announcements[status]}
      </span>
    </>
  );
}
