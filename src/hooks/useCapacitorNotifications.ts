import { useState, useEffect } from 'react';
import { toast } from './use-toast';

// Types for notifications
interface NotificationData {
  title: string;
  body: string;
  id?: number;
  data?: any;
}

interface NotificationPermission {
  display: 'granted' | 'denied' | 'prompt';
}

// Main hook for Capacitor notifications
export const useCapacitorNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'default'>('prompt');
  const [isEnabled, setIsEnabled] = useState(false);

  // Check if running in Capacitor or web
  const isCapacitor = !!(window as any).Capacitor;

  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        if (isCapacitor && (window as any).Capacitor.Plugins.LocalNotifications) {
          // Capacitor environment
          const { LocalNotifications } = (window as any).Capacitor.Plugins;
          
          // Check permission status
          const permStatus = await LocalNotifications.checkPermissions();
          setPermission(permStatus.display);
          setIsSupported(true);
          setIsEnabled(permStatus.display === 'granted');
          
          console.log('Capacitor notifications initialized:', permStatus);
        } else if ('Notification' in window) {
          // Web fallback
          setPermission(Notification.permission as any);
          setIsSupported(true);
          setIsEnabled(Notification.permission === 'granted');
          
          console.log('Web notifications initialized:', Notification.permission);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setIsSupported(false);
      }
    };

    initializeNotifications();
  }, [isCapacitor]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (isCapacitor && (window as any).Capacitor.Plugins.LocalNotifications) {
        // Capacitor request
        const { LocalNotifications } = (window as any).Capacitor.Plugins;
        const result = await LocalNotifications.requestPermissions();
        
        setPermission(result.display);
        setIsEnabled(result.display === 'granted');
        
        if (result.display === 'granted') {
          toast({
            title: "📱 Notifikasi Diaktifkan",
            description: "Anda akan menerima alert darurat",
          });
          return true;
        }
      } else if ('Notification' in window) {
        // Web fallback
        const result = await Notification.requestPermission();
        setPermission(result as any);
        setIsEnabled(result === 'granted');
        
        if (result === 'granted') {
          toast({
            title: "🔔 Notifikasi Web Aktif",
            description: "Browser notifications enabled",
          });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Gagal mengaktifkan notifikasi",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendLocalNotification = async (notification: NotificationData) => {
    try {
      if (!isEnabled) {
        console.log('Notifications not enabled, skipping:', notification.title);
        return;
      }

      const notificationId = notification.id || Date.now();
      
      if (isCapacitor && (window as any).Capacitor.Plugins.LocalNotifications) {
        // Capacitor local notification
        const { LocalNotifications } = (window as any).Capacitor.Plugins;
        
        await LocalNotifications.schedule({
          notifications: [{
            title: notification.title,
            body: notification.body,
            id: notificationId,
            schedule: { at: new Date(Date.now() + 1000) }, // 1 second delay
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: notification.data || {}
          }]
        });
        
        console.log('Capacitor notification sent:', notification.title);
      } else if ('Notification' in window && Notification.permission === 'granted') {
        // Web notification fallback
        const webNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: notification.data,
          tag: `notification-${notificationId}`,
          requireInteraction: true
        });
        
        // Auto close after 10 seconds
        setTimeout(() => webNotification.close(), 10000);
        
        console.log('Web notification sent:', notification.title);
      }
      
      // Show toast as backup
      toast({
        title: notification.title,
        description: notification.body,
      });
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const sendEmergencyAlert = async (type: 'trauma' | 'heart' | 'ambulance' | 'admin', message: string) => {
    const emergencyNotifications = {
      trauma: {
        title: '🚨 TRAUMA EMERGENCY',
        body: message,
        id: Date.now()
      },
      heart: {
        title: '❤️ CARDIAC EMERGENCY', 
        body: message,
        id: Date.now()
      },
      ambulance: {
        title: '🚑 AMBULANCE ALERT',
        body: message,
        id: Date.now()
      },
      admin: {
        title: '📋 ADMIN NOTIFICATION',
        body: message,
        id: Date.now()
      }
    };

    await sendLocalNotification(emergencyNotifications[type]);
  };

  const testNotification = async () => {
    await sendLocalNotification({
      title: '✅ Test Notification',
      body: 'Sistem notifikasi berfungsi dengan baik!',
      id: 999999
    });
  };

  return {
    isSupported,
    permission,
    isEnabled,
    isCapacitor,
    requestPermission,
    sendLocalNotification,
    sendEmergencyAlert,
    testNotification
  };
};