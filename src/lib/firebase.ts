import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { supabase } from './supabase';

// ✅ Firebase config loaded from environment variables — never hardcode API keys
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Guard: do not crash the app if Firebase is not configured
let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

try {
  if (import.meta.env.VITE_FIREBASE_API_KEY) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } else {
    console.warn('[Firebase] VITE_FIREBASE_API_KEY not set — push notifications disabled.');
  }
} catch (err) {
  console.error('[Firebase] Initialization failed:', err);
}

export const requestForToken = async (userId: string) => {
  if (!messaging) return;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: currentToken })
          .eq('id', userId);
        if (error) throw error;
      }
    }
  } catch (err) {
    console.error('[Firebase] An error occurred while retrieving FCM token:', err);
  }
};

/**
 * Subscribe to foreground FCM messages.
 * Returns an unsubscribe function — always call it on component unmount.
 */
export const onMessageListener = (callback: (payload: any) => void): (() => void) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
