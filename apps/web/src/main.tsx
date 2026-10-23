import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './context/AuthContext';
import { I18nProvider } from './i18n';
import { FeedbackProvider } from './context/FeedbackContext';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <I18nProvider>
          <FeedbackProvider>
            <App />
          </FeedbackProvider>
        </I18nProvider>
      </AuthProvider>
    </React.StrictMode>
  );
}
