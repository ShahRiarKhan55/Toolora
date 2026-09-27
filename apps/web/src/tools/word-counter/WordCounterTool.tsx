import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { analyzeText } from './logic';

const STATS: { key: keyof ReturnType<typeof analyzeText>; label: string }[] = [
  { key: 'wordCount', label: 'Words' },
  { key: 'characterCount', label: 'Characters' },
  { key: 'characterCountNoSpaces', label: 'Characters (no spaces)' },
  { key: 'sentenceCount', label: 'Sentences' },
  { key: 'paragraphCount', label: 'Paragraphs' },
];

export function WordCounterTool() {
  const [text, setText] = useState('');
  const stats = useMemo(() => analyzeText(text), [text]);

  return (
    <div className="space-y-6">
      <Textarea
        label="Text"
        hideLabel
        placeholder="Paste or type your text here…"
        rows={10}
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setText('')} disabled={text === ''}>
          Clear
        </Button>
      </div>

      <div aria-live="polite" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STATS.map((stat) => (
          <div
            key={stat.key}
            className="rounded-control border border-border bg-surface-muted p-3 text-center"
          >
            <p className="text-2xl font-bold tracking-tight">{stats[stat.key].toLocaleString()}</p>
            <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="text-sm text-muted-foreground">
        Estimated reading time:{' '}
        <span className="font-semibold text-foreground">
          {stats.readingTimeMinutes === 0
            ? '—'
            : `${stats.readingTimeMinutes} ${stats.readingTimeMinutes === 1 ? 'minute' : 'minutes'}`}
        </span>
      </p>
    </div>
  );
}
