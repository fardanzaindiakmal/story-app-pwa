import StoryApi from '../data/api';
import { getUserToken } from './auth';
import { getAllPendingStories, deletePendingStory } from './offline-db';

// --- REVISI DI SINI (TAMBAHKAN 'export') ---
export async function syncPendingStories() {
  const token = getUserToken();
  if (!token) {
    console.log('Sync dihentikan: Pengguna tidak login.');
    return;
  }

  console.log('Memulai sinkronisasi cerita tertunda...');
  try {
    const pendingStories = await getAllPendingStories();
    if (pendingStories.length === 0) {
      console.log('Tidak ada cerita untuk disinkronkan.');
      return;
    }

    console.log(`Menemukan ${pendingStories.length} cerita tertunda. Mengunggah...`);

    let successCount = 0;
    for (const story of pendingStories) {
      try {
        // Rekonstruksi FormData dari data IndexedDB
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', story.photo); // 'photo' disimpan sebagai File/Blob
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);

        // Kirim ke API
        await StoryApi.addNewStory(token, formData);
        
        // Jika berhasil, hapus dari IndexedDB
        await deletePendingStory(story.id);
        successCount++;
        console.log(`Cerita ID ${story.id} berhasil disinkronkan.`);

      } catch (uploadError) {
        console.error(`Gagal sinkronisasi cerita ID ${story.id}:`, uploadError.message);
        // Jika gagal (misal: error validasi dari server), biarkan di DB untuk dicoba lagi nanti
        // atau Anda bisa menambah logika untuk menandai 'gagal'
      }
    }

    if (successCount > 0) {
      alert(`${successCount} cerita tertunda berhasil diunggah!`);
      // Refresh halaman jika kita ada di halaman offline untuk melihat perubahan
      if (window.location.hash === '#/offline') {
        window.location.reload();
      }
    }

  } catch (error) {
    console.error('Error saat proses sinkronisasi:', error);
  }
}

export function initSync() {
  // Tambahkan listener untuk 'online' (saat beralih dari offline ke online)
  window.addEventListener('online', () => {
    console.log('Koneksi kembali online! Menjalankan sinkronisasi...');
    syncPendingStories();
  });

  // Panggil sync sekali saat aplikasi dimuat, 
  // untuk menangani cerita yang tertunda dari sesi sebelumnya.
  console.log('Inisialisasi Sync: Cek cerita tertunda...');
  syncPendingStories();
}