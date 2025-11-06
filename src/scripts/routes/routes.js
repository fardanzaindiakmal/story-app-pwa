import HomePage from '../pages/home/home-page';

import NotificationPage from '../pages/notification/notification-page'; 
import AddPage from '../pages/add/add-page';
import LoginPage from '../login/login-page';
import RegisterPage from '../register/register-page';
import OfflinePage from '../pages/offline/offline-page'; 

const routes = {
  '/': HomePage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add': AddPage,
  '/offline': OfflinePage, 
  
  '/notification': NotificationPage, 
};

export default routes;