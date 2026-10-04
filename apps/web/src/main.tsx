import { StrictMode } from 'react';
import { ACCOUNTS_ENABLED } from '@toolora/shared';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found in index.html');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider enabled={ACCOUNTS_ENABLED}>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
