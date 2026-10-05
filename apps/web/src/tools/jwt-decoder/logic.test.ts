import { describe, expect, it } from 'vitest';
import { decodeJwt } from './logic';

// The widely published jwt.io example token (HS256, secret "your-256-bit-secret"): not sensitive.
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const bytesToB64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const b64url = (text: string) => bytesToB64url(new TextEncoder().encode(text));
const token = (header: unknown, payload: unknown, signature = 'sig') =>
  `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}.${signature}`;

function decode(input: string, now?: number) {
  const outcome = decodeJwt(input, now);
  if (!outcome.ok) throw new Error(`unexpected error ${outcome.error}`);
  return outcome.value;
}
const errorOf = (input: string) => {
  const outcome = decodeJwt(input);
  return outcome.ok ? null : outcome.error;
};

describe('decodeJwt — valid tokens', () => {
  it('decodes the well-known sample token', () => {
    const jwt = decode(SAMPLE);
    expect(jwt.header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(jwt.payload).toEqual({ sub: '1234567890', name: 'John Doe', iat: 1516239022 });
    expect(jwt.signature).toBe('SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
    expect(jwt.headerJson).toBe('{\n  "alg": "HS256",\n  "typ": "JWT"\n}');
  });

  it('lists the registered claims that are present, in a fixed order', () => {
    const jwt = decode(SAMPLE);
    expect(jwt.claims.map((c) => c.claim)).toEqual(['sub', 'iat']);
    expect(jwt.claims[0]).toMatchObject({ description: 'Subject', value: '1234567890' });
    expect(jwt.claims[1]).toMatchObject({
      value: '1516239022',
      date: '2018-01-18 01:30:22 UTC',
    });
  });

  it('shows every registered claim, including array and object values', () => {
    const jwt = decode(
      token(
        { alg: 'none' },
        {
          jti: 'id-1',
          aud: ['a', 'b'],
          iss: 'https://issuer',
          sub: 'u',
          exp: 2000000000,
          nbf: 1000000000,
          iat: 1500000000,
          extra: 1,
        },
      ),
      1_700_000_000_000,
    );
    expect(jwt.claims.map((c) => c.claim)).toEqual([
      'iss',
      'sub',
      'aud',
      'exp',
      'nbf',
      'iat',
      'jti',
    ]);
    expect(jwt.claims.find((c) => c.claim === 'aud')?.value).toBe('["a","b"]');
    expect(jwt.claims.find((c) => c.claim === 'iss')?.value).toBe('https://issuer');
    expect(jwt.claims.find((c) => c.claim === 'exp')?.timing).toMatch(/not yet expired/);
    expect(jwt.claims.find((c) => c.claim === 'nbf')?.timing).toMatch(/token is active/);
    expect(jwt.claims.find((c) => c.claim === 'iat')?.timing).toBeUndefined();
  });

  it('reports an expired token against the supplied time', () => {
    const jwt = decode(token({ alg: 'HS256' }, { exp: 1000 }), 5_000_000);
    expect(jwt.claims[0]?.timing).toMatch(/expired/);
  });

  it('handles a payload with no registered claims', () => {
    const jwt = decode(token({ alg: 'HS256' }, { name: 'x' }));
    expect(jwt.claims).toEqual([]);
  });

  it('keeps non-date values of date claims readable without crashing', () => {
    const jwt = decode(token({ alg: 'HS256' }, { exp: 'soon', nbf: 1e20, iat: null }));
    expect(jwt.claims.map((c) => [c.claim, c.value, c.date])).toEqual([
      ['exp', 'soon', undefined],
      ['nbf', '100000000000000000000', undefined],
      ['iat', 'null', undefined],
    ]);
  });

  it('decodes Unicode payloads as UTF-8', () => {
    const jwt = decode(token({ alg: 'HS256' }, { name: '山田 太郎 😀', sub: 'ü' }));
    expect(jwt.payload).toEqual({ name: '山田 太郎 😀', sub: 'ü' });
    expect(jwt.claims[0]?.value).toBe('ü');
  });

  it('accepts an empty signature (unsecured token)', () => {
    expect(decode(token({ alg: 'none' }, { a: 1 }, '')).signature).toBe('');
  });

  it('accepts a Bearer prefix, whitespace and line wrapping', () => {
    expect(decode(`Bearer ${SAMPLE}`).header).toEqual({ alg: 'HS256', typ: 'JWT' });
    expect(decode(`  ${SAMPLE.slice(0, 40)}\n${SAMPLE.slice(40)}  `).payload).toMatchObject({
      sub: '1234567890',
    });
  });

  it('handles a large but reasonable payload', () => {
    const claims = Object.fromEntries(
      Array.from({ length: 2000 }, (_, i) => [`claim${i}`, `value ${i}`]),
    );
    const jwt = decode(token({ alg: 'HS256' }, claims));
    expect(Object.keys(jwt.payload)).toHaveLength(2000);
  });
});

describe('decodeJwt — invalid tokens', () => {
  it('rejects empty input', () => {
    expect(errorOf('')).toBe('empty');
    expect(errorOf('  \n ')).toBe('empty');
    expect(errorOf('Bearer')).toBe('empty');
  });

  it('rejects the wrong number of segments', () => {
    expect(errorOf('abc')).toBe('segments');
    expect(errorOf('a.b')).toBe('segments');
    expect(errorOf('a.b.c.d')).toBe('segments');
    expect(errorOf('a.b.c.d.e')).toBe('segments'); // a JWE, not a signed JWT
    expect(errorOf('..sig')).toBe('segments');
  });

  it('rejects characters that are not Base64URL', () => {
    expect(errorOf('he+der.payload.sig')).toBe('invalid-base64url');
    expect(errorOf('aGVsbG8=.bm8.sig')).toBe('invalid-base64url'); // padding "=" is not accepted mid-token
    expect(errorOf(`${b64url('{"a":1}')}.${b64url('{"a":1}')}.si*g`)).toBe('invalid-base64url');
    expect(errorOf('a.b.c')).toBe('invalid-base64url'); // a 1-character part is impossible
    expect(errorOf(`${b64url('{"a":1}')}=.${b64url('{"a":1}')}.sig`)).toBe('invalid-base64url'); // JWTs are unpadded
  });

  it('rejects text that is not JSON', () => {
    expect(errorOf(`${b64url('hello')}.${b64url('{"a":1}')}.sig`)).toBe('invalid-json');
    expect(errorOf(`${b64url('{"a":1}')}.${b64url('{broken')}.sig`)).toBe('invalid-json');
  });

  it('rejects JSON that is not an object', () => {
    expect(errorOf(`${b64url('[1]')}.${b64url('{"a":1}')}.sig`)).toBe('not-object');
    expect(errorOf(`${b64url('{"a":1}')}.${b64url('"text"')}.sig`)).toBe('not-object');
    expect(errorOf(`${b64url('null')}.${b64url('{"a":1}')}.sig`)).toBe('not-object');
  });

  it('rejects bytes that are not UTF-8', () => {
    // 0xFF 0xFE is never valid UTF-8.
    expect(errorOf(`${bytesToB64url(new Uint8Array([0xff, 0xfe]))}.${b64url('{"a":1}')}.sig`)).toBe(
      'invalid-utf8',
    );
  });

  it('never throws on arbitrary garbage', () => {
    for (const junk of ['....', '%%%.%%%.%%%', '{"alg":"none"}', '🙂.🙂.🙂', 'a'.repeat(10_000)]) {
      expect(() => decodeJwt(junk)).not.toThrow();
    }
  });
});
