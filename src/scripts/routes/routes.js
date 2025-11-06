import HomePage from '../pages/home/home-page';
import NotificationPage from '../pages/Notification/notification-page';
import AddPage from '../pages/add/add-page';
import LoginPage from '../login/login-page';
import RegisterPage from '../register/register-page';
import OfflinePage from '../pages/offline/offline-page'; 
import BookmarkPage from '../pages/bookmark/bookmark-page';

const routes = {
  '/': HomePage,
  '/login': LoginPage,
  '/register': RegisterPage,
  '/add': AddPage,
  '/offline': OfflinePage, 
  '/bookmark': BookmarkPage,
  '/notification': NotificationPage, 
};

export default routes;