// This file will be used when building for mobile with Capacitor
// It contains the native implementation that will be swapped in during mobile builds

import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'checking' | null;
}

// This implementation will use native Capacitor APIs when building for mobile
export const useCapacitorGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionState: null,
  });

  // Native implementation will be added here during mobile build
  // For now, this is just a placeholder that falls back to web APIs
  
  const checkPermission = async () => {
    // This will use Capacitor.Geolocation.checkPermissions() in mobile build
    if (!navigator.permissions) {
      return 'prompt';
    }
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      return permission.state as 'granted' | 'denied' | 'prompt';
    } catch {
      return 'prompt';
    }
  };

  const requestPermission = async () => {
    // This will use Capacitor.Geolocation.requestPermissions() in mobile build
    return new Promise<'granted' | 'denied' | 'prompt'>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve('granted'),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            resolve('denied');
          } else {
            resolve('prompt');
          }
        }
      );
    });
  };

  const getCurrentLocation = async () => {
    setLocation(prev => ({ ...prev, loading: true, permissionState: 'checking' }));

    try {
      const permission = await checkPermission();
      
      if (permission === 'denied') {
        setLocation(prev => ({
          ...prev,
          error: 'Izin lokasi ditolak. Silakan aktifkan GPS di pengaturan aplikasi.',
          loading: false,
          permissionState: 'denied',
        }));
        return;
      }

      if (permission !== 'granted') {
        const newPermission = await requestPermission();
        if (newPermission !== 'granted') {
          setLocation(prev => ({
            ...prev,
            error: 'Izin lokasi diperlukan untuk fitur ini.',
            loading: false,
            permissionState: newPermission,
          }));
          return;
        }
      }

      // This will use Capacitor.Geolocation.getCurrentPosition() in mobile build
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000,
        });
      });

      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
        permissionState: 'granted',
      });
    } catch (error: any) {
      let errorMessage = 'Gagal mendapatkan lokasi';
      
      if (error.code === 1) {
        errorMessage = 'Izin lokasi ditolak. Silakan aktifkan GPS di pengaturan aplikasi.';
      } else if (error.code === 2) {
        errorMessage = 'Lokasi tidak tersedia. Pastikan GPS aktif.';
      } else if (error.code === 3) {
        errorMessage = 'Waktu habis saat mencari lokasi. Coba lagi.';
      }

      setLocation(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        permissionState: 'denied',
      }));
    }
  };

  useEffect(() => {
    const initializeGeolocation = async () => {
      const permission = await checkPermission();
      setLocation(prev => ({ ...prev, permissionState: permission }));

      if (permission === 'granted') {
        getCurrentLocation();
      } else {
        setLocation(prev => ({
          ...prev,
          loading: false,
        }));
      }
    };

    initializeGeolocation();
  }, []);

  return {
    ...location,
    getCurrentLocation,
    requestPermission: async () => {
      const permission = await requestPermission();
      if (permission === 'granted') {
        getCurrentLocation();
      }
      return permission;
    },
  };
};