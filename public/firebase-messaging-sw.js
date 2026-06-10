importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.6.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAbEVmo0BWoRZwAR9bv0Tyf0xP4dOEC1pU",
  authDomain: "horecaapp-e16cf.firebaseapp.com",
  projectId: "horecaapp-e16cf",
  storageBucket: "horecaapp-e16cf.firebasestorage.app",
  messagingSenderId: "1033337228120",
  appId: "1:1033337228120:web:549fee0fe3dd656845332d",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification ?? {};
  self.registration.showNotification(title ?? 'Smarter HoReCA', {
    body: body ?? '',
    icon: icon ?? '/smarter_horeca_1.jpg',
    badge: '/smarter_horeca_1.jpg',
    tag: 'checklist-reminder',
    renotify: true,
  });
});
