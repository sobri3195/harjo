import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Bell, BellOff, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/firebase';

interface NotificationPermissionHandlerProps {
  onPermissionChange?: (granted: boolean) => void;
  showInline?: boolean;
}

const NotificationPermissionHandler: React.FC<NotificationPermissionHandlerProps> = ({
  onPermissionChange,
  showInline = false
}) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission);
      onPermissionChange?.(Notification.permission === 'granted');
    }
  }, [onPermissionChange]);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await requestNotificationPermission();
      
      if (result.success) {
        setPermission('granted');
        onPermissionChange?.(true);
        toast({
          title: "Notifikasi Diaktifkan",
          description: "Anda akan menerima notifikasi darurat penting.",
        });
      } else {
        setPermission('denied');
        onPermissionChange?.(false);
        toast({
          title: "Notifikasi Ditolak", 
          description: "Untuk mengaktifkan, buka pengaturan browser dan izinkan notifikasi.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast({
        title: "Error",
        description: "Gagal meminta izin notifikasi. Silakan coba lagi.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return {
          icon: <Bell className="h-4 w-4 text-green-600" />,
          text: 'Notifikasi Aktif',
          color: 'text-green-600'
        };
      case 'denied':
        return {
          icon: <BellOff className="h-4 w-4 text-red-600" />,
          text: 'Notifikasi Diblokir',
          color: 'text-red-600'
        };
      default:
        return {
          icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
          text: 'Notifikasi Belum Diatur',
          color: 'text-yellow-600'
        };
    }
  };

  const status = getPermissionStatus();

  if (showInline) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg bg-background border">
        {status.icon}
        <span className={`text-sm ${status.color}`}>{status.text}</span>
        {permission !== 'granted' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRequestPermission}
            disabled={isLoading}
            className="ml-auto"
          >
            {isLoading ? 'Meminta...' : 'Aktifkan'}
          </Button>
        )}
      </div>
    );
  }

  if (permission === 'granted') {
    return null; // Don't show anything if already granted
  }

  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <strong>Notifikasi Darurat Penting!</strong>
          <p className="text-sm mt-1">
            Aktifkan notifikasi untuk menerima peringatan darurat secara real-time.
          </p>
        </div>
        <Button
          onClick={handleRequestPermission}
          disabled={isLoading}
          className="ml-4"
        >
          {isLoading ? 'Meminta...' : 'Aktifkan Sekarang'}
        </Button>
      </AlertDescription>
    </Alert>
  );
};

export default NotificationPermissionHandler;