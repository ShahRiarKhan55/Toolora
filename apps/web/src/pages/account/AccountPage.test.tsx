import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Header } from '../../components/layout/Header';
import { AuthProvider } from '../../lib/auth';
import { AccountPage } from './AccountPage';

const json = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

/** A fake server holding one session flag, enough to drive the real provider and page. */
function fakeApi(opts: { signedIn?: boolean } = {}) {
  let user: { id: string; email: string } | null = opts.signedIn
    ? { id: 'u1', email: 'me@example.test' }
    : null;
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    if (url === '/api/auth/session') return json(200, { user });
    const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as {
      email: string;
      password: string;
    };
    if (url === '/api/auth/logout') {
      user = null;
      return json(200, { user: null });
    }
    if (body.password === 'wrong password') {
      return json(401, {
        error: { code: 'invalid_credentials', message: 'Incorrect email or password.' },
      });
    }
    user = { id: 'u1', email: body.email };
    return json(url.endsWith('register') ? 201 : 200, { user });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Header />
        <AccountPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('AccountPage', () => {
  it('shows the sign-in form to a signed-out visitor, with one h1 and the header link "Sign in"', async () => {
    fakeApi();
    renderPage();
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Account' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Sign in' }).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('type', 'email');
    expect(screen.getByLabelText(/Password/)).toHaveAttribute('type', 'password');
  });

  it('creates an account and then shows the signed-in state', async () => {
    const fetchMock = fakeApi();
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'Create a new account' }));
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'me@example.test' } });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'a long enough pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByText('me@example.test')).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls.find(([u]) => u.endsWith('register'))!;
    expect(url).toBe('/api/auth/register');
    expect(init?.credentials).toBe('same-origin');
    expect(screen.getAllByRole('link', { name: 'Account' }).length).toBeGreaterThan(0);
  });

  it('announces a failed sign-in and stays signed out', async () => {
    fakeApi();
    renderPage();
    fireEvent.change(await screen.findByLabelText(/Email/), {
      target: { value: 'me@example.test' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), { target: { value: 'wrong password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password.');
    expect(screen.queryByText(/Signed in as/)).not.toBeInTheDocument();
  });

  it('restores an existing session on load and signs out', async () => {
    fakeApi({ signedIn: true });
    renderPage();
    expect(await screen.findByText('me@example.test')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(await screen.findByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('falls back to signed out when the server cannot be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('network'))),
    );
    renderPage();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument(),
    );
  });

  it('never writes anything to browser storage', async () => {
    fakeApi();
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    renderPage();
    fireEvent.change(await screen.findByLabelText(/Email/), {
      target: { value: 'me@example.test' },
    });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'a long enough pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('me@example.test');
    expect(setItem).not.toHaveBeenCalled();
  });

  it('moves focus to the new state after signing in and out, but not on first load', async () => {
    fakeApi({ signedIn: true });
    renderPage();
    const signedIn = await screen.findByText(/Signed in as/);
    expect(signedIn).not.toHaveFocus();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    const heading = await screen.findByRole('heading', { level: 2, name: 'Sign in' });
    await waitFor(() => expect(heading).toHaveFocus());
    fireEvent.change(screen.getByLabelText(/Email/), { target: { value: 'me@example.test' } });
    fireEvent.change(screen.getByLabelText(/Password/), {
      target: { value: 'a long enough pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    const again = await screen.findByText(/Signed in as/);
    await waitFor(() => expect(again).toHaveFocus());
  });

  it('reserves but hides the header account link until the session check answers', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>(() => undefined)),
    );
    renderPage();
    // Tailwind CSS is not loaded in jsdom, so assert the class that does the hiding.
    const link = screen.getAllByText('Sign in', { selector: 'a' })[0]!;
    expect(link.closest('li')).toHaveClass('invisible');
  });
});
