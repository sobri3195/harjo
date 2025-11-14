import { useState, useEffect, useCallback } from 'react';
import { initializeFirebaseMessaging, requestNotificationPermission, setupMessageListener } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FirebaseNotification {
  title: string;
  body: string;
  data?: any;
}

export const useFirebaseNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize Firebase messaging
  useEffect(() => {
    const initFirebase = async () => {
      try {
        const messaging = await initializeFirebaseMessaging();
        if (messaging) {
          setIsSupported(true);
          setIsInitialized(true);
          
          // Check current permission status
          const permission = Notification.permission;
          setIsPermissionGranted(permission === 'granted');
        }
      } catch (error) {
        console.error('Failed to initialize Firebase:', error);
      }
    };

    initFirebase();
  }, []);

  // Listen for foreground messages
  useEffect(() => {
    if (!isInitialized) return;

    const unsubscribe = setupMessageListener((payload: any) => {
      console.log('Foreground message received:', payload);
      
      // Show toast notification for foreground messages
      toast({
        title: payload.notification?.title || 'Emergency Alert',
        description: payload.notification?.body || 'New notification received',
        variant: payload.data?.severity === 'critical' ? 'destructive' : 'default',
      });

      // Play notification sound for critical emergencies
      if (payload.data?.type === 'emergency' && payload.data?.severity === 'critical') {
        playNotificationSound();
      }
    });

    return () => {
      // Cleanup listener
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isInitialized, toast]);

  // Request notification permission and get FCM token
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in this browser",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await requestNotificationPermission();
      
      if (result.success && result.token) {
        setIsPermissionGranted(true);
        setFcmToken(result.token);
        
        // Store FCM token in Supabase for the user
        if (user) {
          await storeFCMToken(result.token);
        }
        
        toast({
          title: "🔔 Notifications Enabled",
          description: "You'll receive emergency alerts and updates",
        });
        
        return true;
      } else {
        toast({
          title: "Permission Denied",
          description: result.error || "Unable to enable notifications",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to enable notifications",
        variant: "destructive"
      });
      return false;
    }
  }, [isSupported, user, toast]);

  // Store FCM token in Supabase  
  const storeFCMToken = async (token: string) => {
    if (!user?.id) return;
    
    try {
      // Direct insert with upsert using conflict resolution
      const { error } = await supabase
        .from('fcm_tokens')
        .upsert({
          user_id: user.id,
          token: token,
          device_type: 'web',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,device_type'
        });

      if (error) {
        console.error('Error storing FCM token:', error);
      } else {
        console.log('FCM token stored successfully');
      }
    } catch (error) {
      console.error('Error storing FCM token:', error);
    }
  };

  // Play notification sound for critical alerts
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification-sound.mp3');
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Notification sound not available:', error);
    }
  };

  // Send test notification
  const sendTestNotification = useCallback(async () => {
    if (!fcmToken) {
      toast({
        title: "No Token",
        description: "Please enable notifications first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Call Supabase edge function to send test notification
      const { error } = await supabase.functions.invoke('send-firebase-notification', {
        body: {
          token: fcmToken,
          title: '🚨 Test Emergency Alert',
          body: 'This is a test notification from RSPAU Emergency System',
          data: {
            type: 'test',
            severity: 'normal'
          }
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Test Sent",
        description: "Test notification has been sent",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    }
  }, [fcmToken, toast]);

  return {
    isSupported,
    isPermissionGranted,
    fcmToken,
    isInitialized,
    requestPermission,
    sendTestNotification
  };
};