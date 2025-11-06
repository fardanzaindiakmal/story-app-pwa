import StoryApi from '../data/api';
import { getUserToken } from './auth';
import { getAllPendingStories, deletePendingStory } from './offline-db';


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
        
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', story.photo); 
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);

        
        await StoryApi.addNewStory(token, formData);
        
        
        await deletePendingStory(story.id);
        successCount++;
        console.log(`Cerita ID ${story.id} berhasil disinkronkan.`);

      } catch (uploadError) {
        console.error(`Gagal sinkronisasi cerita ID ${story.id}:`, uploadError.message);
        
        
      }
    }

    if (successCount > 0) {
      alert(`${successCount} cerita tertunda berhasil diunggah!`);
      
      if (window.location.hash === '#/offline') {
        window.location.reload();
      }
    }

  } catch (error) {
    console.error('Error saat proses sinkronisasi:', error);
  }
}

export function initSync() {
  
  window.addEventListener('online', () => {
    console.log('Koneksi kembali online! Menjalankan sinkronisasi...');
    syncPendingStories();
  });

  
  
  console.log('Inisialisasi Sync: Cek cerita tertunda...');
  syncPendingStories();
}