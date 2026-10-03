export type RegexError = 'empty-pattern' | 'invalid-flags' | 'invalid-pattern';

export interface RegexMatch {
  text: string;
  /** UTF-16 code-unit offsets, as used by JavaScript strings (`end` is exclusive). */
  index: number;
  end: number;
  /** Numbered capture groups (`undefined` when the group did not take part in the match). */
  groups: readonly (string | undefined)[];
  namedGroups: Readonly<Record<string, string | undefined>>;
}

export interface RegexResult {
  matches: readonly RegexMatch[];
  /** True when `MAX_MATCHES` was reached and later matches were not collected. */
  truncated: boolean;
}

export type RegexOutcome =
  { ok: true; value: RegexResult } | { ok: false; error: RegexError; message: string };

/** The flags the tool offers (a subset of what JavaScript's RegExp accepts). */
export const REGEX_FLAGS = [
  { flag: 'g', label: 'global', description: 'Find every match, not just the first.' },
  { flag: 'i', label: 'ignore case', description: 'Letter case does not matter.' },
  { flag: 'm', label: 'multiline', description: '^ and $ match at each line.' },
  { flag: 's', label: 'dotAll', description: '. also matches line breaks.' },
  { flag: 'u', label: 'unicode', description: 'Treat the pattern as Unicode code points.' },
] as const;

export const MAX_MATCHES = 1000;

/**
 * Runs a pattern with the browser's native `RegExp` — the pattern is only ever compiled as a regular
 * expression, never evaluated as code. Without the `g` flag only the first match is reported, like
 * `String.prototype.match`. Zero-length matches advance by one code unit so the loop always ends.
 */
export function testRegex(pattern: string, flags: string, text: string): RegexOutcome {
  if (pattern === '') {
    return { ok: false, error: 'empty-pattern', message: 'Enter a regular expression to test.' };
  }

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, flags);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'The pattern is not a valid expression.';
    // V8 words flag errors "Invalid flags supplied to RegExp constructor 'x'" and pattern errors
    // "Invalid regular expression: /.../: ..."; other engines differ, so default to a pattern error.
    const error = /invalid flags/i.test(message) ? 'invalid-flags' : 'invalid-pattern';
    return { ok: false, error, message };
  }

  const matches: RegexMatch[] = [];
  let truncated = false;

  for (;;) {
    const match = regex.exec(text);
    if (!match) break;
    if (matches.length >= MAX_MATCHES) {
      truncated = true;
      break;
    }
    matches.push({
      text: match[0],
      index: match.index,
      end: match.index + match[0].length,
      groups: match.slice(1),
      namedGroups: { ...(match.groups ?? {}) },
    });
    // Without g/y, exec ignores lastIndex and would return the same match forever.
    if (!regex.global && !regex.sticky) break;
    if (match[0] === '') regex.lastIndex += 1;
  }

  return { ok: true, value: { matches, truncated } };
}
