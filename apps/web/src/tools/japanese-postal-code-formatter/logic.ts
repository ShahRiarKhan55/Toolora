export type PostalCodeError =
  'empty' | 'invalid-characters' | 'too-few-digits' | 'too-many-digits' | 'misplaced-separator';

export const POSTAL_CODE_ERROR_MESSAGES: Record<PostalCodeError, string> = {
  empty: 'Enter a postal code.',
  'invalid-characters': 'Use digits only (a hyphen or space after the first 3 digits is fine).',
  'too-few-digits': 'A Japanese postal code has 7 digits. This has fewer.',
  'too-many-digits': 'A Japanese postal code has 7 digits. This has more.',
  'misplaced-separator': 'Put the hyphen or space after the first 3 digits, as in 100-0001.',
};

export type PostalCodeOutcome = { ok: true; value: string } | { ok: false; error: PostalCodeError };

// Hyphen-like characters people paste in: ‐ ‑ ‒ – — ― − ー and the full-width hyphen-minus (－ → "-" via NFKC).
const HYPHENS = /[‐-―−ー－]/g;

/**
 * Normalizes a Japanese postal code to `XXX-XXXX`. Accepts full-width digits, a leading 〒, and a
 * hyphen or space between the 3rd and 4th digit. It checks the *format only* — whether the code is
 * assigned to a real address is not known here.
 */
export function formatPostalCode(input: string): PostalCodeOutcome {
  const text = input
    .normalize('NFKC')
    .replace(HYPHENS, '-')
    .trim()
    .replace(/^〒\s*/, '');
  if (text === '') return { ok: false, error: 'empty' };

  const match = /^(\d{3})[\s-]*(\d{4})$/.exec(text);
  if (match) return { ok: true, value: `${match[1]}-${match[2]}` };

  if (/[^\d\s-]/.test(text)) return { ok: false, error: 'invalid-characters' };
  const digits = text.replace(/[\s-]/g, '');
  if (digits.length < 7) return { ok: false, error: 'too-few-digits' };
  if (digits.length > 7) return { ok: false, error: 'too-many-digits' };
  return { ok: false, error: 'misplaced-separator' };
}
