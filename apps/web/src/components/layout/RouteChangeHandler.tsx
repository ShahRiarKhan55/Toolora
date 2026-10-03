import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Client-side navigation does not reset scroll or move focus the way a page load does, so a keyboard
 * or screen-reader user would stay on the old link. On a pathname change, scroll to the top and focus
 * <main> (tabIndex -1, see SiteLayout). Query-string-only changes (search/filter) are left alone.
 */
export function RouteChangeHandler() {
  const { pathname } = useLocation();
  const previous = useRef(pathname);

  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);

  return null;
}
