import { useState } from 'react';
import { TextResult } from '../../components/tool/TextResult';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { CASE_OPTIONS, convertCase } from './logic';
import type { CaseId } from './logic';

export function TextCaseConverterTool() {
  const [input, setInput] = useState('');
  const [target, setTarget] = useState<CaseId>('title');

  return (
    <div className="space-y-6">
      <Textarea
        label="Text"
        rows={6}
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Type or paste text…"
      />

      <Select
        label="Convert to"
        value={target}
        onChange={(event) => setTarget(event.target.value as CaseId)}
        hint="Line breaks are kept. camelCase, PascalCase, snake_case and kebab-case convert each line separately."
      >
        {CASE_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>

      <div>
        <Button variant="secondary" onClick={() => setInput('')}>
          Clear
        </Button>
      </div>

      {input !== '' && <TextResult value={convertCase(input, target)} />}
    </div>
  );
}
