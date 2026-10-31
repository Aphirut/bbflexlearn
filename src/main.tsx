import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register Service Worker with auto-update and offline caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[PWA] New content available, auto-updating...');
  },
  onOfflineReady() {
    console.log('[PWA] BB FlexLearn is ready for offline operation');
  },
});

createRoot(document.getElementById('root')!).render(<App />);
