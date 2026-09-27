export type JsonError = 'empty-input' | 'parse-error';

export interface JsonFailure {
  error: JsonError;
  message: string;
}

export type JsonParseOutcome = { ok: true; value: unknown } | { ok: false; failure: JsonFailure };
export type JsonStringOutcome = { ok: true; value: string } | { ok: false; failure: JsonFailure };

/** Parses JSON using the built-in, safe `JSON.parse` — nothing here ever evaluates user input as code. */
export function parseJson(input: string): JsonParseOutcome {
  if (input.trim() === '') {
    return { ok: false, failure: { error: 'empty-input', message: 'Enter some JSON to format.' } };
  }
  try {
    return { ok: true, value: JSON.parse(input) as unknown };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The input is not valid JSON.';
    return { ok: false, failure: { error: 'parse-error', message } };
  }
}

/** Pretty-prints valid JSON with the given indent width (spaces). */
export function formatJson(input: string, indent = 2): JsonStringOutcome {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(parsed.value, null, indent) };
}

/** Removes all insignificant whitespace from valid JSON. */
export function minifyJson(input: string): JsonStringOutcome {
  const parsed = parseJson(input);
  if (!parsed.ok) return parsed;
  return { ok: true, value: JSON.stringify(parsed.value) };
}
