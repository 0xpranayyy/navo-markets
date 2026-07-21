import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import ErrorBoundary from './components/ErrorBoundary';
import { ThemeProvider } from './theme';
import { AuthProvider } from './auth/AuthProvider';
import { AppProvider } from './store/AppContext';
import { initPwaLayout } from './utils/pwa';
import App from './App';

initPwaLayout();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppProvider>
            <App />
          </AppProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
