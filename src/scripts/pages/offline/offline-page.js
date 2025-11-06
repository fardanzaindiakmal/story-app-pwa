import { getAllPendingStories, deletePendingStory } from '../../utils/offline-db';
import { showFormattedDate } from '../../utils/index'; 
import { syncPendingStories } from '../../utils/offline-sync'; 

export default class OfflinePage {
  #stories = []; 

  async render() {
    return `
      <section class="container" style="max-width: 800px; margin: 20px auto;">
        <h2>Cerita Tertunda</h2>
        <p>Cerita ini disimpan secara lokal dan akan diunggah saat Anda kembali online.</p>

        <div class="form-group" style="margin-block: 20px;">
          <label for="searchInput">Cari Cerita Tertunda</label>
          <input type="search" id="searchInput" class="form-group" placeholder="Cari berdasarkan deskripsi...">
        </div>

        <button id="syncButton" class="auth-form button" style="padding: 10px 15px; width: 100%; margin-bottom: 20px; background-color: #d4edda; color: #155724; border: none; cursor: pointer;">
          Sinkronkan Cerita Tertunda
        </button>
        <div id="pending-story-list" class="story-list">
          <p>Memuat cerita tertunda...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storyListElement = document.getElementById('pending-story-list');
    const searchInput = document.getElementById('searchInput');
    const syncButton = document.getElementById('syncButton'); 

    
    try {
      this.#stories = await getAllPendingStories();
      this._renderList(this.#stories, storyListElement);
    } catch (error) {
      console.error('Gagal memuat cerita tertunda:', error);
      storyListElement.innerHTML = '<p>Gagal memuat cerita tertunda.</p>';
    }

    
    searchInput.addEventListener('input', (event) => {
      const query = event.target.value.toLowerCase();
      const filteredStories = this.#stories.filter(story =>
        story.description.toLowerCase().includes(query)
      );
      this._renderList(filteredStories, storyListElement);
    });

    
    syncButton.addEventListener('click', async (event) => {
      event.target.disabled = true;
      event.target.textContent = 'Menyinkronkan...';

      try {
        await syncPendingStories();
        
        this.#stories = await getAllPendingStories();
        this._renderList(this.#stories, storyListElement);
      } catch (error) {
        console.error('Manual sync failed:', error);
        alert('Gagal melakukan sinkronisasi manual.');
      } finally {
        event.target.disabled = false;
        event.target.textContent = 'Sinkronkan Cerita Tertunda';
      }
    });
    
  }

  _renderList(stories, container) {
    container.innerHTML = '';
    if (stories.length === 0) {
      container.innerHTML = '<p>Tidak ada cerita tertunda.</p>';
      return;
    }

    stories.forEach(story => {
      
      const photoUrl = URL.createObjectURL(story.photo);
      container.innerHTML += `
        <article class="story-item" data-id="${story.id}">
          <img src="${photoUrl}" alt="Pratinjau Foto" style="filter: grayscale(80%);">
          <div class="story-item__content">
            <h3>(Tertunda) ${story.description.substring(0, 40)}...</h3>
            <p>${story.description}</p>
            <span class="story-date">
              Disimpan pada: ${showFormattedDate(story.id)}
            </span>
            
            <button class="delete-button" data-id="${story.id}" 
                    style="background: #f8d7da; color: #721c24; border: none; padding: 8px; margin-top: 10px; cursor: pointer; border-radius: 4px;">
              Hapus
            </button>
          </div>
        </article>
      `;
    });

    
    
    container.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        const storyId = event.target.dataset.id;
        
        if (confirm('Anda yakin ingin menghapus cerita tertunda ini?')) {
          try {
            await deletePendingStory(storyId);
            
            this.#stories = await getAllPendingStories();
            this._renderList(this.#stories, container);
          } catch (error) {
            console.error('Gagal menghapus cerita:', error);
            alert('Gagal menghapus cerita.');
          }
        }
      });
    });

    
    container.querySelectorAll('img').forEach(img => {
      img.onload = () => URL.revokeObjectURL(img.src);
    });
  }
}