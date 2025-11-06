import '../styles/styles.css';
import App from './pages/app';
import { initPushNotification } from './utils/push-notification';
import { initSync } from './utils/offline-sync'; 

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    
    content: document.getElementById('main-content'),
    drawerButton: document.getElementById('drawer-button'),
    navigationDrawer: document.getElementById('navigation-drawer'),
  });
  
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  
  await initPushNotification();
  
  
  initSync(); 
});