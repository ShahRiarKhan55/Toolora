import { afterEach, describe, expect, it, vi } from 'vitest';
import { hashAll, hashText } from './logic';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('hashText — known vectors (FIPS 180-4 / NIST)', () => {
  it('SHA-256', async () => {
    expect(await hashText('abc', 'SHA-256')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(await hashText('', 'SHA-256')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('SHA-384', async () => {
    expect(await hashText('abc', 'SHA-384')).toBe(
      'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7',
    );
  });

  it('SHA-512', async () => {
    expect(await hashText('abc', 'SHA-512')).toBe(
      'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f',
    );
  });
});

describe('hashText — behaviour', () => {
  it('hashes the UTF-8 bytes of Unicode text (vectors from an independent implementation)', async () => {
    const vectors: [string, string][] = [
      ['日本語のテキスト', 'd4192d3b01dfa9f5b08388f13e5c7492e3cfdc5611bf8c77784dc97523f03efb'],
      ['café', '850f7dc43910ff890f8879c0ed26fe697c93a067ad93a7d50f466a7028a9bf4e'],
      ['😀 emoji', 'c5db20e64d86b693d8e312b379cfdd211311f63f3743831e6f4139344b39d762'],
      ['line\r\nbreak\n', '1e1486066c221c8d972402b5ffc1d74a4341e0f6a171239fed9ca45b6efc1685'],
    ];
    for (const [text, expected] of vectors) {
      expect(await hashText(text, 'SHA-256')).toBe(expected);
    }
  });

  it('is deterministic and sensitive to a single character', async () => {
    const a = await hashText('hello', 'SHA-256');
    expect(await hashText('hello', 'SHA-256')).toBe(a);
    expect(await hashText('hellp', 'SHA-256')).not.toBe(a);
    expect(await hashText('hello ', 'SHA-256')).not.toBe(a);
  });

  it('returns 64, 96 and 128 lowercase hex characters', async () => {
    const all = await hashAll('x');
    expect(all['SHA-256']).toMatch(/^[0-9a-f]{64}$/);
    expect(all['SHA-384']).toMatch(/^[0-9a-f]{96}$/);
    expect(all['SHA-512']).toMatch(/^[0-9a-f]{128}$/);
  });

  it('handles a large input', async () => {
    const text = 'a'.repeat(1_000_000);
    expect(await hashText(text, 'SHA-256')).toBe(
      'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
    );
  });

  it('rejects when Web Crypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined);
    await expect(hashText('abc', 'SHA-256')).rejects.toThrow(/not available/);
  });
});
