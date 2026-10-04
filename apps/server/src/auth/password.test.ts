import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', hash)).toBe(true);
    expect(await verifyPassword('correct horse batterz', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('salts: the same password hashes differently each time, and never contains the password', async () => {
    const [a, b] = await Promise.all([
      hashPassword('same password!'),
      hashPassword('same password!'),
    ]);
    expect(a).not.toBe(b);
    expect(a).toMatch(/^scrypt\$65536\$8\$1\$/);
    expect(a).not.toContain('same password!');
  });

  it('treats full-width and half-width forms of a password as the same (NFKC)', async () => {
    const hash = await hashPassword('ｐａｓｓｗｏｒｄ１２３');
    expect(await verifyPassword('password123', hash)).toBe(true);
  });

  it('handles Unicode passwords', async () => {
    const hash = await hashPassword('パスワード🔑です');
    expect(await verifyPassword('パスワード🔑です', hash)).toBe(true);
  });

  it.each([
    '',
    'garbage',
    'bcrypt$10$a$b',
    'scrypt$65536$8$1$',
    'scrypt$x$8$1$c2FsdA==$aGFzaA==',
    'scrypt$999999999$8$1$c2FsdA==$aGFzaA==',
  ])('rejects a malformed stored hash %j without throwing', async (stored) => {
    expect(await verifyPassword('anything', stored)).toBe(false);
  });
});

describe('hashing backlog cap', () => {
  it('refuses work beyond a small backlog instead of queueing without limit, then recovers', async () => {
    const results = await Promise.allSettled(
      Array.from({ length: 30 }, () => verifyPassword('x', 'scrypt$65536$8$1$c2FsdA==$aGFzaA==')),
    );
    const refused = results.filter(
      (r) => r.status === 'rejected' && (r.reason as { status?: number }).status === 503,
    );
    expect(refused.length).toBeGreaterThan(0);
    expect(refused.length).toBeLessThan(30);
    // Slots are released once the burst drains.
    expect(await verifyPassword('x', await hashPassword('x'))).toBe(true);
  });
});
