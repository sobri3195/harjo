import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './use-toast';

interface NotificationSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { user } = useAuth();

  // Check if push notifications are supported
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Register service worker and get subscription
  useEffect(() => {
    if (!isSupported || !user) return;

    const initializeServiceWorker = async () => {
      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Get existing subscription
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
          setSubscription(existingSubscription);
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    initializeServiceWorker();
  }, [isSupported, user]);

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported || !user) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Push notifications permission was denied",
          variant: "destructive"
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIssXAWaaLcx3kU5ESyJJb8qM2g7_CQKt6G9KdFX4e1eV0QKI_JQI' // Demo VAPID key
        )
      });

      // Save subscription to database
      const subscriptionData: NotificationSubscription = {
        endpoint: newSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(newSubscription.getKey('auth')!)
        }
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys.p256dh,
          auth: subscriptionData.keys.auth,
          user_agent: navigator.userAgent
        });

      if (error) throw error;

      setSubscription(newSubscription);
      setIsSubscribed(true);

      toast({
        title: "✅ Notifications Enabled",
        description: "You'll now receive emergency alerts",
      });

      return true;
    } catch (error) {
      console.error('Push subscription failed:', error);
      toast({
        title: "Subscription Failed",
        description: "Failed to enable push notifications",
        variant: "destructive"
      });
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!subscription || !user) return;

    try {
      await subscription.unsubscribe();
      
      // Remove from database
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint);

      if (error) throw error;

      setSubscription(null);
      setIsSubscribed(false);

      toast({
        title: "Notifications Disabled",
        description: "Push notifications have been disabled",
      });
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      toast({
        title: "Error",
        description: "Failed to disable notifications",
        variant: "destructive"
      });
    }
  };

  // Send test notification
  const sendTestNotification = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_queue')
        .insert({
          title: '🧪 Test Notification',
          body: 'This is a test notification from RSPAU Emergency System',
          target_user_id: user.id,
          priority: 'normal',
          data: { type: 'test' }
        });

      if (error) throw error;

      toast({
        title: "Test Sent",
        description: "Test notification has been queued",
      });
    } catch (error) {
      console.error('Failed to send test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    }
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendTestNotification
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}