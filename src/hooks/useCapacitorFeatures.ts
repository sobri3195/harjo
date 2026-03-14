import { useState, useEffect } from 'react';
import { toast } from './use-toast';

const isNativeRuntime = () => {
  const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
};

type LocationPosition = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export const useCapacitorFeatures = () => {
  const [deviceInfo, setDeviceInfo] = useState<null | Record<string, unknown>>(null);
  const [networkStatus, setNetworkStatus] = useState({ connected: true, connectionType: 'wifi' });
  const [backgroundTracking, setBackgroundTracking] = useState(false);

  useEffect(() => {
    const setupNativeInfo = async () => {
      if (!isNativeRuntime()) {
        return;
      }

      try {
        const [{ Device }, { Network }] = await Promise.all([
          import('@capacitor/device'),
          import('@capacitor/network'),
        ]);

        const [info, status] = await Promise.all([Device.getInfo(), Network.getStatus()]);

        setDeviceInfo(info as unknown as Record<string, unknown>);
        setNetworkStatus({
          connected: status.connected,
          connectionType: status.connectionType,
        });

        const listener = await Network.addListener('networkStatusChange', (nextStatus) => {
          setNetworkStatus({
            connected: nextStatus.connected,
            connectionType: nextStatus.connectionType,
          });
        });

        return () => {
          listener.remove();
        };
      } catch {
        // fallback web-only behavior
      }

      return undefined;
    };

    let cleanup: undefined | (() => void);
    setupNativeInfo().then((cb) => {
      cleanup = cb;
    });

    return () => {
      cleanup?.();
    };
  }, []);

  const requestPermissions = async () => {
    if (isNativeRuntime()) {
      try {
        const { Geolocation } = await import('@capacitor/geolocation');
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
          throw new Error('Location permission denied');
        }

        toast({
          title: "✅ Permissions Granted",
          description: "Location permission enabled",
        });
      } catch (error) {
        toast({
          title: "Permission Error",
          description: "Location permission denied",
          variant: "destructive"
        });
      }

      return;
    }

    if ('geolocation' in navigator) {
      try {
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });

        toast({
          title: "✅ Permissions Granted",
          description: "Location permission enabled",
        });
      } catch (error) {
        toast({
          title: "Permission Error",
          description: "Location permission denied",
          variant: "destructive"
        });
      }
    }
  };

  const startBackgroundTracking = async () => {
    setBackgroundTracking(true);
    toast({
      title: "🛰️ Background Tracking",
      description: "GPS tracking will be active in native app",
    });
  };

  const stopBackgroundTracking = async () => {
    setBackgroundTracking(false);
    toast({
      title: "Background Tracking Stopped",
      description: "GPS tracking disabled",
    });
  };

  const getCurrentPosition = async () => {
    if (isNativeRuntime()) {
      const { Geolocation } = await import('@capacitor/geolocation');
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      } as LocationPosition;
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        position => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }),
        reject,
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  };

  const scheduleNotification = async (title: string, body: string) => {
    // Web notification fallback
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  };

  return {
    deviceInfo,
    networkStatus,
    backgroundTracking,
    requestPermissions,
    startBackgroundTracking,
    stopBackgroundTracking,
    getCurrentPosition,
    scheduleNotification
  };
};
