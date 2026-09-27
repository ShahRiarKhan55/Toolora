import { useEffect } from 'react';

/**
 * Sets the document title and meta description while a route is mounted, restoring the previous
 * values on unmount. A stopgap for per-route SEO tags until the server injects them for crawlers
 * that do not run JavaScript (Phase 8) — see docs/architecture.md, "SEO strategy".
 */
export function useDocumentMeta(title: string, description: string): void {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute('content');
    meta?.setAttribute('content', description);

    return () => {
      document.title = previousTitle;
      if (previousDescription !== null && previousDescription !== undefined) {
        meta?.setAttribute('content', previousDescription);
      }
    };
  }, [title, description]);
}
