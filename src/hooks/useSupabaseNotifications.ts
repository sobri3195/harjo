import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCapacitorNotifications } from './useCapacitorNotifications';
import { toast } from './use-toast';

interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  target_user_id?: string;
  target_role?: string;
  emergency_type?: 'trauma' | 'heart' | 'ambulance' | 'admin';
  report_id?: string;
}

interface NotificationQueue {
  id: string;
  title: string;
  body: string;
  data: any;
  priority: string;
  status: string;
  created_at: string;
  target_user_id?: string;
}

export const useSupabaseNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationQueue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { sendLocalNotification, isEnabled } = useCapacitorNotifications();

  // Listen for real-time notification updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notification-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notification_queue',
          filter: `target_user_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('New notification received:', payload.new);
          const notification = payload.new as NotificationQueue;
          
          // Send to device if enabled
          if (isEnabled) {
            await sendLocalNotification({
              title: notification.title,
              body: notification.body,
              data: notification.data,
              id: Date.now()
            });
          }

          // Update local state
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast
          toast({
            title: notification.title,
            description: notification.body,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isEnabled, sendLocalNotification]);

  // Send notification via edge function
  const sendNotification = async (payload: NotificationPayload) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: payload
      });

      if (error) {
        console.error('Error sending notification:', error);
        toast({
          title: "Error",
          description: "Gagal mengirim notifikasi",
          variant: "destructive"
        });
        return false;
      }

      console.log('Notification sent successfully:', data);
      toast({
        title: "Berhasil",
        description: "Notifikasi terkirim",
      });
      
      return true;
    } catch (error) {
      console.error('Error calling edge function:', error);
      toast({
        title: "Error",
        description: "Gagal mengirim notifikasi",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Send emergency notification
  const sendEmergencyNotification = async (
    type: 'trauma' | 'heart' | 'ambulance' | 'admin',
    message: string,
    reportId?: string,
    targetUserId?: string
  ) => {
    const emergencyTitles = {
      trauma: '🚨 TRAUMA EMERGENCY',
      heart: '❤️ CARDIAC EMERGENCY',
      ambulance: '🚑 AMBULANCE ALERT',
      admin: '📋 ADMIN NOTIFICATION'
    };

    return await sendNotification({
      title: emergencyTitles[type],
      body: message,
      priority: type === 'admin' ? 'normal' : 'critical',
      emergency_type: type,
      report_id: reportId,
      target_user_id: targetUserId,
      data: {
        emergency_type: type,
        report_id: reportId,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Get notification history
  const getNotificationHistory = async () => {
    if (!user) return [];
    
    try {
      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      setNotifications(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from('notification_queue')
        .update({ status: 'read' })
        .eq('id', notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return {
    notifications,
    isLoading,
    sendNotification,
    sendEmergencyNotification,
    getNotificationHistory,
    markAsRead
  };
};