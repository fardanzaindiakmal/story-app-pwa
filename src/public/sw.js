// --- LOGIKA PWA CACHING (Kriteria 3) - DIPERBAIKI ---

// Nama Cache (Versi dinaikkan ke v2 untuk memicu pembaruan)
const APP_SHELL_CACHE_NAME = 'app-shell-v2';
const DYNAMIC_CACHE_NAME = 'dynamic-data-v2';

// URL API
const API_BASE_URL = 'https://story-api.dicoding.dev/v1';

// Daftar Aset untuk App Shell
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/images/logo.png',
  '/app.bundle.js', // <-- Baris ini sudah benar
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
];

// 1. Peristiwa 'install': Menyimpan App Shell ke cache
self.addEventListener('install', (event) => {
  console.log('Service Worker: Menginstal v2...');
  event.waitUntil(
    caches.open(APP_SHELL_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => self.skipWaiting())
      .catch((error) => {
        console.error('Gagal caching App Shell:', error);
      })
  );
});

// 2. Peristiwa 'activate': Membersihkan cache lama
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Mengaktifkan v2...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== APP_SHELL_CACHE_NAME && name !== DYNAMIC_CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Peristiwa 'fetch': Menerapkan strategi caching
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- REVISI DI BARIS BERIKUT ---
  // Strategi 1: Network First, falling back to Cache (untuk API)
  if (url.href.startsWith(API_BASE_URL)) {
    // PERBAIKAN: Hanya cache request 'GET'. Lewati 'POST', 'DELETE', dll.
    if (event.request.method !== 'GET') {
      event.respondWith(fetch(event.request));
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            return caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
              // PERBAIKAN: Kembalikan respons setelah di-cache
              return networkResponse;
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Jika network gagal (offline), coba ambil dari cache
          console.log('Service Worker: Network gagal, mengambil dari cache untuk:', url.pathname);
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategi 2: Cache First, falling back to Network (untuk App Shell & Aset lainnya)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then(
        (networkResponse) => {
           if (networkResponse && networkResponse.ok) {
                return caches.open(APP_SHELL_CACHE_NAME).then((cache) => {
                   if (url.origin === self.origin) { 
                       cache.put(event.request, networkResponse.clone());
                   }
                   // PERBAIKAN: Kembalikan respons setelah di-cache
                   return networkResponse;
                });
           }
           return networkResponse;
        }
      ).catch(() => {
         console.warn('Service Worker: Aset gagal diambil:', event.request.url);
         // PERBAIKAN: Kembalikan respons 'undefined' (atau fallback) agar tidak crash
         // Dalam kasus ini, kita tidak mengembalikan apa-apa, yang valid untuk 'fetch'.
      });
    })
  );
});


// --- LOGIKA PUSH NOTIFICATION (Kriteria 2 - Tidak Berubah) ---

self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Diterima.');
  let pushData;
  try {
    pushData = event.data.json();
  } catch (e) {
    pushData = {
      title: 'Notifikasi Baru',
      body: 'Ada konten baru untuk Anda.',
      icon: 'favicon.png',
      data: { url: '#/' }
    };
  }
  const notificationTitle = pushData.title || 'Notifikasi Baru';
  const notificationOptions = {
    body: pushData.body || 'Ada pesan baru.',
    icon: pushData.icon || 'favicon.png',
    badge: 'favicon.png',
    data: {
      url: pushData.data?.url || '#/'
    },
    actions: [
      { 
        action: 'explore-action',
        title: 'Lihat Sekarang'
      }
    ]
  };
  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notifikasi diklik.');
  event.notification.close();
  const urlToOpen = event.notification.data.url || '#/';
  if (event.action === 'explore-action') {
    event.waitUntil(clients.openWindow(urlToOpen));
  } else {
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});