import { createContext, useContext } from 'react';

export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthState {
  /** False while accounts are closed to the public (see ACCOUNTS_ENABLED): no sign-in entry points. */
  enabled: boolean;
  /** `loading` until the first session check answers; the page never guesses signed-in or out. */
  status: 'loading' | 'ready';
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/** An error whose message came from the API and is meant for the user. */
export class AuthError extends Error {}

const unavailable = () => Promise.reject(new AuthError('Accounts are not available here.'));

// Without a provider (isolated component tests) everyone is simply signed out.
export const AuthContext = createContext<AuthState>({
  enabled: true,
  status: 'ready',
  user: null,
  signIn: unavailable,
  register: unavailable,
  signOut: unavailable,
});

export const useAuth = () => useContext(AuthContext);
