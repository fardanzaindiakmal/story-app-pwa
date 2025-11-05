import CONFIG from '../config';

const API_ENDPOINTS = {
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,
  GET_ALL_STORIES: `${CONFIG.BASE_URL}/stories`,
  ADD_NEW_STORY: `${CONFIG.BASE_URL}/stories`,
  // Tambahkan endpoint baru untuk notifikasi
  NOTIFICATIONS: `${CONFIG.BASE_URL}/notifications/subscribe`,
};

class StoryApi {
  static async register({ name, email, password }) {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }

  static async login({ email, password }) {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    if (!responseJson.loginResult) {
        throw new Error('Login response missing loginResult');
    }
    return responseJson.loginResult;
  }

  static async getAllStories(token) {
    if (!token) {
        throw new Error('Authentication token is missing.');
    }
    const response = await fetch(`${API_ENDPOINTS.GET_ALL_STORIES}?location=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error("Fetch stories failed:", response.status, errorBody);
        throw new Error(`Failed to fetch stories: ${response.statusText} (${response.status})`);
    }

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
     if (!responseJson.listStory) {
        throw new Error('API response missing listStory');
     }
    return responseJson.listStory;
  }

  static async addNewStory(token, formData) {
    if (!token) {
        throw new Error('Authentication token is missing.');
    }

    if (!(formData instanceof FormData)) {
        throw new Error('Invalid data format. FormData expected.');
    }

    const response = await fetch(API_ENDPOINTS.ADD_NEW_STORY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
        let errorMessage = `Failed to add story: ${response.statusText} (${response.status})`;
        try {
            const errorJson = await response.json();
            if (errorJson.message) {
                errorMessage = errorJson.message;
            }
        } catch(e) {
             try {
                 const errorBody = await response.text();
             } catch(textError) {
                  console.error("Could not read error body as text");
             }
        }
        throw new Error(errorMessage);
    }

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }

  // == METHOD BARU UNTUK PUSH NOTIFICATION (DIREVISI) ==

  /**
   * Mengirim data langganan push notification ke server.
   * @param {string} token - Token autentikasi pengguna.
   * @param {PushSubscription} subscription - Objek subscription dari PushManager.
   */
  static async subscribePush(token, subscription) {
    if (!token) {
      throw new Error('Authentication token is missing.');
    }

    // --- REVISI DIMULAI DI SINI ---
    // 1. Ubah objek PushSubscription menjadi objek JSON biasa
    const subscriptionJson = subscription.toJSON();

    // 2. Buat objek baru yang "bersih" HANYA dengan properti yang diizinkan API
    // (endpoint dan keys). Ini akan membuang "expirationTime" secara otomatis.
    const sanitizedSubscription = {
      endpoint: subscriptionJson.endpoint,
      keys: subscriptionJson.keys,
    };
    // --- REVISI SELESAI ---

    const response = await fetch(API_ENDPOINTS.NOTIFICATIONS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      // 3. Kirim objek yang sudah bersih (bukan 'subscription' asli)
      body: JSON.stringify(sanitizedSubscription),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }

  /**
   * Memberitahu server untuk menghapus langganan push notification.
   * @param {string} token - Token autentikasi pengguna.
   * @param {string} endpoint - Endpoint URL dari subscription yang akan dihapus.
   */
  static async unsubscribePush(token, endpoint) {
    if (!token) {
      throw new Error('Authentication token is missing.');
    }

    const response = await fetch(API_ENDPOINTS.NOTIFICATIONS, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    const responseJson = await response.json();
    if (responseJson.error) {
      throw new Error(responseJson.message);
    }
    return responseJson;
  }
}

export default StoryApi;