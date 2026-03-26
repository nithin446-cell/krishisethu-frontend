import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { supabase } from './supabase';

// ✅ Real Firebase Config provided by User
const firebaseConfig = {
  apiKey: "AIzaSyBnyjdIaSaRZKeZp8q-qGLJaIz5LmvqIsc",
  authDomain: "krishisethu-main.firebaseapp.com",
  projectId: "krishisethu-main",
  storageBucket: "krishisethu-main.firebasestorage.app",
  messagingSenderId: "3657268180",
  appId: "1:3657268180:web:697f8e8225e7fa24d6b441",
  measurementId: "G-RQBW2FXQNH"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async (userId: string) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(messaging, { 
        vapidKey: 'BNTURXes0L-OAfv4T69mWDZTWtULVTTbVGBAioaTmA7PcwZP3ResE-3gTNs31jeDmf9VOR-oteO_-Ng1W7VmAXY' 
      });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // Save token to Supabase users table
        const { error } = await supabase
          .from('users')
          .update({ fcm_token: currentToken })
          .eq('id', userId);
        
        if (error) throw error;
      }
    }
  } catch (err) {
    console.error('An error occurred while retrieving token:', err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      console.log("Payload received:", payload);
      resolve(payload);
    });
  });
