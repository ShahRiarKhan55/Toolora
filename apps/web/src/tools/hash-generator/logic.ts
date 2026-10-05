export const HASH_ALGORITHMS = ['SHA-256', 'SHA-384', 'SHA-512'] as const;
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number];

/** Lowercase hexadecimal digest of the UTF-8 bytes of `text`, computed by the browser's Web Crypto API. */
export async function hashText(text: string, algorithm: HashAlgorithm): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Web Crypto is not available');
  const digest = await subtle.digest(algorithm, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function hashAll(text: string): Promise<Record<HashAlgorithm, string>> {
  const digests = await Promise.all(HASH_ALGORITHMS.map((algorithm) => hashText(text, algorithm)));
  return Object.fromEntries(
    HASH_ALGORITHMS.map((algorithm, i) => [algorithm, digests[i]!]),
  ) as Record<HashAlgorithm, string>;
}
