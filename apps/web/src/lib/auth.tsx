import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { AuthContext, AuthError } from './authContext';
import type { AuthState, AuthUser } from './authContext';

// The session lives in an HttpOnly cookie the browser attaches itself: no token is ever read,
// stored or sent from JavaScript, only the user (id, email) the server reports.
async function call(path: string, body?: unknown): Promise<AuthUser | null> {
  let res: Response;
  try {
    res = await fetch(`/api/auth/${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new AuthError('Could not reach the server. Check your connection and try again.');
  }
  const data = (await res.json().catch(() => null)) as {
    user?: AuthUser | null;
    error?: { message?: string };
  } | null;
  if (!res.ok) throw new AuthError(data?.error?.message ?? 'Something went wrong. Try again.');
  return data?.user ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState['status']>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    void call('session')
      .catch(() => null)
      .then((current) => {
        if (!active) return;
        setUser(current);
        setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await call('login', { email, password }));
  }, []);
  const register = useCallback(async (email: string, password: string) => {
    setUser(await call('register', { email, password }));
  }, []);
  const signOut = useCallback(async () => {
    await call('logout', {});
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ status, user, signIn, register, signOut }),
    [status, user, signIn, register, signOut],
  );
  return <AuthContext value={value}>{children}</AuthContext>;
}
