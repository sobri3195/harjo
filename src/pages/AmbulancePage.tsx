
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AmbulanceHeader from '@/components/ambulance/AmbulanceHeader';
import AmbulanceEmergencyButtons from '@/components/ambulance/AmbulanceEmergencyButtons';
import AmbulanceBottomNavigation from '@/components/ambulance/AmbulanceBottomNavigation';
import AmbulanceStatusPage from '@/components/ambulance/AmbulanceStatusPage';
import AmbulanceNavigationPage from '@/components/ambulance/AmbulanceNavigationPage';
import AmbulanceReportsPage from '@/components/ambulance/AmbulanceReportsPage';
import AmbulanceSettingsPage from '@/components/ambulance/AmbulanceSettingsPage';
import AmbulancePersonnelPage from '@/components/ambulance/AmbulancePersonnelPage';
import AmbulanceEmergencyDashboard from '@/components/ambulance/AmbulanceEmergencyDashboard';
import GoogleMapsSetup from '@/components/GoogleMapsSetup';
import { GPSPermissionDialog } from '@/components/ambulance/GPSPermissionDialog';
import { usePersonnel } from '@/hooks/usePersonnel';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { useEmergencyAuth } from '@/hooks/useEmergencyAuth';
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapPin, Navigation, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import MobileNotificationPanel from '@/components/MobileNotificationPanel';

const AmbulancePage = () => {
  // Get initial tab from URL hash or default to 'home'
  const getInitialTab = () => {
    const hash = window.location.hash.slice(1);
    const validTabs = ['home', 'emergency', 'status', 'navigation', 'settings'];
    return validTabs.includes(hash) ? hash : 'home';
  };

  const [activeTab, setActiveTab] = useState(() => getInitialTab());
  const [showGPSDialog, setShowGPSDialog] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { personnel } = usePersonnel();
  const { reports } = useEmergencyReports();
  const { ensureAuthenticated } = useEmergencyAuth();

  // Get emergency type from query parameters
  const searchParams = new URLSearchParams(location.search);
  const emergencyType = searchParams.get('type') as 'trauma' | 'heart' | null;

  // Direct geolocation for permission handling
  const {
    permissionState,
    error: gpsError,
    loading: gpsLoading,
    getCurrentLocation,
    requestPermission
  } = useGeolocation();

  // Initialize location sharing for ambulance - Always start GPS
  const {
    isSharing,
    startSharing,
    stopSharing,
    allLocations,
    myLocation,
    error: locationError
  } = useLocationSharing({
    role: 'ambulance',
    userName: 'AMB-01 Unit Ambulans',
    enabled: true,
    updateInterval: 5000 // Update every 5 seconds
  });

  // Auto-start GPS tracking when permission is granted
  useEffect(() => {
    if (permissionState === 'granted' && !isSharing) {
      startSharing();
    }
  }, [permissionState, isSharing, startSharing]);

  // Show GPS permission dialog on mount if needed
  useEffect(() => {
    if (permissionState === 'denied' || (permissionState === 'prompt' && !showGPSDialog)) {
      setShowGPSDialog(true);
    }
  }, [permissionState, showGPSDialog]);

  // Handle hash changes for tab navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['home', 'emergency', 'status', 'navigation', 'settings'];
      if (validTabs.includes(hash) && hash !== activeTab) {
        setActiveTab(hash);
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial tab based on hash when component mounts
    const initialHash = window.location.hash.slice(1);
    if (initialHash && ['home', 'emergency', 'status', 'navigation', 'settings'].includes(initialHash)) {
      setActiveTab(initialHash);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [activeTab]);

  // Auto-authenticate for emergency access
  useEffect(() => {
    ensureAuthenticated();
  }, [ensureAuthenticated]);

  // Filter for active calls (not completed)
  const activeCalls = reports.filter(report => report.status === 'pending');

  // Auto light mode (white theme)
  useEffect(() => {
    // Force light mode
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            
            {/* GPS Permission & Location Status */}
            <div className="bg-gradient-to-br from-navy-blue-50 to-primary/10 rounded-2xl p-4 mx-6 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <MapPin size={18} />
                  GPS Tracking Status
                </h3>
                <div className={`w-3 h-3 rounded-full ${
                  isSharing && permissionState === 'granted' 
                    ? 'bg-green-500 animate-pulse' 
                    : permissionState === 'denied' 
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
                }`} />
              </div>

              {/* Permission Status */}
              {permissionState === 'denied' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-800 mb-1">Izin Lokasi Diperlukan</p>
                      <p className="text-xs text-red-700 mb-2">
                        Untuk mengaktifkan GPS tracking:
                      </p>
                      <ol className="text-xs text-red-700 list-decimal list-inside space-y-1 mb-3">
                        <li>Klik ikon gembok/lokasi di address bar</li>
                        <li>Pilih "Izinkan" untuk akses lokasi</li>
                        <li>Klik tombol "Aktifkan GPS" di bawah</li>
                      </ol>
                      <Button
                        size="sm"
                        onClick={() => setShowGPSDialog(true)}
                        className="bg-red-600 hover:bg-red-700 text-white gap-1"
                      >
                        <RefreshCw size={12} />
                        Aktifkan GPS
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Normal Status */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {permissionState === 'granted' 
                      ? (isSharing ? 'Location sedang dibagikan secara real-time' : 'GPS siap, klik Start untuk mulai tracking')
                      : permissionState === 'checking' || gpsLoading
                        ? 'Meminta izin akses lokasi...'
                        : permissionState === 'denied'
                          ? 'Izin lokasi ditolak'
                          : 'Menunggu persetujuan akses lokasi'
                    }
                  </p>
                  
                  {(locationError || gpsError) && permissionState !== 'denied' && (
                    <p className="text-xs text-orange-600 mt-1">
                      {locationError || gpsError}
                    </p>
                  )}

                  {permissionState === 'granted' && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ GPS permission granted
                    </p>
                  )}
                </div>
                
                {permissionState === 'granted' && (
                  <div className="flex gap-2 ml-4">
                    {!isSharing ? (
                      <Button 
                        size="sm" 
                        onClick={startSharing}
                        className="gap-2"
                        disabled={gpsLoading}
                      >
                        <Navigation size={14} />
                        Start GPS
                      </Button>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={stopSharing}
                      >
                        Stop GPS
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={getCurrentLocation}
                      disabled={gpsLoading}
                    >
                      <RefreshCw size={14} className={gpsLoading ? 'animate-spin' : ''} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-emergency-red-50 to-heart-red-50 rounded-2xl p-6 mx-6">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🚑 Unit Ambulans Terpantau</h2>
              <p className="text-gray-600 text-sm">
                Sistem ambulans RSPAU dr. Suhardi Harjolukito dengan panduan Google Maps real-time. Siap melayani panggilan darurat 24/7.
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isSharing && permissionState === 'granted' 
                    ? 'bg-green-500 animate-pulse' 
                    : permissionState === 'denied' 
                      ? 'bg-red-500' 
                      : 'bg-yellow-500'
                }`} />
                <span className={`text-sm font-medium ${
                  isSharing && permissionState === 'granted' 
                    ? 'text-green-700' 
                    : permissionState === 'denied' 
                      ? 'text-red-700' 
                      : 'text-yellow-700'
                }`}>
                  Status: {
                    permissionState === 'denied' 
                      ? 'PERLU IZIN GPS' 
                      : isSharing && permissionState === 'granted' 
                        ? 'SIAP & TERPANDU' 
                        : 'STANDBY'
                  }
                </span>
              </div>
            </div>
            
            {/* Mobile Notification Panel for Ambulance */}
            <div className="mx-6">
              <MobileNotificationPanel variant="ambulance" />
            </div>
            
            <AmbulanceEmergencyButtons />
            
            {/* Quick Stats */}
            <div className="mx-6 grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-emergency-red-600">{activeCalls.length}</div>
                <div className="text-xs text-gray-600">Panggilan Aktif</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-navy-blue-600">{allLocations.length}</div>
                <div className="text-xs text-gray-600">Lokasi Terpantau</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-2xl font-bold text-military-green-600">{personnel.length}</div>
                <div className="text-xs text-gray-600">Total Personel</div>
              </div>
            </div>
          </div>
        );
      case 'status':
        return <AmbulanceStatusPage />;
      case 'navigation':
        return <AmbulanceNavigationPage />;
      case 'emergency':
        return <AmbulanceEmergencyDashboard emergencyType={emergencyType} />;
      case 'settings':
        return <AmbulanceSettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      <AmbulanceHeader />
      
      <main className="flex-1 safe-content scroll-container">
        {renderContent()}
      </main>
      
      <AmbulanceBottomNavigation 
        activeTab={activeTab} 
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.location.hash = tab;
        }} 
      />
      
      <GPSPermissionDialog
        open={showGPSDialog}
        onOpenChange={setShowGPSDialog}
        onPermissionGranted={() => {
          setShowGPSDialog(false);
          startSharing();
        }}
      />
    </div>
  );
};

export default AmbulancePage;
