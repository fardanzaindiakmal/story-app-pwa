import StoryApi from '../data/api';
import { getUserToken } from './auth';

// VAPID Public Key dari dokumentasi API
const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

// Fungsi helper untuk mengubah VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Fungsi untuk mendaftarkan Service Worker
async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker tidak didukung di browser ini.');
    return;
  }

  try {
    // Perhatikan path '/sw.js'. Pastikan sw.js ada di root (level yg sama dgn index.html)
    // Jika Anda menggunakan build tool seperti Webpack, path ini mungkin perlu disesuaikan.
    // Berdasarkan struktur Anda, '/sw.js' seharusnya benar.
    const registration = await navigator.serviceWorker.register('/sw.js'); 
    console.log('Service Worker berhasil didaftarkan:', registration);
  } catch (error) {
    console.error('Gagal mendaftarkan Service Worker:', error);
  }
}

// Fungsi untuk meminta izin notifikasi
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.error('Browser ini tidak mendukung notifikasi desktop.');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    console.warn('Izin notifikasi ditolak.');
  } else if (permission === 'default') {
    console.warn('Izin notifikasi ditutup (default).');
  }
}

// Fungsi utama untuk inisialisasi (dipanggil oleh index.js)
export async function initPushNotification() {
  await registerServiceWorker();
  await requestNotificationPermission();
}

// Fungsi untuk memeriksa status langganan (dipakai di about-page.js)
export async function getSubscriptionState() {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription; // Mengembalikan true jika ada, false jika tidak
}

// Fungsi untuk subscribe (dipakai di about-page.js)
export async function subscribePush() {
  const token = getUserToken();
  if (!token) {
    alert('Anda harus login untuk mengaktifkan notifikasi.');
    return;
  }

  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.error('Push Messaging tidak didukung.');
    return;
  }

  // Minta izin dulu jika belum
  const permission = await Notification.requestPermission();
  if (permission === 'denied') {
    alert('Izin notifikasi ditolak.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log('Membuat langganan baru...');
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
    }
    
    // Kirim subscription ke server API
    await StoryApi.subscribePush(token, subscription);
    console.log('Berhasil subscribe push notification.');
    alert('Notifikasi berhasil diaktifkan!');

  } catch (error) {
    console.error('Gagal subscribe push notification:', error);
    if (error.message.includes('permission')) {
        alert('Gagal mendapatkan izin notifikasi.');
    } else {
        alert(`Gagal berlangganan: ${error.message}`);
    }
  }
}

// Fungsi untuk unsubscribe (dipakai di about-page.js)
export async function unsubscribePush() {
  const token = getUserToken();
  if (!token) return; // Tidak perlu notif jika user tidak login

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      // Hapus langganan dari server API
      await StoryApi.unsubscribePush(token, endpoint);
      // Hapus langganan dari browser
      await subscription.unsubscribe();
      
      console.log('Berhasil unsubscribe push notification.');
      alert('Notifikasi berhasil dinonaktifkan.');
    }
  } catch (error) {
    console.error('Gagal unsubscribe push notification:', error);
    alert(`Gagal berhenti berlangganan: ${error.message}`);
  }
}