import { describe, expect, it } from 'vitest';
import { csvToJson, jsonToCsv, parseCsv } from './logic';

function rows(input: string) {
  const outcome = parseCsv(input);
  if (!outcome.ok) throw new Error(outcome.message);
  return outcome.rows;
}

function json(input: string, hasHeader = true) {
  const outcome = csvToJson(input, hasHeader);
  if (!outcome.ok) throw new Error(outcome.message);
  return JSON.parse(outcome.value) as unknown;
}

describe('parseCsv', () => {
  it('splits simple rows and fields', () => {
    expect(rows('a,b,c\n1,2,3')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ]);
  });

  it('handles CRLF and a trailing newline', () => {
    expect(rows('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('keeps commas inside quoted fields', () => {
    expect(rows('"Tokyo, Japan",1')).toEqual([['Tokyo, Japan', '1']]);
  });

  it('unescapes doubled quotes', () => {
    expect(rows('"say ""hi""",x')).toEqual([['say "hi"', 'x']]);
  });

  it('keeps newlines inside quoted fields', () => {
    expect(rows('"line1\nline2",b\nc,d')).toEqual([
      ['line1\nline2', 'b'],
      ['c', 'd'],
    ]);
  });

  it('keeps empty values, including a trailing one', () => {
    expect(rows('a,,c,')).toEqual([['a', '', 'c', '']]);
    expect(rows('""')).toEqual([['']]);
  });

  it('skips blank lines', () => {
    expect(rows('a\n\n\nb')).toEqual([['a'], ['b']]);
  });

  it('keeps a stray quote in an unquoted field literally', () => {
    expect(rows('5" pipe,x')).toEqual([['5" pipe', 'x']]);
  });

  it('reports an unterminated quote', () => {
    expect(parseCsv('"abc,def')).toMatchObject({ ok: false });
  });

  it('reports text after a closing quote, with the line number', () => {
    const outcome = parseCsv('a\n"b"c,d');
    expect(outcome).toMatchObject({ ok: false });
    if (!outcome.ok) expect(outcome.message).toContain('line 2');
  });
});

describe('csvToJson', () => {
  it('turns a header and rows into objects', () => {
    expect(json('name,age\nAya,20\nKen,31')).toEqual([
      { name: 'Aya', age: '20' },
      { name: 'Ken', age: '31' },
    ]);
  });

  it('keeps values as strings and empty values as empty strings', () => {
    expect(json('a,b\n1,')).toEqual([{ a: '1', b: '' }]);
  });

  it('produces arrays of arrays without a header', () => {
    expect(json('a,b\n1,2', false)).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
  });

  it('returns an empty array for a header-only CSV', () => {
    expect(json('a,b')).toEqual([]);
  });

  it('handles quoted fields with commas, quotes and newlines end to end', () => {
    expect(json('q\n"a, ""b""\nc"')).toEqual([{ q: 'a, "b"\nc' }]);
  });

  it('rejects empty input', () => {
    expect(csvToJson('', true)).toMatchObject({ ok: false });
    expect(csvToJson('  \n ', true)).toMatchObject({ ok: false });
  });

  it('rejects duplicate and blank headers', () => {
    expect(csvToJson('a,a\n1,2', true)).toMatchObject({ ok: false });
    expect(csvToJson('a,\n1,2', true)).toMatchObject({ ok: false });
  });

  it('names the row whose field count does not match the header', () => {
    const outcome = csvToJson('a,b\n1,2\n3', true);
    expect(outcome).toMatchObject({ ok: false });
    if (!outcome.ok) expect(outcome.message).toContain('Row 3');
  });

  it('treats a header called __proto__ as plain data', () => {
    const parsed = json('__proto__\nx') as Record<string, string>[];
    expect(Object.keys(parsed[0] ?? {})).toEqual(['__proto__']);
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });
});

describe('jsonToCsv', () => {
  function csv(input: string) {
    const outcome = jsonToCsv(input);
    if (!outcome.ok) throw new Error(outcome.message);
    return outcome.value;
  }

  it('writes a header and rows for an array of objects', () => {
    expect(csv('[{"a":1,"b":"x"},{"a":2,"b":"y"}]')).toBe('a,b\n1,x\n2,y');
  });

  it('uses the union of keys and leaves missing cells empty', () => {
    expect(csv('[{"a":1},{"b":2}]')).toBe('a,b\n1,\n,2');
  });

  it('quotes commas, quotes and newlines', () => {
    expect(csv('[{"t":"a,b"},{"t":"say \\"hi\\""},{"t":"x\\ny"}]')).toBe(
      't\n"a,b"\n"say ""hi"""\n"x\ny"',
    );
  });

  it('writes null as empty and booleans as text', () => {
    expect(csv('[{"a":null,"b":true,"c":false}]')).toBe('a,b,c\n,true,false');
  });

  it('writes nested values as JSON text', () => {
    expect(csv('[{"a":{"b":1}}]')).toBe('a\n"{""b"":1}"');
  });

  it('writes an array of arrays as rows', () => {
    expect(csv('[["a","b"],[1,2]]')).toBe('a,b\n1,2');
  });

  it('round-trips through csvToJson', () => {
    const original = [{ name: 'A, B', note: 'say "hi"\nbye', empty: '' }];
    const text = csv(JSON.stringify(original));
    expect(json(text)).toEqual(original);
  });

  it('rejects empty, invalid, non-array, empty-array and mixed input', () => {
    expect(jsonToCsv('')).toMatchObject({ ok: false });
    expect(jsonToCsv('{bad')).toMatchObject({ ok: false });
    expect(jsonToCsv('{"a":1}')).toMatchObject({ ok: false });
    expect(jsonToCsv('[]')).toMatchObject({ ok: false });
    expect(jsonToCsv('[{"a":1},[1]]')).toMatchObject({ ok: false });
    expect(jsonToCsv('[1,2]')).toMatchObject({ ok: false });
  });
});
