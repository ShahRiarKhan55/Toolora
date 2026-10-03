export type PhoneError = 'empty' | 'invalid-characters' | 'wrong-length' | 'not-a-japanese-number';

export const PHONE_ERROR_MESSAGES: Record<PhoneError, string> = {
  empty: 'Enter a phone number.',
  'invalid-characters':
    'Use digits only. Spaces, hyphens, dots, parentheses and a leading + are fine.',
  'wrong-length':
    'Japanese phone numbers with an area or service code have 10 or 11 digits including the leading 0.',
  'not-a-japanese-number': 'Only Japanese numbers are supported. Start with 0, +81 or 0081.',
};

export type PhoneKind = 'mobile' | 'ip-phone' | 'toll-free' | 'navi-dial' | 'landline';

export interface PhoneResult {
  /** The domestic digits, including the leading 0 (e.g. `09012345678`). Always present. */
  digits: string;
  /** Hyphenated domestic form, or `null` when the grouping cannot be determined confidently. */
  domestic: string | null;
  /** `+81` form (no leading 0), or `null` together with `domestic`. */
  international: string | null;
  kind: PhoneKind | null;
}

export type PhoneOutcome = { ok: true; value: PhoneResult } | { ok: false; error: PhoneError };

// Separators people type or paste. Hyphen-like: ‐ ‑ ‒ – — ― − ー (full-width forms fold via NFKC).
const SEPARATORS = /[\s().‐-―−ー-]/g;

// Yokohama, Nagoya, Kyoto, Kobe, Fukuoka: 3-digit area codes (local number 3+4 digits). Deliberately
// short: Japanese area codes run 2–5 digits and many 3-digit prefixes (042, 043, 048, 072 ...) are
// also the start of 4-digit codes, so grouping them would be a guess. Anything not listed is returned
// as plain digits. ponytail: a full area-code table would be needed to group every landline.
const THREE_DIGIT_AREA_CODES = new Set(['045', '052', '075', '078', '092']);

interface Pattern {
  kind: PhoneKind;
  groups: readonly number[];
}

function classify(digits: string): Pattern | null {
  const { length } = digits;
  const prefix3 = digits.slice(0, 3);
  const prefix4 = digits.slice(0, 4);
  if (length === 11) {
    if (prefix4 === '0800') return { kind: 'toll-free', groups: [4, 3, 4] }; // before 080 mobile
    if (['090', '080', '070'].includes(prefix3)) return { kind: 'mobile', groups: [3, 4, 4] };
    if (prefix3 === '050') return { kind: 'ip-phone', groups: [3, 4, 4] };
    return null;
  }
  if (prefix4 === '0120') return { kind: 'toll-free', groups: [4, 3, 3] };
  if (prefix4 === '0570') return { kind: 'navi-dial', groups: [4, 3, 3] };
  const prefix2 = digits.slice(0, 2);
  if (prefix2 === '03' || prefix2 === '06') return { kind: 'landline', groups: [2, 4, 4] };
  if (THREE_DIGIT_AREA_CODES.has(prefix3)) return { kind: 'landline', groups: [3, 3, 4] };
  return null;
}

function group(digits: string, sizes: readonly number[]): string {
  const parts: string[] = [];
  let at = 0;
  for (const size of sizes) {
    parts.push(digits.slice(at, at + size));
    at += size;
  }
  return parts.join('-');
}

/**
 * Normalizes a Japanese phone number and hyphenates it when the pattern is well known (mobile,
 * IP-phone, toll-free, navi-dial, and landlines in 03/06 and a short list of city codes). Accepts
 * full-width digits and `+81` / `0081` prefixes. It does not check that the number is in service, and
 * numbers it cannot group confidently are returned as plain digits with `domestic: null`.
 */
export function formatPhoneNumber(input: string): PhoneOutcome {
  let text = input.normalize('NFKC').replace(SEPARATORS, '');
  if (text === '') return { ok: false, error: 'empty' };

  let international = false;
  if (text.startsWith('+')) {
    if (!text.startsWith('+81')) return { ok: false, error: 'not-a-japanese-number' };
    international = true;
    text = text.slice(3);
  } else if (text.startsWith('0081')) {
    international = true;
    text = text.slice(4);
  }

  if (!/^\d*$/.test(text)) return { ok: false, error: 'invalid-characters' };
  // "+81 90 ..." and "+81 (0) 90 ..." both mean 090 ...; the international form drops the trunk 0.
  const national = international && !text.startsWith('0') ? `0${text}` : text;

  if (!national.startsWith('0') || national.length < 10 || national.length > 11) {
    return { ok: false, error: 'wrong-length' };
  }

  const pattern = classify(national);
  if (!pattern) {
    return {
      ok: true,
      value: { digits: national, domestic: null, international: null, kind: null },
    };
  }
  const domestic = group(national, pattern.groups);
  const [first = 0, ...rest] = pattern.groups;
  return {
    ok: true,
    value: {
      digits: national,
      domestic,
      international: `+81-${group(national.slice(1), [first - 1, ...rest])}`,
      kind: pattern.kind,
    },
  };
}
