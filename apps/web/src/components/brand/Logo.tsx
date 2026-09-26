import { cx } from '../../lib/cx';

// Same mark as public/favicon.svg. Text plus inline SVG only: no image assets to load.
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <path d="M8 9h16v4h-6v11h-4V13H8z" className="fill-primary-foreground" />
    </svg>
  );
}

/** The Toolora wordmark, linking to the home page. Its accessible name is "Toolora". */
export function Logo({ className }: { className?: string }) {
  return (
    <a
      href="/"
      className={cx(
        'inline-flex items-center gap-2.5 rounded-control text-xl font-bold tracking-tight text-foreground',
        className,
      )}
    >
      <LogoMark className="size-8 shrink-0" />
      {/* Two-tone lockup, split by hand: the two spans read as one word. */}
      <span>
        Tool<span className="text-primary">ora</span>
      </span>
    </a>
  );
}
