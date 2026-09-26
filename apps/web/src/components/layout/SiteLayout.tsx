import type { ReactNode } from 'react';
import { Footer } from './Footer';
import { Header } from './Header';

/**
 * The application shell: skip link, header, the page's single <main>, footer. Pages render their
 * content as children and must not add another <main>.
 */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-primary focus:px-4 focus:py-2 focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <Header />
      {/* tabIndex -1 lets the skip link move focus here; the outline is hidden because <main> is not a control. */}
      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>
      <Footer />
    </div>
  );
}
