import { CategoriesSection } from './CategoriesSection';
import { HeroSection } from './HeroSection';
import { PrinciplesSection } from './PrinciplesSection';
import { ToolsSection } from './ToolsSection';

export function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <ToolsSection />
      <PrinciplesSection />
    </>
  );
}
