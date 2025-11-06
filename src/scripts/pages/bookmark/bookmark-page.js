import { getAllBookmarkStories, deleteBookmarkStory } from '../../utils/offline-db';
import { showFormattedDate } from '../../utils/index';

export default class BookmarkPage {
  #stories = [];
  #storyListElement = null;

  async render() {
    return `
      <section class="container" style="max-width: 800px; margin: 20px auto;">
        <h1>Cerita Tersimpan (Bookmark)</h1>
        <p>Cerita yang Anda simpan untuk dilihat kembali.</p>

        <div id="bookmark-story-list" class="story-list" style="margin-top: 20px;">
          <p>Memuat cerita tersimpan...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#storyListElement = document.getElementById('bookmark-story-list');
    
    try {
      this.#stories = await getAllBookmarkStories();
      this._renderList(this.#stories);
      this._addDeleteButtonListeners(); // Tambahkan listener untuk tombol hapus
    } catch (error) {
      console.error('Gagal memuat bookmark:', error);
      this.#storyListElement.innerHTML = '<p>Gagal memuat cerita tersimpan.</p>';
    }
  }

  _renderList(stories) {
    this.#storyListElement.innerHTML = '';
    if (stories.length === 0) {
      this.#storyListElement.innerHTML = '<p>Belum ada cerita yang Anda simpan.</p>';
      return;
    }

    stories.forEach(story => {
      this.#storyListElement.innerHTML += this._createStoryItemTemplate(story);
    });
  }

  _addDeleteButtonListeners() {
    this.#storyListElement.addEventListener('click', async (event) => {
      if (event.target.classList.contains('delete-bookmark-button')) {
        const button = event.target;
        const storyId = button.dataset.id;
        
        button.disabled = true;
        button.textContent = 'Menghapus...';

        try {
          await deleteBookmarkStory(storyId);
          
          // Hapus item dari DOM
          const storyItemElement = button.closest('.story-item');
          storyItemElement.remove();

          // Perbarui array internal
          this.#stories = this.#stories.filter(story => story.id !== storyId);

          // Tampilkan pesan jika daftar menjadi kosong
          if (this.#stories.length === 0) {
            this._renderList([]);
          }

        } catch (error) {
          console.error('Gagal menghapus bookmark:', error);
          alert('Gagal menghapus bookmark.');
          button.disabled = false;
          button.textContent = 'Hapus Bookmark';
        }
      }
    });
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
            <button class="delete-bookmark-button" data-id="${story.id}" 
                    style="padding: 8px; width: 100%; cursor: pointer; border: none; border-radius: 4px; background-color: #f8d7da; color: #721c24;">
              Hapus Bookmark
            </button>
          </div>

        </div>
      </article>
    `;
  }
}