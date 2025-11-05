import { getSubscriptionState, subscribePush, unsubscribePush } from '../../utils/push-notification';
export default class NotificationPage {
  async render() {
    return `
      <section class="container add-story-page">
        <div style="margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; text-align: center;">
          <h4>Pengaturan Notifikasi</h4>
          <button id="notificationToggle" class="auth-form button" style="padding: 10px 15px; width: auto;">
            Mengambil status...
          </button>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const toggleButton = document.getElementById('notificationToggle');
    if (!('Notification' in window) || !('PushManager' in window)) {
       toggleButton.textContent = 'Notifikasi Tidak Didukung';
       toggleButton.disabled = true;
       return;
    }

    // Cek status awal saat halaman dimuat
    let isSubscribed = false;
    try {
        isSubscribed = await getSubscriptionState();
        this._updateToggleButtonUI(toggleButton, isSubscribed);
    } catch (error) {
        console.error('Gagal mendapatkan status langganan:', error);
        toggleButton.textContent = 'Error';
    }

    // Tambahkan event listener
    toggleButton.addEventListener('click', async () => {
      toggleButton.disabled = true;
      toggleButton.textContent = 'Memproses...';

      try {
        if (isSubscribed) {
          await unsubscribePush();
          isSubscribed = false;
        } else {
          await subscribePush();
          isSubscribed = true;
        }
      } catch (error) {
          console.error('Gagal mengubah status notifikasi:', error);
      }
      
      this._updateToggleButtonUI(toggleButton, isSubscribed);
      toggleButton.disabled = false;
    });
  }

  // Fungsi helper untuk update UI tombol
  _updateToggleButtonUI(button, isSubscribed) {
     if (isSubscribed) {
        button.textContent = 'Nonaktifkan Notifikasi';
        button.style.backgroundColor = '#f8d7da'; // Merah muda
        button.style.color = '#721c24';
     } else {
        button.textContent = 'Aktifkan Notifikasi';
        button.style.backgroundColor = '#d4edda'; // Hijau muda
        button.style.color = '#155724';
     }
  }
}