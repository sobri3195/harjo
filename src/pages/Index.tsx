import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Truck, Phone, MapPin, Clock, Users, Activity, Settings, History, Stethoscope, TrendingUp, AlertCircle, Zap } from 'lucide-react';
import Header from '@/components/Header';
import EmergencyButtons from '@/components/EmergencyButtons';
import EmergencyReportModal from '@/components/EmergencyReportModal';
import BottomNavigation from '@/components/BottomNavigation';
import NotificationPermissionHandler from '@/components/NotificationPermissionHandler';

import { useGeolocation } from "@/hooks/useGeolocation";
import PersonnelRegistration from '@/components/PersonnelRegistration';
import HistoryPage from '@/components/HistoryPage';
import MedicalTeamPage from '@/components/MedicalTeamPage';
import SettingsPage from '@/components/SettingsPage';
import RealTimeLocationMap from '@/components/maps/RealTimeLocationMap';
import RealTimeAmbulanceTracker from '@/components/RealTimeAmbulanceTracker';
import AmbulanceTracker from '@/components/AmbulanceTracker';
import { UserGPSPermissionDialog } from "@/components/user/UserGPSPermissionDialog";
import { useRealtimeEmergencyReports } from '@/hooks/useRealtimeEmergencyReports';
import { useRealtimeAmbulanceStatus } from '@/hooks/useRealtimeAmbulanceStatus';
import { useAmbulanceDrivers } from '@/hooks/useAmbulanceDrivers';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ConnectionStatus from '@/components/ConnectionStatus';
import MobileNotificationPanel from '@/components/MobileNotificationPanel';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  // Get initial tab from URL hash or default to 'home'
  const getInitialTab = () => {
    const hash = window.location.hash.slice(1);
    const validTabs = ['home', 'register', 'history', 'team', 'settings'];
    return validTabs.includes(hash) ? hash : 'home';
  };
  
  const [activeTab, setActiveTab] = useState(() => getInitialTab());
  const [showGPSDialog, setShowGPSDialog] = useState(false);
  
  const { reports, loading: reportsLoading } = useRealtimeEmergencyReports();
  const { ambulances, loading: ambulanceLoading, isConnected } = useRealtimeAmbulanceStatus();
  const { drivers, loading: driversLoading } = useAmbulanceDrivers();
  const { user, signOut, signInAnonymously, loading: authLoading } = useAuth();
  const { permissionState, getCurrentLocation, requestPermission } = useGeolocation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Check GPS permission for emergency reporting
  useEffect(() => {
    if (user && (permissionState === 'denied' || permissionState === 'prompt')) {
      setShowGPSDialog(true);
    }
  }, [user, permissionState]);

  // Request notification permission on first visit
  useEffect(() => {
    if (user && 'Notification' in window && Notification.permission === 'default') {
      // Auto-request notification permission for emergency alerts
      setTimeout(() => {
        Notification.requestPermission();
      }, 2000); // Delay to not overwhelm user
    }
  }, [user]);

  // Handle navigation state persistence and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['home', 'register', 'history', 'team', 'settings'];
      if (validTabs.includes(hash) && hash !== activeTab) {
        setActiveTab(hash);
      }
    };

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    // Handle browser back button properly
    const handlePopState = (event: PopStateEvent) => {
      // Let hash change handle tab switching instead
      const hash = window.location.hash.slice(1);
      if (!hash) {
        window.location.hash = 'home';
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    // Set initial hash if none exists
    if (!window.location.hash) {
      window.location.hash = activeTab;
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [activeTab]);


  // Memoized emergency destinations to prevent unnecessary re-renders
  const emergencyDestinations = useMemo(() => {
    if (reportsLoading || !reports) return [];
    
    return reports
      .filter(report => report.status === 'pending' && report.latitude && report.longitude)
      .map(emergency => ({
        id: emergency.id,
        name: `${emergency.type === 'trauma' ? 'TRAUMA' : 'JANTUNG'} - ${emergency.patient_name}`,
        lat: emergency.latitude!,
        lng: emergency.longitude!,
        type: 'emergency' as const,
        address: emergency.location
      }));
  }, [reports, reportsLoading]);

  // Memoized active drivers for real-time tracking
  const activeDrivers = useMemo(() => {
    if (driversLoading || !drivers) return [];
    return drivers.filter(driver => driver.status === 'active');
  }, [drivers, driversLoading]);

  // Real-time statistics
  const realtimeStats = useMemo(() => {
    const pendingReports = reports.filter(r => r.status === 'pending').length;
    const activeReports = reports.filter(r => r.status === 'dalam_penanganan').length;
    const criticalReports = reports.filter(r => r.severity === 'berat' && r.status !== 'selesai').length;
    const activeAmbulances = ambulances.filter(a => 
      ['dispatched', 'en_route', 'arrived'].includes(a.status)
    ).length;
    
    return {
      pendingReports,
      activeReports,
      criticalReports,
      activeAmbulances,
      totalReports: reports.length,
      activeDrivers: activeDrivers.length
    };
  }, [reports, ambulances, activeDrivers]);

  // Show toast for new critical emergencies
  useEffect(() => {
    const criticalEmergencies = reports.filter(r => 
      r.severity === 'berat' && 
      r.status === 'pending' &&
      new Date(r.created_at).getTime() > Date.now() - 10000 // Last 10 seconds  
    );

    criticalEmergencies.forEach(emergency => {
      toast({
        title: "🚨 EMERGENCY KRITIS!",
        description: `${emergency.type.toUpperCase()} - ${emergency.patient_name} di ${emergency.location}`,
        variant: "destructive",
      });
    });
  }, [reports, toast]);

  // State for emergency report modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'trauma' | 'heart'>('trauma');

  // Emergency report handlers - open modal instead of navigate
  const handleTraumaReport = useCallback(() => {
    setReportType('trauma');
    setIsReportModalOpen(true);
  }, []);

  const handleHeartReport = useCallback(() => {
    setReportType('heart');
    setIsReportModalOpen(true);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    if (tab !== activeTab) {
      setActiveTab(tab);
      // Update hash for persistence across refreshes
      window.location.hash = tab;
    }
  }, [activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Welcome Section - Responsive */}
            <div className="bg-gradient-to-br from-navy-blue-50 to-military-green-50 rounded-2xl p-4 md:p-6 mx-4 md:mx-6 mt-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Selamat Datang</h2>
              <p className="text-gray-600 text-sm">
                Sistem darurat RSPAU dr. Suhardi Harjolukito. Gunakan tombol di bawah untuk melaporkan kasus darurat.
              </p>
            </div>
            
            {/* Mobile Notification Panel */}
            <div className="mx-4 md:mx-6">
              <MobileNotificationPanel variant="index" />
            </div>
            
            {/* Emergency Buttons - Optimized */}
            <div className="px-4 md:px-6">
              <EmergencyButtons 
                onTraumaReport={handleTraumaReport}
                onHeartReport={handleHeartReport}
              />
            </div>
            
            {/* Authentication Section - Responsive */}
            {!user && !authLoading && (
              <div className="mx-4 md:mx-6 bg-white rounded-xl shadow-md p-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                  <LogIn className="mr-2" size={20} />
                  Access Required
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Please sign in to access live location sharing and emergency features.
                </p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <Button onClick={() => navigate('/auth')} className="flex-1">
                    Sign In / Sign Up
                  </Button>
                  <Button onClick={signInAnonymously} variant="outline" className="flex-1">
                    Quick Access
                  </Button>
                </div>
              </div>
            )}

            {/* GPS & Real-time Tracking Section */}
            {user && (
              <>
                {/* GPS Status - Responsive */}
                <div className="mx-4 md:mx-6 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-blue-800 flex items-center gap-2 text-sm md:text-base">
                      <MapPin size={16} className="md:size-18" />
                      Aktivasi GPS & Lokasi
                    </h3>
                    <div className={`w-3 h-3 rounded-full ${
                      permissionState === 'granted' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
                    }`} />
                  </div>
                  
                  {permissionState === 'granted' ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-700">
                        ✅ GPS aktif dan siap melacak lokasi untuk emergency
                      </p>
                      <Button 
                        onClick={getCurrentLocation}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      >
                        <MapPin size={14} />
                        Refresh Lokasi
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-blue-700">
                        📍 Aktifkan GPS untuk pelaporan darurat dan tracking real-time
                      </p>
                      <Button 
                        onClick={() => setShowGPSDialog(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-1"
                      >
                        <MapPin size={14} />
                        Aktifkan GPS Sekarang
                      </Button>
                    </div>
                  )}
                </div>

            {/* Real-time Emergency Reports */}
            <div className="mx-4 md:mx-6">
              <Card className="border-l-4 border-l-emergency-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-emergency-red-600 flex items-center gap-2">
                      <AlertCircle size={16} className="animate-pulse" />
                      Laporan Darurat Live
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-500">Live</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {reportsLoading ? (
                    <div className="text-center text-sm text-gray-500 py-4">Loading emergency reports...</div>
                  ) : reports.filter(r => r.status !== 'selesai').length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {reports
                        .filter(r => r.status !== 'selesai')
                        .slice(0, 3)
                        .map((report) => (
                          <div key={report.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                report.severity === 'berat' ? 'bg-red-500 animate-pulse' :
                                report.severity === 'sedang' ? 'bg-yellow-500' : 'bg-green-500'
                              }`} />
                              <div>
                                <div className="text-sm font-medium">{report.type.toUpperCase()}</div>
                                <div className="text-xs text-gray-500">{report.patient_name}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge 
                                variant={report.status === 'pending' ? 'destructive' : 'default'}
                                className="text-xs"
                              >
                                {report.status === 'pending' ? 'PENDING' : 'DITANGANI'}
                              </Badge>
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(report.created_at).toLocaleTimeString('id-ID', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-sm text-gray-500 py-4">
                      Tidak ada laporan darurat aktif
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Real-time Driver Tracking */}
                <div className="mx-4 md:mx-6 space-y-4">
                  <div className="bg-white rounded-xl shadow-md overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-sm md:text-base text-primary flex items-center gap-2">
                          <Truck size={16} />
                          Driver Ambulans Real-time
                          {isConnected && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></div>}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {activeDrivers.length} Aktif
                        </Badge>
                      </div>
                    </div>
                    
                  {/* Driver List - Optimized for mobile */}
                  <div className="p-4 space-y-3 max-h-48 overflow-y-auto">
                    {driversLoading ? (
                      <div className="text-center text-sm text-gray-500">Loading driver data...</div>
                    ) : activeDrivers.length > 0 ? (
                      activeDrivers.slice(0, 3).map((driver) => (
                        <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Truck size={14} className="text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">{driver.nama}</div>
                              <div className="text-xs text-gray-500">{driver.unit_ambulans}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant="default" 
                              className="bg-green-600 text-white text-xs animate-pulse"
                            >
                              Online
                            </Badge>
                            {driver.lokasi_terakhir && (
                              <div className="text-xs text-gray-400 mt-1 truncate max-w-20">
                                {driver.lokasi_terakhir}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-gray-500">
                        Tidak ada driver aktif saat ini
                      </div>
                    )}
                  </div>
                </div>

                {/* Real-time Ambulance Tracker */}
                <RealTimeAmbulanceTracker />

                {/* Compact Location Map */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-primary/5">
                    <h3 className="font-medium text-sm text-primary flex items-center gap-2">
                      <MapPin size={14} />
                      Peta Lokasi Real-time
                    </h3>
                  </div>
                  <div className="relative" style={{ height: '160px' }}>
                    <RealTimeLocationMap 
                      role="user"
                      userName={user.user_metadata?.full_name || user.email || "User"}
                      height="160px"
                      showControls={false}
                      showLocationList={false}
                    />
                  </div>
                </div>
                
                {/* Compact Ambulance Tracker */}
                <AmbulanceTracker 
                  maxItems={2}
                  showMap={false}
                />
              </div>

                {/* Sign Out Button */}
                <div className="mx-4 md:mx-6">
                  <Button 
                    variant="outline" 
                    onClick={signOut}
                    className="w-full text-sm"
                  >
                    Sign Out ({user.email?.substring(0, 20) + (user.email && user.email.length > 20 ? '...' : '')})
                  </Button>
                </div>
              </>
            )}
            
            {/* Real-time Statistics Dashboard */}
            <div className="mx-4 md:mx-6">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                    <TrendingUp size={16} />
                    Statistik Real-time
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse ml-1"></div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="text-xl font-bold text-green-600 flex items-center justify-center gap-1">
                        {realtimeStats.activeDrivers}
                        <Zap size={12} className="text-green-500 animate-pulse" />
                      </div>
                      <div className="text-xs text-green-700">Driver Aktif</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-xl font-bold text-blue-600 flex items-center justify-center gap-1">
                        {realtimeStats.totalReports}
                        <Zap size={12} className="text-blue-500 animate-pulse" />
                      </div>
                      <div className="text-xs text-blue-700">Total Laporan</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg">
                      <div className="text-xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                        {realtimeStats.activeReports}
                        <Zap size={12} className="text-yellow-500 animate-pulse" />
                      </div>
                      <div className="text-xs text-yellow-700">Ditangani</div>
                    </div>
                    
                    <div className="text-center p-3 bg-gradient-to-br from-red-50 to-red-100 rounded-lg">
                      <div className="text-xl font-bold text-red-600 flex items-center justify-center gap-1">
                        {realtimeStats.criticalReports}
                        {realtimeStats.criticalReports > 0 && <AlertCircle size={12} className="text-red-500 animate-pulse" />}
                      </div>
                      <div className="text-xs text-red-700">Kritis</div>
                    </div>
                  </div>
                  
                  {/* Live Update Indicator */}
                  <div className="mt-3 text-center">
                    <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                      Live update • Terakhir: {new Date().toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions - Only show when not on home route */}
            {location.pathname !== '/' && (
              <div className="mx-4 md:mx-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/ambulance')}
                  className="bg-emergency-red-600 hover:bg-emergency-red-700 text-white rounded-xl p-4 text-left transition-colors"
                >
                  <div className="text-lg mb-1">🚑</div>
                  <div className="font-semibold text-sm md:text-base">Ambulans</div>
                  <div className="text-xs opacity-90">Tanggap Darurat</div>
                </button>
                <button
                  onClick={() => navigate('/admin')}
                  className="bg-navy-blue-600 hover:bg-navy-blue-700 text-white rounded-xl p-4 text-left transition-colors"
                >
                  <div className="text-lg mb-1">👨‍💼</div>
                  <div className="font-semibold text-sm md:text-base">Admin</div>
                  <div className="text-xs opacity-90">Panel Kontrol</div>
                </button>
              </div>
            )}
          </div>
        );
      case 'register':
        return <PersonnelRegistration />;
      case 'history':
        return <HistoryPage />;
      case 'team':
        return <MedicalTeamPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Notification Permission Handler */}
      <div className="px-4 md:px-6">
        <NotificationPermissionHandler />
      </div>
      
      {/* Connection Status Indicator */}
      <ConnectionStatus />
      
      {/* Main Content - Optimized scrolling */}
      <main className="flex-1 pb-20 overflow-y-auto scrollbar-hide">
        {renderContent()}
      </main>
      
      {/* Bottom Navigation - Stable positioning */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />
      </div>

      {/* GPS Permission Dialog */}
      <UserGPSPermissionDialog
        open={showGPSDialog}
        onOpenChange={setShowGPSDialog}
        onPermissionGranted={() => {
          setShowGPSDialog(false);
          getCurrentLocation();
        }}
      />
      
      {/* Emergency Report Modal */}
      <EmergencyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type={reportType}
      />
    </div>
  );
};

export default Index;