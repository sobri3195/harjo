// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

// Firebase config - actual project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDG8x-w_F2CeOZi9Y-8ojhoPK0tUjufai4",
  authDomain: "efram-harsana-emergency-assist.firebaseapp.com",
  projectId: "efram-harsana-emergency-assist",
  storageBucket: "efram-harsana-emergency-assist.firebasestorage.app",
  messagingSenderId: "985521255018",
  appId: "1:985521255018:android:4c94dcefee08c682c41013"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
let messaging: any = null;

export const initializeFirebaseMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported && typeof window !== 'undefined') {
      messaging = getMessaging(app);
      return messaging;
    }
    return null;
  } catch (error) {
    console.error('Firebase messaging not supported:', error);
    return null;
  }
};

export const requestNotificationPermission = async () => {
  try {
    if (!messaging) {
      await initializeFirebaseMessaging();
    }

    if (!messaging) {
      throw new Error('Firebase messaging not initialized');
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BHINWWTv5U9ufkF0FSSXl_ff-xGfpsQeF7TOvWzjTbE-Rx6_sHnKAocQHjGTmNQhkCb6nsCf30Tih6Kq4aKzcDM'
      });
      
      if (token) {
        console.log('FCM Token:', token);
        return { success: true, token };
      } else {
        console.log('No registration token available.');
        return { success: false, error: 'No token available' };
      }
    } else {
      console.log('Unable to get permission to notify.');
      return { success: false, error: 'Permission denied' };
    }
  } catch (error) {
    console.error('An error occurred while retrieving token:', error);
    return { success: false, error: error.message };
  }
};

export const setupMessageListener = (callback: (payload: any) => void) => {
  if (messaging) {
    return onMessage(messaging, callback);
  }
  return () => {}; // Return empty cleanup function
};

export { messaging };