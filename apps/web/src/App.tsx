import { SiteLayout } from './components/layout/SiteLayout';
import { HomePage } from './pages/home/HomePage';

// One route for now. Phase 3 adds tool routing; until then there is nothing else to navigate to.
export function App() {
  return (
    <SiteLayout>
      <HomePage />
    </SiteLayout>
  );
}
