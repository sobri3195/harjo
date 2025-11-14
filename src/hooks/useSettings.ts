import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export interface AppSettings {
  pushNotifications: boolean;
  soundNotifications: boolean;
  biometricAuth: boolean;
  soundEnabled: boolean;
  vibrationAlert: boolean;
  backgroundSync: boolean;
}

const defaultSettings: AppSettings = {
  pushNotifications: true,
  soundNotifications: true,
  biometricAuth: false,
  soundEnabled: true,
  vibrationAlert: true,
  backgroundSync: true,
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('app-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('app-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Handle specific setting changes
    if (key === 'pushNotifications') {
      handlePushNotificationToggle(value);
    } else if (key === 'soundNotifications') {
      handleSoundNotificationToggle(value);
    } else if (key === 'vibrationAlert') {
      handleVibrationToggle(value);
    } else if (key === 'backgroundSync') {
      handleBackgroundSyncToggle(value);
    }
  };

  const handlePushNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          toast({
            title: "Notifikasi Diaktifkan",
            description: "Anda akan menerima notifikasi push untuk keadaan darurat.",
          });
          // Test notification
          new Notification('EBD Siap!', {
            body: 'Sistem notifikasi darurat telah aktif',
            icon: '/favicon.ico'
          });
        } else {
          setSettings(prev => ({ ...prev, pushNotifications: false }));
          toast({
            title: "Izin Ditolak",
            description: "Izin notifikasi diperlukan untuk fitur ini.",
            variant: "destructive",
          });
        }
      } else {
        setSettings(prev => ({ ...prev, pushNotifications: false }));
        toast({
          title: "Tidak Didukung",
          description: "Browser ini tidak mendukung push notifications.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Notifikasi Dimatikan",
        description: "Notifikasi push telah dinonaktifkan.",
      });
    }
  };

  const handleSoundNotificationToggle = (enabled: boolean) => {
    if (enabled) {
      // Test sound notification
      playNotificationSound();
      toast({
        title: "Suara Notifikasi Aktif",
        description: "Notifikasi akan mengeluarkan suara.",
      });
    } else {
      toast({
        title: "Suara Notifikasi Nonaktif",
        description: "Notifikasi tidak akan mengeluarkan suara.",
      });
    }
  };

  const handleVibrationToggle = (enabled: boolean) => {
    if (enabled) {
      // Test vibration if available (mainly for mobile)
      if ('vibrate' in navigator) {
        navigator.vibrate(200); // 200ms vibration
      }
      toast({
        title: "Getaran Aktif",
        description: "Perangkat akan bergetar untuk notifikasi darurat (Android).",
      });
    } else {
      toast({
        title: "Getaran Nonaktif",
        description: "Getaran notifikasi dimatikan.",
      });
    }
  };

  const handleBackgroundSyncToggle = (enabled: boolean) => {
    if (enabled) {
      toast({
        title: "Background Sync Aktif",
        description: "Aplikasi akan sinkronisasi data otomatis di background.",
      });
    } else {
      toast({
        title: "Background Sync Nonaktif",
        description: "Sinkronisasi background dimatikan untuk menghemat battery.",
      });
    }
  };

  const playNotificationSound = () => {
    if (settings.soundNotifications) {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  };

  const sendTestNotification = () => {
    // Test push notification
    if (settings.pushNotifications && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notifikasi Darurat!', {
        body: 'Ini adalah test notifikasi sistem darurat EBD',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });
    }
    
    // Test sound
    if (settings.soundNotifications) {
      playNotificationSound();
    }
    
    // Test vibration
    if (settings.vibrationAlert && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]); // Pattern vibration
    }
    
    toast({
      title: "Test Notifikasi Terkirim",
      description: "Periksa notifikasi, suara, dan getaran sistem.",
    });
  };

  return {
    settings,
    updateSetting,
    sendTestNotification,
    playNotificationSound,
    isLoading,
  };
};