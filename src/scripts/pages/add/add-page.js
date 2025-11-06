import StoryApi from '../../data/api';
import { getUserToken } from '../../utils/auth';

import { addPendingStory } from '../../utils/offline-db';

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #latitude = null;
  #longitude = null;

  async render() {
    return `
      <section class="container add-story-page">
        <h1>Tambah Cerita Baru</h1>
        <form id="addStoryForm" class="add-story-form" novalidate>
          <div class="form-group">
            <label for="descriptionInput">Deskripsi</label>
            <textarea id="descriptionInput" name="description" rows="4" required></textarea>
            <div class="invalid-feedback">Deskripsi tidak boleh kosong.</div>
          </div>

          <div class="form-group">
            <label for="photoInput">Foto</label>
            <input type="file" id="photoInput" name="photo" accept="image/*" required>
            <div class="invalid-feedback">Foto tidak boleh kosong.</div>
            <img id="imagePreview" src="#" alt="Pratinjau Gambar" style="max-width: 100%; margin-top: 10px; display: none;" />
          </div>

          <div class="form-group">
            <label for="latitudeInput">Lokasi (Klik Peta untuk Memilih)</label>
            <div id="add-story-map"></div>
            <input type="hidden" id="latitudeInput" name="lat">
            <input type="hidden" id="longitudeInput" name="lon">
             <small>Latitude: <span id="lat-display">-</span>, Longitude: <span id="lon-display">-</span></small>
             <div id="location-error" class="invalid-feedback" style="display: none;">Lokasi harus dipilih.</div>
          </div>

          <button type="submit" id="submitButton">Kirim Cerita</button>
          <p id="loadingIndicator" style="display: none;">Mengirim...</p>
          <p id="successMessage" style="color: green; display: none;"></p>
          <p id="errorMessage" style="color: red; display: none;"></p>
        </form>
      </section>
    `;
  }

  async afterRender() {
    const token = getUserToken();
    if (!token) {
      window.location.hash = '#/login';
      return;
    }

    const descriptionInput = document.getElementById('descriptionInput');
    const photoInput = document.getElementById('photoInput');
    const imagePreview = document.getElementById('imagePreview');
    const latitudeInput = document.getElementById('latitudeInput');
    const longitudeInput = document.getElementById('longitudeInput');
    const latDisplay = document.getElementById('lat-display');
    const lonDisplay = document.getElementById('lon-display');
    const locationError = document.getElementById('location-error');
    const addStoryForm = document.getElementById('addStoryForm');
    const submitButton = document.getElementById('submitButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');

    photoInput.addEventListener('change', () => {
      const file = photoInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      } else {
         imagePreview.style.display = 'none';
      }
      this._validateInput(photoInput);
    });

    try {
      this.#map = L.map('add-story-map').setView([-2.5489, 118.0149], 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(this.#map);

      this.#map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        this.#latitude = lat;
        this.#longitude = lng;

        latitudeInput.value = lat;
        longitudeInput.value = lng;
        latDisplay.textContent = lat.toFixed(6);
        lonDisplay.textContent = lng.toFixed(6);
        locationError.style.display = 'none';

        if (this.#marker) {
          this.#map.removeLayer(this.#marker);
        }
        this.#marker = L.marker([lat, lng]).addTo(this.#map)
          .bindPopup("Lokasi cerita dipilih").openPopup();
         this.#map.setView([lat, lng], 13);
      });

    } catch(mapError) {
         console.error("Gagal inisialisasi map:", mapError);
         errorMessage.textContent = "Gagal memuat peta pemilihan lokasi.";
         errorMessage.style.display = 'block';
    }

    
    addStoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const isDescriptionValid = this._validateInput(descriptionInput);
      const isPhotoValid = this._validateInput(photoInput);
      const isLocationValid = this._validateLocation();

      if (!isDescriptionValid || !isPhotoValid || !isLocationValid) {
         errorMessage.textContent = 'Harap isi semua field yang wajib.';
         errorMessage.style.display = 'block';
        return;
      }

      const description = descriptionInput.value;
      const photo = photoInput.files[0]; 
      const lat = this.#latitude;
      const lon = this.#longitude;

      submitButton.disabled = true;
      loadingIndicator.style.display = 'block';
      successMessage.style.display = 'none';
      errorMessage.style.display = 'none';

      
      
      
      try {
        const formData = new FormData();
        formData.append('description', description);
        formData.append('photo', photo);
        formData.append('lat', lat);
        formData.append('lon', lon);

        const response = await StoryApi.addNewStory(token, formData);

        successMessage.textContent = response.message || 'Cerita berhasil ditambahkan!';
        successMessage.style.display = 'block';
        
        this._resetForm(addStoryForm, imagePreview, latDisplay, lonDisplay);
        
         setTimeout(() => {
             window.location.hash = '#/';
         }, 2000);

      } catch (error) {
        console.error('Add story failed:', error);
        
        
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          console.log('Gagal fetch (mungkin offline). Menyimpan cerita ke IndexedDB...');
          try {
            
            await addPendingStory({ description, photo, lat, lon });
            
            successMessage.textContent = 'Anda sedang offline. Cerita disimpan secara lokal dan akan diunggah saat kembali online.';
            successMessage.style.display = 'block';
            
            this._resetForm(addStoryForm, imagePreview, latDisplay, lonDisplay);
            
            setTimeout(() => {
               window.location.hash = '#/';
           }, 2000);

          } catch (dbError) {
            console.error('Gagal menyimpan ke IndexedDB:', dbError);
            errorMessage.textContent = `Gagal menyimpan cerita offline: ${dbError.message}`;
            errorMessage.style.display = 'block';
          }
        } else {
          
          errorMessage.textContent = `Gagal menambahkan cerita: ${error.message}`;
          errorMessage.style.display = 'block';
        }
        

      } finally {
        submitButton.disabled = false;
        loadingIndicator.style.display = 'none';
      }
    });

     descriptionInput.addEventListener('blur', () => this._validateInput(descriptionInput));
     photoInput.addEventListener('change', () => this._validateInput(photoInput));
  }

  
  _resetForm(form, imagePreview, latDisplay, lonDisplay) {
    form.reset();
    imagePreview.style.display = 'none';
    latDisplay.textContent = '-';
    lonDisplay.textContent = '-';
    if (this.#marker) {
         this.#map.removeLayer(this.#marker);
         this.#marker = null;
    }
    this.#latitude = null;
    this.#longitude = null;
  }

  
  _validateInput(inputElement) {
    let isValid = false;
    const feedbackElement = inputElement.parentElement.querySelector('.invalid-feedback');

    if (inputElement.type === 'file') {
      isValid = inputElement.files.length > 0;
    } else {
      isValid = inputElement.value.trim() !== '';
    }

    if (!isValid) {
      inputElement.classList.add('is-invalid');
      if (feedbackElement) feedbackElement.style.display = 'block';
    } else {
      inputElement.classList.remove('is-invalid');
      if (feedbackElement) feedbackElement.style.display = 'none';
    }
    return isValid;
  }

  _validateLocation() {
    const locationError = document.getElementById('location-error');
    const isValid = this.#latitude !== null && this.#longitude !== null;
     if (!isValid) {
        locationError.style.display = 'block';
     } else {
        locationError.style.display = 'none';
     }
     return isValid;
  }
}