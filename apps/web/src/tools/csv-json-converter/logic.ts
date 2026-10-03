export type ConvertOutcome = { ok: true; value: string } | { ok: false; message: string };
export type CsvParseOutcome = { ok: true; rows: string[][] } | { ok: false; message: string };

/**
 * RFC 4180-style CSV parser: quoted fields, commas and line breaks inside quotes, `""` as an escaped
 * quote, LF or CRLF row ends. Blank lines are skipped. A stray quote inside an unquoted field is kept
 * literally; text after a closing quote is an error rather than being silently guessed at.
 */
export function parseCsv(input: string): CsvParseOutcome {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  let afterQuote = false; // a closing quote was just read; only a comma or a line end may follow
  let fieldWasQuoted = false;
  let line = 1;

  const endField = () => {
    row.push(field);
    field = '';
    fieldWasQuoted = false;
    afterQuote = false;
  };
  const endRow = () => {
    const blank = row.length === 0 && field === '' && !fieldWasQuoted;
    if (!blank) {
      endField();
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charAt(i);
    if (inQuotes) {
      if (ch === '"') {
        if (input.charAt(i + 1) === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
          afterQuote = true;
        }
      } else {
        if (ch === '\n') line += 1;
        field += ch;
      }
    } else if (ch === '"' && field === '' && !afterQuote) {
      inQuotes = true;
      fieldWasQuoted = true;
    } else if (ch === ',') {
      endField();
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input.charAt(i + 1) === '\n') i += 1;
      endRow();
      line += 1;
    } else if (afterQuote) {
      return {
        ok: false,
        message: `Unexpected character "${ch}" after a closing quote on line ${line}. Put a comma after the quoted field, or double any quote inside it ("").`,
      };
    } else {
      field += ch;
    }
  }

  if (inQuotes) {
    return {
      ok: false,
      message: 'A quoted field is never closed. Add the missing closing quote (").',
    };
  }
  if (field !== '' || row.length > 0 || fieldWasQuoted) endRow();
  return { ok: true, rows };
}

/** Converts CSV text to a pretty-printed JSON string. Every value stays a string (no type guessing). */
export function csvToJson(input: string, hasHeader: boolean): ConvertOutcome {
  const empty: ConvertOutcome = { ok: false, message: 'Enter some CSV to convert.' };
  if (input.trim() === '') return empty;
  const parsed = parseCsv(input);
  if (!parsed.ok) return parsed;
  const { rows } = parsed;
  if (rows.length === 0) return empty;

  if (!hasHeader) return { ok: true, value: JSON.stringify(rows, null, 2) };

  const [header = [], ...body] = rows;
  const names = header.map((name) => name.trim());
  if (names.some((name) => name === '')) {
    return {
      ok: false,
      message:
        'Every header cell needs a name. Fix the first row, or untick "First row is a header".',
    };
  }
  const duplicate = names.find((name, i) => names.indexOf(name) !== i);
  if (duplicate !== undefined) {
    return {
      ok: false,
      message: `The header "${duplicate}" appears more than once. Header names must be unique.`,
    };
  }

  const records: Record<string, string>[] = [];
  for (const [i, cells] of body.entries()) {
    if (cells.length !== names.length) {
      return {
        ok: false,
        message: `Row ${i + 2} has ${cells.length} ${cells.length === 1 ? 'field' : 'fields'} but the header has ${names.length}.`,
      };
    }
    // defineProperty keeps a header like "__proto__" as plain data instead of setting a prototype.
    const record: Record<string, string> = {};
    names.forEach((name, col) =>
      Object.defineProperty(record, name, {
        value: cells[col] ?? '',
        enumerable: true,
        writable: true,
        configurable: true,
      }),
    );
    records.push(record);
  }
  return { ok: true, value: JSON.stringify(records, null, 2) };
}

function csvCell(value: unknown): string {
  let text: string;
  if (value === null || value === undefined) text = '';
  else if (typeof value === 'string') text = value;
  else if (typeof value === 'object') text = JSON.stringify(value);
  else if (typeof value === 'number' || typeof value === 'boolean') text = String(value);
  else text = ''; // JSON.parse never produces any other type
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Converts a JSON array to CSV. An array of objects becomes a header row (the union of keys in
 * first-seen order) plus one row per object; an array of arrays becomes rows as-is. Nested values are
 * written as JSON text, and a missing key becomes an empty cell.
 */
export function jsonToCsv(input: string): ConvertOutcome {
  if (input.trim() === '') return { ok: false, message: 'Enter some JSON to convert.' };
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'The input is not valid JSON.',
    };
  }
  if (!Array.isArray(data)) {
    return { ok: false, message: 'The JSON must be an array of objects (or an array of arrays).' };
  }
  if (data.length === 0) {
    return { ok: false, message: 'The JSON array is empty, so there is nothing to convert.' };
  }

  const items = data as unknown[];
  let lines: string[][];
  if (items.every(isPlainObject)) {
    const objects = items;
    const keys = [...new Set(objects.flatMap((item) => Object.keys(item)))];
    lines = [
      keys.map(csvCell),
      ...objects.map((item) =>
        keys.map((key) => (Object.hasOwn(item, key) ? csvCell(item[key]) : '')),
      ),
    ];
  } else if (items.every(Array.isArray)) {
    lines = (items as unknown[][]).map((row) => row.map(csvCell));
  } else {
    return {
      ok: false,
      message:
        'Every item must be an object, or every item must be an array. Mixed items cannot become a table.',
    };
  }
  return { ok: true, value: lines.map((cells) => cells.join(',')).join('\n') };
}
