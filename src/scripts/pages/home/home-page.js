import StoryApi from '../../data/api';
// PERBAIKAN: Tambahkan 'removeUserToken' ke import
import { getUserToken, removeUserToken } from '../../utils/auth'; 
import { showFormattedDate } from '../../utils/index';

export default class HomePage {
  async render() {
    return `
      <section class="container home-page">
        <div class="story-list-container">
          <h2>Daftar Story</h2>
          <div id="story-list" class="story-list">
            <p>Memuat cerita...</p>
          </div>
        </div>

        <div class="map-container">
          <h2>Lokasi Story</h2>
          <div id="story-map"></div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const token = getUserToken();
    if (!token) {
      window.location.hash = '#/login';
      return;
    }

    const storyListElement = document.getElementById('story-list');
    
    const map = L.map('story-map').setView([-2.5489, 118.0149], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    try {
      const stories = await StoryApi.getAllStories(token);
      
      storyListElement.innerHTML = '';

      if (stories.length === 0) {
        storyListElement.innerHTML = '<p>Belum ada cerita yang dibagikan.</p>';
        return;
      }

      stories.forEach(story => {
        storyListElement.innerHTML += this._createStoryItemTemplate(story);

        if (story.lat && story.lon) {
          L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 30)}...`);
        }
      });

    } catch (error) {
      // Tampilkan pesan error (ini normal saat offline)
      storyListElement.innerHTML = `<p>Error: ${error.message}. Gagal memuat data baru. Menampilkan data dari cache jika ada.</p>`;
      
      // --- REVISI DI BLOK IF BERIKUT ---
      // HANYA logout jika errornya spesifik tentang Token, Auth, atau 401.
      // JANGAN logout jika errornya "Failed to fetch stories" (karena itu error offline)
      if (error.message.includes('Token') || error.message.includes('Auth') || error.message.includes('401')) {
        
        removeUserToken();
        window.location.hash = '#/login';
      }
      // --- AKHIR REVISI ---
    }
  }

  _createStoryItemTemplate(story) {
    return `
      <article class="story-item">
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}">
        <div class="story-item__content">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <span class="story-date">
            Dibuat pada: ${showFormattedDate(story.createdAt)}
          </span>
        </div>
      </article>
    `;
  }
}