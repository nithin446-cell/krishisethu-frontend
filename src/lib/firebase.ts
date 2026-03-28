import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
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

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
      const currentToken = await getToken(messaging, { vapidKey });
      if (currentToken) {
        // Save FCM token to Supabase users table
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: currentToken })
          .eq('id', userId);

        if (error) throw error;
      }
    }
  } catch (err) {
    console.error('An error occurred while retrieving FCM token:', err);
  }
};

/**
 * Subscribe to foreground FCM messages.
 * Returns an unsubscribe function — always call it on component unmount.
 */
export const onMessageListener = (callback: (payload: any) => void): (() => void) => {
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};
