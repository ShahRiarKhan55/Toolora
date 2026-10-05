import { CURRENCY_CODES, CURRENCY_INFO } from '@toolora/shared';
import { Select } from '../ui/Select';

/** Chooses how a calculator's amounts are labelled. Display only: it never fetches or applies rates. */
export function CurrencySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (code: string) => void;
}) {
  return (
    <Select
      label="Currency label"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      hint="Only changes how amounts are shown. No exchange rates are used."
    >
      <option value="">None (plain numbers)</option>
      {CURRENCY_CODES.map((code) => (
        <option key={code} value={code}>
          {code} — {CURRENCY_INFO[code].name}
        </option>
      ))}
    </Select>
  );
}
