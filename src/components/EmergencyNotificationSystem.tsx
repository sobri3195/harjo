import React, { useEffect, useState } from 'react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { Bell, Users, Activity, Clock, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

const EmergencyNotificationSystem = () => {
  const { reports } = useEmergencyReports();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [lastReportCount, setLastReportCount] = useState(0);

  // Get active emergency reports
  const activeReports = reports.filter(report => report.status === 'pending');
  const newReports = activeReports.filter(report => {
    const reportTime = new Date(report.created_at);
    const now = new Date();
    const timeDiff = now.getTime() - reportTime.getTime();
    return timeDiff < 5 * 60 * 1000; // Less than 5 minutes old
  });

  // Auto-refresh for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // This will trigger re-render and check for new reports
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Show notification sound/alert for new reports and handle auto-show
  useEffect(() => {
    if (newReports.length > 0) {
      // Send push notification for new emergency reports
      if ('Notification' in window && Notification.permission === 'granted') {
        newReports.forEach(report => {
          new Notification('🚨 Laporan Darurat Baru!', {
            body: `${report.type === 'trauma' ? 'TRAUMA' : 'JANTUNG'} - ${report.patient_name} di ${report.location}`,
            icon: '/favicon.ico',
            tag: `emergency-${report.id}`,
            requireInteraction: true
          });
        });
        
        // Show toast notification
        toast({
          title: "🚨 Laporan Darurat Baru!",
          description: `${newReports.length} laporan darurat memerlukan perhatian`,
          variant: "destructive",
        });
      } else if ('Notification' in window && Notification.permission === 'default') {
        // Request notification permission
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            // Retry notification after permission granted
            newReports.forEach(report => {
              new Notification('🚨 Laporan Darurat Baru!', {
                body: `${report.type === 'trauma' ? 'TRAUMA' : 'JANTUNG'} - ${report.patient_name} di ${report.location}`,
                icon: '/favicon.ico',
                tag: `emergency-${report.id}`
              });
            });
          }
        });
      }
      
      console.log(`🚨 ${newReports.length} laporan darurat baru!`);
    }
    
    // Auto-show notification when new reports arrive
    if (activeReports.length > lastReportCount) {
      setIsDismissed(false);
    }
    setLastReportCount(activeReports.length);
  }, [newReports.length, activeReports.length, lastReportCount]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  const handleViewReports = () => {
    navigate('/admin');
  };

  if (activeReports.length === 0 || isDismissed) {
    return null;
  }

  return (
    <div 
      className="fixed right-4 z-[50] max-w-sm" 
      style={{ 
        top: 'max(env(safe-area-inset-top), 1rem)',
        zIndex: 50
      }}
    >
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 shadow-lg animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Bell className="text-red-600 mr-2" size={20} />
            <span className="font-bold text-red-800">Laporan Darurat</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
              {activeReports.length}
            </span>
            <button
              onClick={handleDismiss}
              className="text-red-400 hover:text-red-600 transition-colors p-1 hover:bg-red-100 rounded-full"
              title="Tutup notifikasi"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        <div className="space-y-2">
          {activeReports.slice(0, 2).map((report) => (
            <div key={report.id} className="text-sm">
              <div className="font-medium text-red-700">
                {report.type === 'trauma' ? '🚨 TRAUMA' : '❤️ JANTUNG'} - {report.patient_name}
              </div>
              <div className="text-red-600 text-xs">
                📍 {report.location} • {report.severity}
              </div>
            </div>
          ))}
          {activeReports.length > 2 && (
            <div className="text-xs text-red-600">
              +{activeReports.length - 2} laporan lainnya
            </div>
          )}
        </div>
        
        {/* Remove the "View All Reports" button by commenting it out */}
        {/* <Button 
          onClick={handleViewReports}
          size="sm"
          className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white"
        >
          Lihat Semua Laporan
        </Button> */}
      </div>
    </div>
  );
};

export default EmergencyNotificationSystem;