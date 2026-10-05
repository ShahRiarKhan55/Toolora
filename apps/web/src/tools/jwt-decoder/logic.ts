export type JwtError =
  'empty' | 'segments' | 'invalid-base64url' | 'invalid-utf8' | 'invalid-json' | 'not-object';

export const JWT_ERROR_MESSAGES: Record<JwtError, string> = {
  empty: 'Paste a JWT to decode.',
  segments:
    'A signed JWT has exactly three parts separated by dots (header.payload.signature). This does not.',
  'invalid-base64url':
    'One part is not valid Base64URL (it may only use A–Z, a–z, 0–9, "-" and "_").',
  'invalid-utf8': 'One part decodes to bytes that are not valid UTF-8 text.',
  'invalid-json': 'The header or payload is not valid JSON.',
  'not-object': 'The header and payload must each be a JSON object.',
};

export const REGISTERED_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'] as const;
export type RegisteredClaim = (typeof REGISTERED_CLAIMS)[number];

export const CLAIM_DESCRIPTIONS: Record<RegisteredClaim, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expiration time',
  nbf: 'Not before',
  iat: 'Issued at',
  jti: 'JWT ID',
};

export interface ClaimRow {
  claim: RegisteredClaim;
  description: string;
  /** The claim's JSON value as text (strings unquoted for readability). */
  value: string;
  /** For exp / nbf / iat holding a valid number: the date in UTC. */
  date?: string;
  /** For exp / nbf: how the date compares with `now`. Not a validity check. */
  timing?: string;
}

export interface DecodedJwt {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  headerJson: string;
  payloadJson: string;
  /** The signature segment exactly as written (Base64URL); empty for unsecured tokens. */
  signature: string;
  claims: ClaimRow[];
}

export type JwtOutcome = { ok: true; value: DecodedJwt } | { ok: false; error: JwtError };

const BASE64URL = /^[A-Za-z0-9_-]*$/;

function decodeSegment(
  segment: string,
): { ok: true; text: string } | { ok: false; error: JwtError } {
  // A Base64 string can never be 1 character more than a multiple of 4.
  if (!BASE64URL.test(segment) || segment.length % 4 === 1) {
    return { ok: false, error: 'invalid-base64url' };
  }
  const base64 = segment
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(segment.length / 4) * 4, '=');
  try {
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
    return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: 'invalid-utf8' };
  }
}

function parseObject(
  text: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: JwtError } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: 'invalid-json' };
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'not-object' };
  }
  return { ok: true, value: parsed as Record<string, unknown> };
}

function describeTiming(claim: 'exp' | 'nbf', seconds: number, now: number): string {
  const passed = seconds * 1000 <= now;
  if (claim === 'exp')
    return passed
      ? 'Already past (expired by your device clock)'
      : 'In the future (not yet expired)';
  return passed ? 'Already past (token is active)' : 'In the future (token not yet active)';
}

function claimRows(payload: Record<string, unknown>, now: number): ClaimRow[] {
  return REGISTERED_CLAIMS.flatMap((claim) => {
    if (!Object.hasOwn(payload, claim)) return [];
    const raw = payload[claim];
    const row: ClaimRow = {
      claim,
      description: CLAIM_DESCRIPTIONS[claim],
      value: typeof raw === 'string' ? raw : JSON.stringify(raw),
    };
    if ((claim === 'exp' || claim === 'nbf' || claim === 'iat') && typeof raw === 'number') {
      const date = new Date(raw * 1000);
      if (Number.isFinite(date.getTime())) {
        row.date = date
          .toISOString()
          .replace('T', ' ')
          .replace(/(\.000)?Z$/, ' UTC');
        if (claim !== 'iat') row.timing = describeTiming(claim, raw, now);
      }
    }
    return [row];
  });
}

/**
 * Decodes (never verifies) a JWT: splits it into its three dot-separated parts, Base64URL-decodes the
 * header and payload as UTF-8 JSON objects, and lists the registered claims that are present. The
 * signature is returned as written and is NOT checked. `now` is injectable for tests.
 */
export function decodeJwt(input: string, now: number = Date.now()): JwtOutcome {
  // Tokens are often pasted from an `Authorization: Bearer …` header or wrapped across lines.
  const token = input.replace(/\s+/g, '').replace(/^bearer/i, '');
  if (token === '') return { ok: false, error: 'empty' };

  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] === '' || parts[1] === '')
    return { ok: false, error: 'segments' };
  const [headerPart, payloadPart, signature] = parts as [string, string, string];

  const headerText = decodeSegment(headerPart);
  if (!headerText.ok) return headerText;
  const payloadText = decodeSegment(payloadPart);
  if (!payloadText.ok) return payloadText;
  if (!BASE64URL.test(signature) || signature.length % 4 === 1) {
    return { ok: false, error: 'invalid-base64url' };
  }

  const header = parseObject(headerText.text);
  if (!header.ok) return header;
  const payload = parseObject(payloadText.text);
  if (!payload.ok) return payload;

  return {
    ok: true,
    value: {
      header: header.value,
      payload: payload.value,
      headerJson: JSON.stringify(header.value, null, 2),
      payloadJson: JSON.stringify(payload.value, null, 2),
      signature,
      claims: claimRows(payload.value, now),
    },
  };
}
