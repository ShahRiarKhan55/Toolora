import { ACCOUNT_META } from '@toolora/shared';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, Ref } from 'react';
import { Container } from '../../components/layout/Container';
import { PageHeader } from '../../components/layout/PageHeader';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { AuthError, useAuth } from '../../lib/authContext';
import { useDocumentMeta } from '../../lib/useDocumentMeta';

type Mode = 'signin' | 'register';

function AccountForm({ headingRef }: { headingRef: Ref<HTMLHeadingElement> }) {
  const { signIn, register } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const registering = mode === 'register';

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await (registering ? register : signIn)(email, password);
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  }

  return (
    <Card className="mt-8 max-w-md">
      <h2 ref={headingRef} tabIndex={-1} className="text-xl font-semibold focus:outline-none">
        {registering ? 'Create an account' : 'Sign in'}
      </h2>
      <form onSubmit={(event) => void onSubmit(event)} className="mt-4 space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete={registering ? 'new-password' : 'current-password'}
          required
          hint={
            registering ? 'At least 10 characters. A few words in a row works well.' : undefined
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" disabled={busy} className="w-full">
          {busy
            ? registering
              ? 'Creating account…'
              : 'Signing in…'
            : registering
              ? 'Create account'
              : 'Sign in'}
        </Button>
      </form>
      <Button
        variant="ghost"
        className="mt-3 w-full"
        onClick={() => {
          setMode(registering ? 'signin' : 'register');
          setError(null);
        }}
      >
        {registering ? 'I already have an account' : 'Create a new account'}
      </Button>
    </Card>
  );
}

export function AccountPage() {
  useDocumentMeta(ACCOUNT_META);
  const { status, user, signOut } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const focusRef = useRef<HTMLElement>(null);
  const settled = useRef<{ user: typeof user } | null>(null);

  // Signing in or out swaps the form for the signed-in card (or back), unmounting the focused
  // control. Move focus to the new state's first element so keyboard and screen-reader users land
  // on it; the first session check on load must not steal focus.
  useEffect(() => {
    if (status !== 'ready') return;
    if (settled.current && settled.current.user !== user) focusRef.current?.focus();
    settled.current = { user };
  }, [status, user]);

  return (
    <Container className="py-12">
      <PageHeader
        title="Account"
        description="Accounts are optional. Every tool works without one."
      />
      {status === 'loading' && (
        <p role="status" className="mt-8 text-muted-foreground">
          Checking your session…
        </p>
      )}
      {status === 'ready' && user === null && (
        <AccountForm headingRef={focusRef as Ref<HTMLHeadingElement>} />
      )}
      {status === 'ready' && user !== null && (
        <Card className="mt-8 max-w-md">
          <p
            ref={focusRef as Ref<HTMLParagraphElement>}
            tabIndex={-1}
            className="focus:outline-none"
          >
            Signed in as <strong>{user.email}</strong>.
          </p>
          {error && (
            <Alert tone="error" className="mt-4">
              {error}
            </Alert>
          )}
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => {
              setError(null);
              signOut().catch((err: unknown) =>
                setError(err instanceof AuthError ? err.message : 'Could not sign out. Try again.'),
              );
            }}
          >
            Sign out
          </Button>
        </Card>
      )}
    </Container>
  );
}
