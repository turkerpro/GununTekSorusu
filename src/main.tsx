/// <reference types="vite-plugin-pwa/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './ThemeContext.tsx';
import { AuthProvider } from './AuthContext.tsx';

// PWA Service Worker Otomatik Güncelleme Mekanizması
// Yeni bir versiyon yüklendiğinde sayfayı otomatik yeniler.
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    // Yeni sürüm bulunduğunda hemen kabul et ve sayfayı yenile
    updateSW(true);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
