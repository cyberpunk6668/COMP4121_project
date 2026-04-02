import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import 'leaflet/dist/leaflet.css';
import App from './App';
import { LanguageProvider, useLanguage } from './i18n';
import './styles.css';

function RootApp() {
  const { antdLocale } = useLanguage();

  return (
    <ConfigProvider
      locale={antdLocale}
      theme={{
        token: {
          colorPrimary: '#ff7a00',
          borderRadius: 14,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
        }
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <RootApp />
    </LanguageProvider>
  </React.StrictMode>
);
