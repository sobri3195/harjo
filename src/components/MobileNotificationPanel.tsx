import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, Smartphone, AlertTriangle, CheckCircle, Settings, Database } from 'lucide-react';
import { useCapacitorNotifications } from '@/hooks/useCapacitorNotifications';
import { useSupabaseNotifications } from '@/hooks/useSupabaseNotifications';
import { useRealtimeEmergencyReports } from '@/hooks/useRealtimeEmergencyReports';
import { useAuth } from '@/contexts/AuthContext';

interface MobileNotificationPanelProps {
  variant?: 'index' | 'ambulance';
  className?: string;
}

const MobileNotificationPanel: React.FC<MobileNotificationPanelProps> = ({ 
  variant = 'index',
  className = '' 
}) => {
  const {
    isSupported,
    permission,
    isEnabled,
    isCapacitor,
    requestPermission,
    testNotification
  } = useCapacitorNotifications();

  const {
    notifications,
    isLoading,
    sendEmergencyNotification,
    getNotificationHistory
  } = useSupabaseNotifications();

  const { reports } = useRealtimeEmergencyReports();
  const { user } = useAuth();
  const [lastReportCount, setLastReportCount] = useState(0);
  const [dbConnected, setDbConnected] = useState(false);

  // Handle permission state properly
  const isPermissionGranted = permission === 'granted';

  // Test database connection
  useEffect(() => {
    const testDbConnection = async () => {
      try {
        await getNotificationHistory();
        setDbConnected(true);
      } catch (error) {
        console.error('Database connection failed:', error);
        setDbConnected(false);
      }
    };

    if (user) {
      testDbConnection();
    }
  }, [user, getNotificationHistory]);

  // Monitor new emergency reports and send notifications via Supabase
  useEffect(() => {
    if (!reports || !user || !dbConnected) return;

    const activeReports = reports.filter(report => report.status === 'pending');
    
    if (activeReports.length > lastReportCount && lastReportCount > 0) {
      // New emergency detected
      const latestReport = activeReports[activeReports.length - 1];
      
      if (variant === 'index') {
        sendEmergencyNotification(
          latestReport.type as 'trauma' | 'heart',
          `Kasus ${latestReport.type.toUpperCase()} dilaporkan di ${latestReport.location}`,
          latestReport.id
        );
      } else if (variant === 'ambulance') {
        sendEmergencyNotification(
          'ambulance',
          `Panggilan darurat ${latestReport.type.toUpperCase()} - ${latestReport.patient_name} di ${latestReport.location}`,
          latestReport.id
        );
      }
    }
    
    setLastReportCount(activeReports.length);
  }, [reports, lastReportCount, user, variant, sendEmergencyNotification, dbConnected]);

  // Auto-request permission for emergency system
  useEffect(() => {
    if (user && permission === 'prompt' && isSupported) {
      // Auto request after 2 seconds to not overwhelm user
      const timer = setTimeout(() => {
        requestPermission();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user, permission, isSupported, requestPermission]);

  const getStatusIcon = () => {
    if (!isSupported) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (!isEnabled) return <Bell className="w-5 h-5 text-gray-400" />;
    return <BellRing className="w-5 h-5 text-green-600" />;
  };

  const getStatusText = () => {
    if (!isSupported) return 'Tidak Didukung';
    if (!dbConnected) return 'DB Offline';
    if (!isPermissionGranted) return 'Nonaktif';
    return 'Aktif & Terhubung';
  };

  const getStatusColor = () => {
    if (!isSupported) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (!dbConnected) return 'bg-red-100 text-red-800 border-red-200';
    if (!isPermissionGranted) return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getVariantTitle = () => {
    return variant === 'index' 
      ? '🔔 Notifikasi Darurat' 
      : '🚑 Alert Ambulans';
  };

  const getVariantDescription = () => {
    return variant === 'index'
      ? 'Terima notifikasi real-time untuk kasus darurat di area Anda'
      : 'Dapatkan panggilan darurat langsung ke unit ambulans';
  };

  if (!user) return null;

  return (
    <Card className={`border-l-4 border-l-primary ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {isCapacitor ? <Smartphone className="w-5 h-5 text-primary" /> : getStatusIcon()}
            </div>
            <div>
              <CardTitle className="text-base">{getVariantTitle()}</CardTitle>
              <CardDescription className="text-sm mt-1">
                {getVariantDescription()}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={`text-xs ${getStatusColor()}`}
          >
            {isCapacitor ? 'Mobile App' : 'Web'} • {getStatusText()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Status Information */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            {getStatusIcon()}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">
                Status Notifikasi: <span className={
                  isEnabled && dbConnected ? 'text-green-600' : 'text-gray-600'
                }>
                  {getStatusText()}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isCapacitor 
                  ? 'Notifikasi native untuk Android APK'
                  : 'Notifikasi browser web untuk preview'
                }
              </p>
              
              {/* Database Status */}
              <div className="flex items-center gap-1 mt-1">
                <Database className={`w-3 h-3 ${dbConnected ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`text-xs ${dbConnected ? 'text-green-600' : 'text-red-600'}`}>
                  Database: {dbConnected ? 'Terhubung' : 'Offline'}
                </span>
              </div>

              {/* Notification Count */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Bell className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600">
                    {notifications.length} notifikasi diterima
                  </span>
                </div>
              )}

              {isEnabled && dbConnected && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">
                    Siap menerima alert darurat via Supabase
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2">
          {!isEnabled ? (
            <Button 
              onClick={requestPermission}
              className="flex-1 bg-primary hover:bg-primary/90"
              size="sm"
            >
              <Bell className="w-4 h-4 mr-2" />
              Aktifkan Notifikasi
            </Button>
          ) : (
            <Button 
              onClick={testNotification}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              <BellRing className="w-4 h-4 mr-2" />
              Test Notification
            </Button>
          )}
          
          <Button 
            variant="ghost" 
            size="sm"
            className="px-3"
            onClick={() => {
              // Open device settings (Capacitor will handle this in native app)
              if (isCapacitor) {
                console.log('Opening app notification settings...');
              } else {
                alert('Buka pengaturan browser untuk mengelola notifikasi');
              }
            }}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Emergency Types */}
        {variant === 'index' && (
          <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-2">
            <p className="font-medium text-blue-800 mb-1">Jenis Alert yang Diterima:</p>
            <ul className="space-y-0.5">
              <li>• 🚨 Kasus Trauma Darurat</li>
              <li>• ❤️ Serangan Jantung</li>
              <li>• 🚑 Update Status Ambulans</li>
              <li>• 📍 Panggilan Terdekat</li>
            </ul>
          </div>
        )}

        {variant === 'ambulance' && (
          <div className="text-xs text-gray-500 bg-orange-50 rounded-lg p-2">
            <p className="font-medium text-orange-800 mb-1">Alert Ambulans:</p>
            <ul className="space-y-0.5">
              <li>• 🚨 Dispatch panggilan darurat</li>
              <li>• 📍 Lokasi dan navigasi</li>
              <li>• 👥 Info pasien dan kondisi</li>
              <li>• 🏥 Update rumah sakit tujuan</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MobileNotificationPanel;