import StoryApi from '../data/api';

export default class RegisterPage {
  async render() {
    return `
      <section class="container">
        <h1>Buat Akun Baru</h1>
        <form id="registerForm" class="auth-form" novalidate>
          <div class="form-group">
            <label for="nameInput">Nama</label>
            <input type="text" id="nameInput" name="name" required>
          </div>
          <div class="form-group">
            <label for="emailInput">Email</label>
            <input type="email" id="emailInput" name="email" required>
          </div>
          <div class="form-group">
            <label for="passwordInput">Password</label>
            <input type="password" id="passwordInput" name="password" minlength="8" required>
          </div>
          <button type="submit">Daftar</button>
          <p id="success-message" style="color: green;"></p>
          <p id="error-message" style="color: red;"></p>
        </form>
        <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
      </section>
    `;
  }

  async afterRender() {
    const registerForm = document.getElementById('registerForm');
    const successMessage = document.getElementById('success-message');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      successMessage.textContent = '';
      errorMessage.textContent = '';

      const name = event.target.name.value;
      const email = event.target.email.value;
      const password = event.target.password.value;

      if (!name || !email || !password) {
        errorMessage.textContent = 'Semua field harus diisi.';
        return;
      }
      if (password.length < 8) {
        errorMessage.textContent = 'Password minimal 8 karakter.';
        return;
      }

      try {
        const response = await StoryApi.register({ name, email, password });
        successMessage.textContent = `${response.message}! Silakan login.`;
        registerForm.reset();
        setTimeout(() => {
             window.location.hash = '#/login';
        }, 2000);

      } catch (error) {
        errorMessage.textContent = `Registrasi Gagal: ${error.message}`;
      }
    });
  }
}