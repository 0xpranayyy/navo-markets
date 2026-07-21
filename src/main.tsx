import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './theme';
import { AuthProvider } from './auth/AuthProvider';
import { AppProvider } from './store/AppContext';
import { initPwaLayout } from './utils/pwa';
import App from './App';
import PwaViewportFix from './components/PwaViewportFix';

initPwaLayout();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <div className="navo-root-fill">
    <React.StrictMode>
      <ErrorBoundary>
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <PwaViewportFix />
              <App />
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </React.StrictMode>
  </div>,
);
