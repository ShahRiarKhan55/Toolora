import { useEffect, useId, useRef, useState } from 'react';
import { ACCOUNT_ROUTE } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { PRIMARY_NAV } from '../../config/navigation';
import { Logo } from '../brand/Logo';
import { CloseIcon, MenuIcon, SearchIcon } from '../ui/icons';
import { Container } from './Container';
import { HeaderSearchPanel } from './HeaderSearch';

function NavList({ layout, onNavigate }: { layout: 'bar' | 'menu'; onNavigate?: () => void }) {
  const { enabled, status, user } = useAuth();
  return (
    <ul className={layout === 'bar' ? 'flex items-center gap-1' : 'flex flex-col py-2'}>
      {PRIMARY_NAV.map((item) => (
        <li key={item.href}>
          <Link
            to={item.href}
            onClick={onNavigate}
            className={
              layout === 'bar'
                ? 'rounded-control px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                : 'flex min-h-11 items-center rounded-control px-3 text-base font-medium hover:bg-surface-muted'
            }
          >
            {item.label}
          </Link>
        </li>
      ))}
      {/* Always laid out so the nav does not shift when the session check answers; hidden until then. */}
      {enabled && (
        <li className={status === 'ready' ? undefined : 'invisible'}>
          <Link
            to={ACCOUNT_ROUTE}
            onClick={onNavigate}
            className={
              layout === 'bar'
                ? 'rounded-control px-3 py-2 text-sm font-semibold hover:bg-surface-muted'
                : 'flex min-h-11 items-center rounded-control px-3 text-base font-semibold hover:bg-surface-muted'
            }
          >
            {user ? 'Account' : 'Sign in'}
          </Link>
        </li>
      )}
    </ul>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const searchToggleRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuId = useId();
  const searchId = useId();
  const anyOpen = menuOpen || searchOpen;

  // While the mobile menu or the search panel is open: Escape closes it (and returns focus to its
  // button), and so does a press anywhere outside the header. The page is never scroll-locked:
  // neither is a modal.
  useEffect(() => {
    if (!anyOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setSearchOpen(false);
        (menuOpen ? toggleRef : searchToggleRef).current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node && headerRef.current?.contains(event.target))) {
        setMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [anyOpen, menuOpen]);

  // Opening the search panel puts the cursor in the box.
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden lg:block">
          <NavList layout="bar" />
        </nav>
        <div className="flex items-center gap-2">
          <button
            ref={searchToggleRef}
            type="button"
            aria-label="Search tools"
            aria-expanded={searchOpen}
            aria-controls={searchId}
            onClick={() => {
              setSearchOpen((open) => !open);
              setMenuOpen(false);
            }}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-control border border-border-strong px-3 text-sm font-semibold hover:bg-surface-muted"
          >
            {searchOpen ? <CloseIcon /> : <SearchIcon />}
            <span aria-hidden="true" className="hidden sm:inline">
              Search
            </span>
          </button>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => {
              setMenuOpen((open) => !open);
              setSearchOpen(false);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-strong px-3 text-sm font-semibold hover:bg-surface-muted lg:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
            Menu
          </button>
        </div>
      </Container>
      <HeaderSearchPanel
        id={searchId}
        open={searchOpen}
        inputRef={searchInputRef}
        onDone={() => setSearchOpen(false)}
      />
      <nav
        id={menuId}
        aria-label="Mobile"
        hidden={!menuOpen}
        className="border-t border-border lg:hidden"
      >
        <Container>
          <NavList layout="menu" onNavigate={() => setMenuOpen(false)} />
        </Container>
      </nav>
    </header>
  );
}
