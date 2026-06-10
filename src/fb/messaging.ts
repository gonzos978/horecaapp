import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU",
  authDomain: "horecaapp-e16cf.firebaseapp.com",
  projectId: "horecaapp-e16cf",
  storageBucket: "horecaapp-e16cf.firebasestorage.app",
  messagingSenderId: "1033337228120",
  appId: "1:1033337228120:web:549fee0fe3dd656845332d",
};

const app = getApps()[0] ?? initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

// VAPID key from Firebase Console → Project settings → Cloud Messaging → Web Push certificates
// TODO: replace with your actual VAPID key from Firebase Console
const VAPID_KEY = 'BH3REUTBNsJ_CamxdwV9M0CY__3jfp38MaiMGwYTNj47QSDrMkRa4B3v1pOoJ2R893Vkakj7xxD9de6s5OdbxZo';

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
    });
    return token;
  } catch (err) {
    console.error('FCM token error:', err);
    return null;
  }
}

export { onMessage };
