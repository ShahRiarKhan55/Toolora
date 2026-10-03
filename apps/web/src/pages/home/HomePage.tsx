import { homeMeta } from '@toolora/shared';
import { PUBLIC_SITE_ORIGIN } from '../../lib/siteUrl';
import { useDocumentMeta } from '../../lib/useDocumentMeta';
import { CategoriesSection } from './CategoriesSection';
import { HeroSection } from './HeroSection';
import { PrinciplesSection } from './PrinciplesSection';
import { ToolsSection } from './ToolsSection';

export function HomePage() {
  useDocumentMeta(homeMeta(PUBLIC_SITE_ORIGIN));

  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <ToolsSection />
      <PrinciplesSection />
    </>
  );
}
