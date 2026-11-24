import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './components/Auth.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { installImageFallback } from './utils/imageFallback.ts';
import './index.css';

installImageFallback();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
