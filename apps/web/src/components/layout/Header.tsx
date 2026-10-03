import { useEffect, useId, useRef, useState } from 'react';
import { ACCOUNT_ROUTE } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/authContext';
import { PRIMARY_NAV } from '../../config/navigation';
import { Logo } from '../brand/Logo';
import { CloseIcon, MenuIcon } from '../ui/icons';
import { Container } from './Container';

function NavList({ layout, onNavigate }: { layout: 'bar' | 'menu'; onNavigate?: () => void }) {
  const { status, user } = useAuth();
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
      {status === 'ready' && (
        <li>
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
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  // While the mobile menu is open: Escape closes it (and returns focus to its button), and so does
  // a press anywhere outside the header. The page is never scroll-locked: the menu is not a modal.
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node && headerRef.current?.contains(event.target))) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [menuOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-border bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <NavList layout="bar" />
        </nav>
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-border-strong px-3 text-sm font-semibold hover:bg-surface-muted md:hidden"
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
          Menu
        </button>
      </Container>
      <nav
        id={menuId}
        aria-label="Mobile"
        hidden={!menuOpen}
        className="border-t border-border md:hidden"
      >
        <Container>
          <NavList layout="menu" onNavigate={() => setMenuOpen(false)} />
        </Container>
      </nav>
    </header>
  );
}
