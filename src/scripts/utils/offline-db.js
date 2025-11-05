// Menggunakan Vanilla IndexedDB agar sesuai dengan gaya proyek Anda

const DB_NAME = 'story-app-db';
const DB_VERSION = 1;
const OBJECT_STORE_NAME = 'pending_stories';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        // 'id' akan menjadi auto-incrementing primary key
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function addPendingStory(story) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    // 'story' harus berupa object { description, photo (File/Blob), lat, lon }
    const transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    const request = store.add(story);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllPendingStories() {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OBJECT_STORE_NAME], 'readonly');
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deletePendingStory(id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([OBJECT_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(OBJECT_STORE_NAME);
    // Kita harus mengonversi 'id' ke Number karena bisa jadi datang sebagai string dari dataset
    const request = store.delete(Number(id));

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}