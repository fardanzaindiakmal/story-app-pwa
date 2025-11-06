import StoryApi from '../../data/api';
import {
  addBookmarkStory,
  getBookmarkStoryById,
  deleteBookmarkStory
} from '../../utils/offline-db';
import { getUserToken, removeUserToken } from '../../utils/auth';
import { showFormattedDate } from '../../utils/index';

export default class HomePage {
  async render() {
    return `
      <section class="container home-page">
        <div class="story-list-container">
          <h1>Daftar Story</h1>
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

      const storyItemsHtml = await Promise.all(stories.map(async (story) => {
        if (story.lat && story.lon) {
          L.marker([story.lat, story.lon])
            .addTo(map)
            .bindPopup(`<b>${story.name}</b><br>${story.description.substring(0, 30)}...`);
        }
        return this._createStoryItemTemplate(story);
      }));

      storyListElement.innerHTML = storyItemsHtml.join('');

      this._addBookmarkButtonListeners(stories, storyListElement);

    } catch (error) {
      storyListElement.innerHTML = `<p>Error: ${error.message}. Gagal memuat data baru. Menampilkan data dari cache jika ada.</p>`;
      if (error.message.includes('Token') || error.message.includes('Auth') || error.message.includes('401')) {
        removeUserToken();
        window.location.hash = '#/login';
      }
    }
  }

  async _addBookmarkButtonListeners(stories, container) {
    const buttons = container.querySelectorAll('.bookmark-button');
    
    for (const button of buttons) {
      const storyId = button.dataset.id;
      const isBookmarked = await getBookmarkStoryById(storyId);
      this._updateBookmarkButtonUI(button, !!isBookmarked);
    }

    container.addEventListener('click', async (event) => {
      if (event.target.classList.contains('bookmark-button')) {
        const button = event.target;
        const storyId = button.dataset.id;
        const storyData = stories.find(story => story.id === storyId);

        if (!storyData) return;

        button.disabled = true;
        try {
          const isBookmarked = await getBookmarkStoryById(storyId);
          
          if (isBookmarked) {
            await deleteBookmarkStory(storyId);
            this._updateBookmarkButtonUI(button, false);
          } else {
            await addBookmarkStory(storyData);
            this._updateBookmarkButtonUI(button, true);
          }
        } catch (dbError) {
          console.error('Gagal memproses bookmark:', dbError);
          alert('Gagal menyimpan ke database.');
        } finally {
          button.disabled = false;
        }
      }
    });
  }

  _updateBookmarkButtonUI(button, isBookmarked) {
    if (isBookmarked) {
      button.textContent = 'Hapus Bookmark';
      button.style.backgroundColor = '#f8d7da';
      button.style.color = '#721c24';
    } else {
      button.textContent = 'Simpan (Bookmark)';
      button.style.backgroundColor = '#d4edda';
      button.style.color = '#155724';
    }
  }

  _createStoryItemTemplate(story) {
    return `
      <article class="story-item" data-id="${story.id}">
        <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}">
        <div class="story-item__content">
          <h3>${story.name}</h3>
          <p>${story.description}</p>
          <span class="story-date">
            Dibuat pada: ${showFormattedDate(story.createdAt)}
          </span>
          <div class="story-item__actions" style="margin-top: 10px;">
            <button class="bookmark-button" data-id="${story.id}" 
                    style="padding: 8px; width: 100%; cursor: pointer; border: none; border-radius: 4px;">
              Simpan (Bookmark)
            </button>
          </div>
        </div>
      </article>
    `;
  }
}