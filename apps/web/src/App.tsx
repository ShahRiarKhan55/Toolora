import { Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/SiteLayout';
import { NotFoundPage } from './pages/NotFoundPage';
import { HomePage } from './pages/home/HomePage';
import { AllToolsPage } from './pages/tools/AllToolsPage';
import { ToolsSlugRoute } from './pages/tools/ToolsSlugRoute';

export function App() {
  return (
    <SiteLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tools" element={<AllToolsPage />} />
        <Route path="/tools/:param" element={<ToolsSlugRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </SiteLayout>
  );
}
