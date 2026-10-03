import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert } from '../ui/Alert';
import { Button } from '../ui/Button';
import { Container } from './Container';

interface State {
  failed: boolean;
}

/**
 * Last line of defence for a render error or a lazy tool chunk that fails to load (offline, stale
 * deploy): without it React unmounts the whole tree and the user sees a blank page. The header and
 * footer live outside it, so navigation still works. Remounted per route via `key` (see App).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // Browser console only: nothing is sent anywhere (see CLAUDE.md, "Privacy principles").
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (!this.state.failed) return this.props.children;
    return (
      <Container className="py-16">
        <Alert tone="error" title="Something went wrong">
          This page could not be displayed. Reloading usually fixes it.
        </Alert>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </Container>
    );
  }
}
