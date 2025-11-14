import { useState, useEffect } from 'react';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
  permissionState: 'granted' | 'denied' | 'prompt' | 'checking' | null;
}

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
    permissionState: null,
  });

  const checkPermission = async () => {
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

  const requestLocation = async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocation tidak didukung browser ini',
        loading: false,
        permissionState: 'denied',
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, permissionState: 'checking' }));

    const success = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
        permissionState: 'granted',
      });
    };

    const error = (error: GeolocationPositionError) => {
      let errorMessage = 'Gagal mendapatkan lokasi';
      let permissionState: 'denied' | 'granted' = 'denied';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Izin lokasi ditolak. Silakan aktifkan GPS dan izinkan akses lokasi di browser Anda.';
          permissionState = 'denied';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Lokasi tidak tersedia. Pastikan GPS aktif dan Anda berada di area dengan sinyal yang baik.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Waktu habis saat mencari lokasi. Coba lagi.';
          break;
        default:
          errorMessage = error.message;
          break;
      }

      setLocation(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        permissionState,
      }));
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 300000,
    });
  };

  useEffect(() => {
    const initializeGeolocation = async () => {
      const permission = await checkPermission();
      setLocation(prev => ({ ...prev, permissionState: permission }));

      if (permission === 'granted') {
        requestLocation();
      } else if (permission === 'prompt') {
        // Auto-request if permission is not yet determined
        requestLocation();
      } else {
        setLocation(prev => ({
          ...prev,
          error: 'Izin lokasi diperlukan. Silakan aktifkan GPS dan izinkan akses lokasi di browser.',
          loading: false,
        }));
      }
    };

    initializeGeolocation();
  }, []);

  const getCurrentLocation = async () => {
    const permission = await checkPermission();
    if (permission === 'denied') {
      setLocation(prev => ({
        ...prev,
        error: 'Izin lokasi ditolak. Untuk mengaktifkan GPS:\n1. Klik ikon gembok/lokasi di address bar\n2. Pilih "Izinkan" untuk lokasi\n3. Refresh halaman',
        loading: false,
        permissionState: 'denied',
      }));
      return;
    }

    requestLocation();
  };

  const requestPermission = () => {
    requestLocation();
  };

  return {
    ...location,
    getCurrentLocation,
    requestPermission,
  };
};