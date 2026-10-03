import { describe, expect, it } from 'vitest';
import { jsonToTypeScript, validateTypeName } from './logic';

function ts(input: string, name = 'Root') {
  const outcome = jsonToTypeScript(input, name);
  if (!outcome.ok) throw new Error(outcome.message);
  return outcome.value;
}

describe('jsonToTypeScript', () => {
  it('maps primitive properties', () => {
    expect(ts('{"a":"x","b":1,"c":true,"d":null}')).toBe(
      'export interface Root {\n  a: string;\n  b: number;\n  c: boolean;\n  d: null;\n}',
    );
  });

  it('creates a named interface for a nested object, after the root', () => {
    expect(ts('{"user":{"name":"A"}}')).toBe(
      'export interface Root {\n  user: User;\n}\n\nexport interface User {\n  name: string;\n}',
    );
  });

  it('handles deep nesting', () => {
    const out = ts('{"a":{"b":{"c":1}}}');
    expect(out).toContain('a: A;');
    expect(out).toContain('export interface A {\n  b: B;\n}');
    expect(out).toContain('export interface B {\n  c: number;\n}');
  });

  it('maps arrays of primitives and an empty array', () => {
    expect(ts('{"a":[1,2],"b":[]}')).toContain('  a: number[];\n  b: unknown[];');
  });

  it('parenthesizes a mixed array', () => {
    expect(ts('{"a":[1,"x",null]}')).toContain('a: (number | string | null)[];');
  });

  it('merges an array of objects into one interface with optional keys', () => {
    const out = ts('{"items":[{"id":1,"tag":"a"},{"id":2}]}');
    expect(out).toContain('items: ItemsItem[];');
    expect(out).toContain('export interface ItemsItem {\n  id: number;\n  tag?: string;\n}');
  });

  it('unions a property whose type differs between array items', () => {
    expect(ts('[{"v":1},{"v":"x"},{"v":null}]')).toContain('v: number | string | null;');
  });

  it('puts null last in a union', () => {
    expect(ts('[{"v":null},{"v":"x"}]')).toContain('v: string | null;');
  });

  it('handles a root array of objects', () => {
    expect(ts('[{"a":1}]', 'Rows')).toBe(
      'export type Rows = RowsItem[];\n\nexport interface RowsItem {\n  a: number;\n}',
    );
  });

  it('handles root primitives and null', () => {
    expect(ts('1')).toBe('export type Root = number;');
    expect(ts('null')).toBe('export type Root = null;');
    expect(ts('[]')).toBe('export type Root = unknown[];');
  });

  it('handles an empty object', () => {
    expect(ts('{}')).toBe('export interface Root {}');
  });

  it('quotes keys that are not identifiers', () => {
    expect(ts('{"first-name":"A","2fa":true}')).toContain('"first-name": string;');
    expect(ts('{"2fa":true}')).toContain('"2fa": boolean;');
  });

  it('names nested interfaces from awkward keys safely', () => {
    expect(ts('{"my-key":{"a":1},"9x":{"b":1}}')).toMatch(/export interface MyKey \{/);
    expect(ts('{"9x":{"b":1}}')).toMatch(/export interface _9x \{/);
  });

  it('reuses one interface for identical shapes and numbers conflicting ones', () => {
    const same = ts('{"a":{"x":1},"b":{"x":2}}');
    expect(same.match(/export interface/g)).toHaveLength(2); // Root + A (reused for b)
    expect(same).toContain('b: A;');
    const clash = ts('{"p":{"a":{"x":1}},"q":{"a":{"y":1}}}');
    expect(clash).toContain('export interface A {');
    expect(clash).toContain('export interface A2 {');
  });

  it('avoids colliding with the root name', () => {
    const out = ts('{"root":{"a":1}}');
    expect(out).toContain('root: Root2;');
  });

  it('treats a __proto__ key as ordinary data', () => {
    expect(ts('{"__proto__":{"a":1}}')).toContain('  __proto__: Proto;');
  });

  it('rejects empty and invalid JSON', () => {
    expect(jsonToTypeScript('', 'Root')).toMatchObject({ ok: false });
    expect(jsonToTypeScript('{bad', 'Root')).toMatchObject({ ok: false });
  });

  it('rejects invalid or reserved root names', () => {
    expect(jsonToTypeScript('{}', '')).toMatchObject({ ok: false });
    expect(jsonToTypeScript('{}', '1abc')).toMatchObject({ ok: false });
    expect(jsonToTypeScript('{}', 'my type')).toMatchObject({ ok: false });
    expect(jsonToTypeScript('{}', 'class')).toMatchObject({ ok: false });
  });

  it('never evaluates the input and does not echo JSON string values into code', () => {
    const globals = globalThis as { __pwned?: boolean };
    const out = ts('{"a":"globalThis.__pwned = true; }"}');
    expect(out).not.toContain('__pwned');
    expect(globals.__pwned).toBeUndefined();
  });
});

describe('validateTypeName', () => {
  it('accepts normal identifiers', () => {
    for (const name of ['Root', 'ApiResponse', '_x', '$y', 'A1']) {
      expect(validateTypeName(name)).toBeUndefined();
    }
  });
});
