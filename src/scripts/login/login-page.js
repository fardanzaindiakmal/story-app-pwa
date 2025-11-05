import StoryApi from '../data/api';
import { saveUserToken } from '../utils/auth';
export default class LoginPage {
  async render() {
    return `
      <section class="container">
        <h2>Login Akun</h2>
        <form id="loginForm" class="auth-form" novalidate>
          <div class="form-group">
            <label for="emailInput">Email</label>
            <input type="email" id="emailInput" name="email" required>
          </div>
          <div class="form-group">
            <label for="passwordInput">Password</label>
            <input type="password" id="passwordInput" name="password" required>
          </div>
          <button type="submit">Login</button>
          <p id="error-message" style="color: red;"></p>
        </form>
        <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorMessage.textContent = '';

      const email = event.target.email.value;
      const password = event.target.password.value;

      if (!email || !password) {
        errorMessage.textContent = 'Email dan password tidak boleh kosong.';
        return;
      }

      try {
        const loginResult = await StoryApi.login({ email, password });
        saveUserToken(loginResult.token);
        window.location.hash = '#/';
      } catch (error) {
        console.error('Login failed:', error);
        errorMessage.textContent = `Login Gagal: ${error.message}`;
      }
    });
  }
}