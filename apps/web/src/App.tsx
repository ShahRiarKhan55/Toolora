import { Route, Routes, useLocation } from 'react-router-dom';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { RouteChangeHandler } from './components/layout/RouteChangeHandler';
import { SiteLayout } from './components/layout/SiteLayout';
import { AccountPage } from './pages/account/AccountPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ContactPage } from './pages/legal/ContactPage';
import { PrivacyPage } from './pages/legal/PrivacyPage';
import { HomePage } from './pages/home/HomePage';
import { AllToolsPage } from './pages/tools/AllToolsPage';
import { ToolsSlugRoute } from './pages/tools/ToolsSlugRoute';

export function App() {
  const { pathname } = useLocation();
  return (
    <SiteLayout>
      <RouteChangeHandler />
      {/* Keyed by path so a failed page does not keep the error screen after navigating away. */}
      <ErrorBoundary key={pathname}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/tools" element={<AllToolsPage />} />
          <Route path="/tools/:param" element={<ToolsSlugRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </ErrorBoundary>
    </SiteLayout>
  );
}
