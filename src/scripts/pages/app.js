import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';
import { getUserToken, removeUserToken } from '../utils/auth';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #isTransitioning = false; 

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this._setupDrawer();
    this._setupLogoutButton();
    this._updateNavUI();
  }

  _setupDrawer() {
    this.#drawerButton.addEventListener('click', (event) => {
      event.stopPropagation();
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        this.#navigationDrawer.classList.contains('open') &&
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }
    });

    this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        this.#navigationDrawer.classList.remove('open');
      });
    });

    document.addEventListener('keydown', (event) => {
      if (
        event.key === 'Escape' &&
        this.#navigationDrawer.classList.contains('open')
      ) {
        this.#navigationDrawer.classList.remove('open');
        this.#drawerButton.focus();
      }
    });
  }

  _setupLogoutButton() {
    const logoutButton = document.querySelector('#nav-logout a');
    logoutButton.addEventListener('click', (event) => {
      event.preventDefault();
      removeUserToken();
      this._updateNavUI();
      window.location.hash = '#/login';
    });
  }

  _updateNavUI() {
    const isLoggedIn = !!getUserToken();
    const navAddStory = document.querySelector('#nav-add-story');
    const navLogin = document.querySelector('#nav-login');
    const navLogout = document.querySelector('#nav-logout');

    navAddStory.style.display = isLoggedIn ? 'list-item' : 'none';
    navLogin.style.display = isLoggedIn ? 'none' : 'list-item';
    navLogout.style.display = isLoggedIn ? 'list-item' : 'none';
  }

  async renderPage() {
    
    if (this.#isTransitioning) { 
      return; 
    } 

    const url = getActiveRoute() || '/';
    const PageClass = routes[url];

    if (!PageClass) {
      console.error(`Page for route ${url} not found.`);
      window.location.hash = '#/';
      return;
    }

    const page = new PageClass();

    try {
      this.#isTransitioning = true; 

      if (!document.startViewTransition) {
        this.#content.innerHTML = await page.render();
      } else {
        await document.startViewTransition(async () => {
          this.#content.innerHTML = await page.render();
        }).ready;
      }

      await page.afterRender();
    } catch (error) {
      console.error('Error rendering page:', error);
      this.#content.innerHTML = `<p>Terjadi kesalahan saat memuat halaman. Coba lagi nanti.</p>`;
      if (error.message.includes('Token') || error.message.includes('Auth')) {
        removeUserToken();
        window.location.hash = '#/login';
      }
    } finally {
      
      
      this.#isTransitioning = false; 
    }

    this._updateNavUI();
  }
}

export default App;