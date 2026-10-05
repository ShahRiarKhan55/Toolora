import { useState } from 'react';
import { TextResult } from '../../components/tool/TextResult';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { KANA_MODES, WIDTH_SCOPES, convertKana } from './logic';
import type { KanaMode, WidthScope } from './logic';

export function KanaWidthConverterTool() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<KanaMode>('hiragana-to-katakana');
  const [scope, setScope] = useState<WidthScope>('all');
  const isWidthMode = mode === 'to-halfwidth' || mode === 'to-fullwidth';
  const output = convertKana(input, mode, scope);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Conversion"
          value={mode}
          onChange={(event) => setMode(event.target.value as KanaMode)}
        >
          {KANA_MODES.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </Select>
        {isWidthMode && (
          <Select
            label="Characters to convert"
            value={scope}
            onChange={(event) => setScope(event.target.value as WidthScope)}
          >
            {WIDTH_SCOPES.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </Select>
        )}
      </div>

      <Textarea
        label="Text"
        lang="ja"
        rows={6}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="ひらがな、カタカナ、ＡＢＣ１２３ …"
        hint="Characters the conversion does not apply to are kept as they are."
      />

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => setInput('')}>
          Clear
        </Button>
      </div>

      {input !== '' && <TextResult value={output} />}
    </div>
  );
}
