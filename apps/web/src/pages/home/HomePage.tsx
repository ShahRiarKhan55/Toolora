import { buildWebSiteStructuredData, HOME_ROUTE, SITE_NAME } from '@toolora/shared';
import { PUBLIC_SITE_ORIGIN } from '../../lib/siteUrl';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { CategoriesSection } from './CategoriesSection';
import { HeroSection } from './HeroSection';
import { PrinciplesSection } from './PrinciplesSection';
import { ToolsSection } from './ToolsSection';

export function HomePage() {
  // Kept in sync with index.html's static title/description by hand: that copy is the
  // crawler-visible fallback before JavaScript runs, this is the same content applied once it has
  // (see docs/architecture.md, "SEO strategy").
  useDocumentMeta({
    title: `${SITE_NAME} – Simple online tools for everyday tasks`,
    description:
      'Toolora is a collection of simple online tools for Japan-related tasks, students and developers. Tools are built to run in your browser.',
    path: HOME_ROUTE,
    structuredData: buildWebSiteStructuredData(PUBLIC_SITE_ORIGIN),
  });

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <ToolsSection />
      <PrinciplesSection />
    </>
  );
}
