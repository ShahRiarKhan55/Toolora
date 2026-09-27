import { SITE_NAME, SITE_TAGLINE } from '@toolora/shared';
import { Link } from 'react-router-dom';
import { ALL_TOOLS_HREF, CATEGORY_NAV } from '../../config/navigation';
import { Logo } from '../brand/Logo';
import { Container } from './Container';

const linkStyles = 'text-muted-foreground underline-offset-2 hover:text-foreground hover:underline';

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-muted-foreground">{SITE_TAGLINE}</p>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Toolora has no accounts. Its tools are built to work in your browser, so what you type
            into them is not sent to a server.
          </p>
        </div>
        <nav aria-label="Footer categories">
          <h2 className="text-sm font-semibold">Categories</h2>
          <ul className="mt-3 space-y-2">
            {CATEGORY_NAV.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className={linkStyles}>
                  {item.label} Tools
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Footer site">
          <h2 className="text-sm font-semibold">Toolora</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to="/" className={linkStyles}>
                Home
              </Link>
            </li>
            <li>
              <Link to={ALL_TOOLS_HREF} className={linkStyles}>
                All Tools
              </Link>
            </li>
          </ul>
        </nav>
      </Container>
      <div className="border-t border-border">
        <Container className="py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} {SITE_NAME}
        </Container>
      </div>
    </footer>
  );
}
