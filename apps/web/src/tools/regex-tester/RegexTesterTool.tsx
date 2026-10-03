import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Checkbox } from '../../components/ui/Checkbox';
import { CopyButton } from '../../components/ui/CopyButton';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { REGEX_FLAGS, testRegex } from './logic';

const EXAMPLE_PATTERN = '(?<user>[\\w.]+)@(?<domain>[\\w.]+)';
const EXAMPLE_TEXT = 'Contact ada@example.com or grace@example.org for details.';

export function RegexTesterTool() {
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('');

  // Results update as the user types; an empty pattern is simply "nothing to show yet", not an error.
  const outcome = useMemo(
    () => (pattern === '' ? null : testRegex(pattern, flags, text)),
    [pattern, flags, text],
  );
  const matches = outcome?.ok ? outcome.value.matches : [];

  function toggleFlag(flag: string, on: boolean) {
    // Keep the flags in the canonical display order so the "/…/flags" line is stable.
    setFlags(
      REGEX_FLAGS.map((f) => f.flag)
        .filter((f) => (f === flag ? on : flags.includes(f)))
        .join(''),
    );
  }

  function handleReset() {
    setPattern('');
    setFlags('g');
    setText('');
  }

  function handleExample() {
    setPattern(EXAMPLE_PATTERN);
    setFlags('g');
    setText(EXAMPLE_TEXT);
  }

  return (
    <div className="space-y-6">
      <Input
        label="Regular expression"
        value={pattern}
        onChange={(event) => setPattern(event.target.value)}
        error={outcome && !outcome.ok ? outcome.message : undefined}
        hint="Write the pattern without the surrounding slashes."
        placeholder="e.g. \d{3}-\d{4}"
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        className="[&_input]:font-mono"
      />

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Flags</legend>
        <div className="flex flex-wrap gap-x-6">
          {REGEX_FLAGS.map(({ flag, label, description }) => (
            <Checkbox
              key={flag}
              label={`${flag} (${label})`}
              hint={description}
              checked={flags.includes(flag)}
              onChange={(event) => toggleFlag(flag, event.target.checked)}
            />
          ))}
        </div>
      </fieldset>

      <Textarea
        label="Test string"
        mono
        rows={6}
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Paste the text to search…"
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={handleExample}>
          Load example
        </Button>
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
      </div>

      <div aria-live="polite" className="space-y-3">
        {outcome?.ok && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-muted-foreground">
                {matches.length === 0
                  ? 'No matches'
                  : `${matches.length}${outcome.value.truncated ? '+' : ''} ${matches.length === 1 ? 'match' : 'matches'}`}
                <span className="font-mono font-normal">
                  {' '}
                  /{pattern}/{flags}
                </span>
              </p>
              {matches.length > 0 && (
                <CopyButton
                  text={matches.map((m) => m.text).join('\n')}
                  label="Copy matched text"
                />
              )}
            </div>
            {outcome.value.truncated && (
              <p className="text-sm text-muted-foreground">
                Only the first {matches.length} matches are shown.
              </p>
            )}
            {matches.length > 0 && (
              <ol className="space-y-2">
                {matches.map((match, i) => (
                  <li
                    key={`${match.index}-${i}`}
                    className="rounded-control border border-border bg-surface-muted p-3"
                  >
                    <p className="text-sm text-muted-foreground">
                      Match {i + 1} · position {match.index}–{match.end}
                    </p>
                    <code className="mt-1 block font-mono break-all whitespace-pre-wrap">
                      {match.text === '' ? '(empty match)' : match.text}
                    </code>
                    {(match.groups.length > 0 || Object.keys(match.namedGroups).length > 0) && (
                      <ul className="mt-2 space-y-0.5 text-sm">
                        {match.groups.map((group, g) => (
                          <li key={g}>
                            <span className="text-muted-foreground">Group {g + 1}: </span>
                            <code className="font-mono break-all whitespace-pre-wrap">
                              {group === undefined ? '(did not participate)' : group}
                            </code>
                          </li>
                        ))}
                        {Object.entries(match.namedGroups).map(([name, value]) => (
                          <li key={name}>
                            <span className="text-muted-foreground">Named group “{name}”: </span>
                            <code className="font-mono break-all whitespace-pre-wrap">
                              {value === undefined ? '(did not participate)' : value}
                            </code>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
      </div>
    </div>
  );
}
