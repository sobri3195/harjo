// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase config - actual project configuration
firebase.initializeApp({
  apiKey: "AIzaSyDG8x-w_F2CeOZi9Y-8ojhoPK0tUjufai4",
  authDomain: "efram-harsana-emergency-assist.firebaseapp.com",
  projectId: "efram-harsana-emergency-assist",
  storageBucket: "efram-harsana-emergency-assist.firebasestorage.app",
  messagingSenderId: "985521255018",
  appId: "1:985521255018:android:4c94dcefee08c682c41013"
});

// Initialize Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Emergency Alert';
  const notificationOptions = {
    body: payload.notification?.body || 'New emergency notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'emergency-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/favicon.ico'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received.');

  event.notification.close();

  if (event.action === 'view') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});