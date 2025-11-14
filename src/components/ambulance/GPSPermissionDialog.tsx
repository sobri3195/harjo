import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Settings, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GPSPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPermissionGranted: () => void;
}

export const GPSPermissionDialog: React.FC<GPSPermissionDialogProps> = ({
  open,
  onOpenChange,
  onPermissionGranted
}) => {
  const [permissionState, setPermissionState] = useState<'checking' | 'prompt' | 'granted' | 'denied'>('checking');
  const [isRequesting, setIsRequesting] = useState(false);

  const checkPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState('denied');
      return;
    }

    if (!navigator.permissions) {
      setPermissionState('prompt');
      return;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      setPermissionState(permission.state as any);
      
      if (permission.state === 'granted') {
        onPermissionGranted();
        onOpenChange(false);
      }
    } catch {
      setPermissionState('prompt');
    }
  };

  const requestPermission = async () => {
    setIsRequesting(true);
    
    const success = (position: GeolocationPosition) => {
      setPermissionState('granted');
      setIsRequesting(false);
      onPermissionGranted();
      onOpenChange(false);
    };

    const error = (error: GeolocationPositionError) => {
      setIsRequesting(false);
      if (error.code === error.PERMISSION_DENIED) {
        setPermissionState('denied');
      }
    };

    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    });
  };

  useEffect(() => {
    if (open) {
      checkPermission();
    }
  }, [open]);

  const getPermissionInstructions = () => {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return [
        '1. Klik ikon gembok atau lokasi di sebelah kiri address bar',
        '2. Pilih "Izinkan" untuk lokasi',
        '3. Refresh halaman dan coba lagi'
      ];
    } else if (userAgent.includes('Firefox')) {
      return [
        '1. Klik ikon perisai atau gembok di address bar',
        '2. Klik "Izinkan akses lokasi"',
        '3. Refresh halaman dan coba lagi'
      ];
    } else if (userAgent.includes('Safari')) {
      return [
        '1. Masuk ke Safari > Preferences > Websites',
        '2. Pilih Location di sidebar',
        '3. Ubah setting untuk website ini ke "Allow"'
      ];
    } else {
      return [
        '1. Cari pengaturan lokasi di browser Anda',
        '2. Izinkan akses lokasi untuk website ini',
        '3. Refresh halaman dan coba lagi'
      ];
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="text-emergency-red-600" />
            Izin Akses Lokasi - Ambulans
          </DialogTitle>
          <DialogDescription>
            Aplikasi ambulans memerlukan akses GPS untuk tracking dan navigasi darurat
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {permissionState === 'checking' && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-muted-foreground">Memeriksa izin GPS...</p>
            </div>
          )}

          {permissionState === 'prompt' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emergency-red-100 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="text-emergency-red-600" size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">Aktifkan GPS untuk Ambulans</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Aplikasi ambulans memerlukan akses lokasi untuk:
                </p>
                <ul className="text-sm text-muted-foreground text-left space-y-1">
                  <li>• Tracking posisi ambulans real-time</li>
                  <li>• Navigasi ke lokasi darurat</li>
                  <li>• Koordinasi dengan tim medis</li>
                  <li>• Estimasi waktu tiba (ETA)</li>
                </ul>
              </div>
              <Button 
                onClick={requestPermission} 
                disabled={isRequesting}
                className="w-full"
              >
                {isRequesting ? 'Meminta Izin...' : 'Izinkan Akses Lokasi'}
              </Button>
            </div>
          )}

          {permissionState === 'granted' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">GPS Ambulans Aktif!</h3>
                <p className="text-sm text-muted-foreground">
                  Sistem tracking dan navigasi ambulans siap digunakan
                </p>
              </div>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Akses GPS ditolak. Aplikasi ambulans tidak dapat berfungsi tanpa lokasi untuk tracking dan navigasi.
                </AlertDescription>
              </Alert>

              <div className="text-sm">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Settings size={16} />
                  Cara Mengaktifkan GPS:
                </h4>
                <ol className="space-y-1 text-muted-foreground">
                  {getPermissionInstructions().map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={checkPermission} className="flex-1">
                  Coba Lagi
                </Button>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="flex-1"
                >
                  Refresh Halaman
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};