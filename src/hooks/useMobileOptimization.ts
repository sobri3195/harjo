import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SystemEvent {
  id: string;
  event_type: 'gps_permission' | 'battery_status' | 'network_change' | 'app_state' | 'sync_event';
  event_data: any;
  user_id?: string;
  device_info: any;
  battery_level?: number;
  network_type?: 'wifi' | 'cellular' | 'offline';
  gps_accuracy?: number;
  timestamp: string;
  created_at: string;
}

interface SyncQueueItem {
  id: string;
  user_id: string;
  action_type: 'emergency_report' | 'location_update' | 'status_update';
  payload: any;
  priority: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number;
  max_retries: number;
  scheduled_at: string;
  processed_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export const useMobileOptimization = () => {
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [batteryInfo, setBatteryInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);
  const [backgroundSyncEnabled, setBackgroundSyncEnabled] = useState(false);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      logSystemEvent('network_change', { 
        network_status: 'online',
        connection_type: getConnectionType()
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      logSystemEvent('network_change', { 
        network_status: 'offline'
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor battery status (if supported)
  useEffect(() => {
    const updateBatteryInfo = async () => {
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          const info = {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };
          
          setBatteryInfo(info);
          
          // Log battery status if level is critical
          if (info.level <= 20 && !info.charging) {
            logSystemEvent('battery_status', {
              ...info,
              status: 'critical'
            });
          }
        } catch (error) {
          console.log('Battery API not supported');
        }
      }
    };

    updateBatteryInfo();
    const interval = setInterval(updateBatteryInfo, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Monitor network connection type
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        const info = {
          type: connection.effectiveType || connection.type,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
        
        setNetworkInfo(info);
      }
    };

    updateNetworkInfo();
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
      return () => {
        (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
      };
    }
  }, []);

  // Background sync setup
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setBackgroundSyncEnabled(true);
      
      // Register background sync (if supported)
      navigator.serviceWorker.ready.then(registration => {
        // Background sync is experimental, so we wrap in try-catch
        try {
          if ('sync' in registration) {
            return (registration as any).sync.register('emergency-sync');
          }
        } catch (error) {
          console.log('Background sync not supported:', error);
        }
      }).catch(error => {
        console.error('Background sync registration failed:', error);
      });
    }
  }, []);

  // Load sync queue
  const loadSyncQueue = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'failed'])
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSyncQueue((data as SyncQueueItem[]) || []);
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  };

  useEffect(() => {
    loadSyncQueue();
  }, [user]);

  // Log system events
  const logSystemEvent = async (
    eventType: SystemEvent['event_type'], 
    eventData: any,
    includeDeviceInfo = true
  ) => {
    try {
      const deviceInfo = includeDeviceInfo ? {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        }
      } : {};

      const { error } = await supabase
        .from('system_events')
        .insert({
          event_type: eventType,
          event_data: eventData,
          user_id: user?.id || null,
          device_info: deviceInfo,
          battery_level: batteryInfo?.level || null,
          network_type: getNetworkType(),
          gps_accuracy: eventData.gps_accuracy || null
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error logging system event:', error);
    }
  };

  // Add item to sync queue
  const addToSyncQueue = async (
    actionType: SyncQueueItem['action_type'],
    payload: any,
    priority = 1
  ) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sync_queue')
        .insert({
          user_id: user.id,
          action_type: actionType,
          payload: payload,
          priority: priority,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setSyncQueue(prev => [...prev, data as SyncQueueItem]);
      
        // Trigger background sync if offline
        if (!isOnline && backgroundSyncEnabled) {
          try {
            const registration = await navigator.serviceWorker.ready;
            if ('sync' in registration) {
              await (registration as any).sync.register('emergency-sync');
            }
          } catch (error) {
            console.error('Background sync trigger failed:', error);
          }
        }

      return data;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
      
      // Store locally if database fails
      const localQueue = JSON.parse(localStorage.getItem('emergency_sync_queue') || '[]');
      const item = {
        id: `local_${Date.now()}`,
        user_id: user.id,
        action_type: actionType,
        payload: payload,
        priority: priority,
        status: 'pending',
        created_at: new Date().toISOString()
      };
      
      localQueue.push(item);
      localStorage.setItem('emergency_sync_queue', JSON.stringify(localQueue));
      setSyncQueue(prev => [...prev, item as SyncQueueItem]);
    }
  };

  // Process sync queue
  const processSyncQueue = async () => {
    if (!isOnline || syncQueue.length === 0) return;

    for (const item of syncQueue.filter(i => i.status === 'pending')) {
      try {
        // Update status to processing
        await supabase
          .from('sync_queue')
          .update({ status: 'processing' })
          .eq('id', item.id);

        // Process based on action type
        let success = false;
        switch (item.action_type) {
          case 'emergency_report':
            success = await processEmergencyReport(item.payload);
            break;
          case 'location_update':
            success = await processLocationUpdate(item.payload);
            break;
          case 'status_update':
            success = await processStatusUpdate(item.payload);
            break;
        }

        if (success) {
          await supabase
            .from('sync_queue')
            .update({ 
              status: 'completed',
              processed_at: new Date().toISOString()
            })
            .eq('id', item.id);
            
          setSyncQueue(prev => prev.filter(i => i.id !== item.id));
        } else {
          throw new Error('Processing failed');
        }
      } catch (error) {
        console.error('Sync item processing failed:', error);
        
        const newRetryCount = item.retry_count + 1;
        if (newRetryCount >= item.max_retries) {
          await supabase
            .from('sync_queue')
            .update({ 
              status: 'failed',
              error_message: error.message,
              retry_count: newRetryCount
            })
            .eq('id', item.id);
        } else {
          await supabase
            .from('sync_queue')
            .update({ 
              status: 'pending',
              retry_count: newRetryCount,
              scheduled_at: new Date(Date.now() + (newRetryCount * 30000)).toISOString() // Exponential backoff
            })
            .eq('id', item.id);
        }
      }
    }
  };

  // Process when coming online
  useEffect(() => {
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline]);

  // Get optimization recommendations
  const getOptimizationRecommendations = () => {
    const recommendations = [];

    if (batteryInfo?.level < 20 && !batteryInfo?.charging) {
      recommendations.push({
        type: 'battery',
        severity: 'high',
        message: 'Battery level is low. Consider enabling battery saver mode.',
        action: 'Reduce GPS frequency and disable background sync'
      });
    }

    if (networkInfo?.type === '2g' || networkInfo?.saveData) {
      recommendations.push({
        type: 'network',
        severity: 'medium',
        message: 'Slow network detected. Optimize data usage.',
        action: 'Enable data compression and reduce sync frequency'
      });
    }

    if (!isOnline) {
      recommendations.push({
        type: 'connectivity',
        severity: 'high',
        message: 'Device is offline. Emergency reports will be queued.',
        action: 'Reports will sync automatically when connection is restored'
      });
    }

    return recommendations;
  };

  return {
    isOnline,
    batteryInfo,
    networkInfo,
    syncQueue,
    backgroundSyncEnabled,
    logSystemEvent,
    addToSyncQueue,
    processSyncQueue,
    getOptimizationRecommendations,
    loadSyncQueue
  };
};

// Helper functions
function getConnectionType(): string {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  return connection?.effectiveType || connection?.type || 'unknown';
}

function getNetworkType(): 'wifi' | 'cellular' | 'offline' {
  if (!navigator.onLine) return 'offline';
  
  const connection = (navigator as any).connection;
  if (connection) {
    const type = connection.type || connection.effectiveType;
    if (type === 'wifi') return 'wifi';
    if (['cellular', '2g', '3g', '4g', '5g'].includes(type)) return 'cellular';
  }
  
  return 'wifi'; // Default assumption
}

// Sync processing functions
async function processEmergencyReport(payload: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('emergency_reports')
      .insert(payload);
    
    return !error;
  } catch (error) {
    console.error('Emergency report sync failed:', error);
    return false;
  }
}

async function processLocationUpdate(payload: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('locations')
      .upsert(payload);
    
    return !error;
  } catch (error) {
    console.error('Location update sync failed:', error);
    return false;
  }
}

async function processStatusUpdate(payload: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('emergency_reports')
      .update({ status: payload.status })
      .eq('id', payload.report_id);
    
    return !error;
  } catch (error) {
    console.error('Status update sync failed:', error);
    return false;
  }
}