importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

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

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png', // Optional
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
