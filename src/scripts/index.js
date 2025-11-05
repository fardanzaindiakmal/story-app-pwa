import '../styles/styles.css';
import App from './pages/app';
import { initPushNotification } from './utils/push-notification';
import { initSync } from './utils/offline-sync'; // <-- TAMBAHKAN IMPORT INI

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    // ... (properti app tetap sama)
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    navigationDrawer: document.getElementById('navigation-drawer'),
  });
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Inisialisasi Push Notification
  await initPushNotification();
  
  // Inisialisasi Sync (Kriteria 4 Advanced)
  initSync(); // <-- TAMBAHKAN BARIS INI (tidak perlu 'await' krn async)
});