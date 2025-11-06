import StoryApi from '../data/api';
import { getUserToken } from './auth';


const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';


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


async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker tidak didukung di browser ini.');
    return;
  }

  try {
    
    
    
    const registration = await navigator.serviceWorker.register('/sw.js'); 
    console.log('Service Worker berhasil didaftarkan:', registration);
  } catch (error) {
    console.error('Gagal mendaftarkan Service Worker:', error);
  }
}


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


export async function initPushNotification() {
  await registerServiceWorker();
  await requestNotificationPermission();
}


export async function getSubscriptionState() {
  if (!('serviceWorker' in navigator)) return false;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription; 
}


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


export async function unsubscribePush() {
  const token = getUserToken();
  if (!token) return; 

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      
      await StoryApi.unsubscribePush(token, endpoint);
      
      await subscription.unsubscribe();
      
      console.log('Berhasil unsubscribe push notification.');
      alert('Notifikasi berhasil dinonaktifkan.');
    }
  } catch (error) {
    console.error('Gagal unsubscribe push notification:', error);
    alert(`Gagal berhenti berlangganan: ${error.message}`);
  }
}