
import React, { useState, useEffect } from 'react';
import { Phone, Clock, MapPin, AlertTriangle, Navigation, CheckCircle, Truck } from 'lucide-react';
import { useEmergencyCallSystem } from '@/hooks/useEmergencyCallSystem';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { useAdvancedGPS } from '@/hooks/useAdvancedGPS';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RealTimeAmbulanceMap } from '@/components/maps/RealTimeAmbulanceMap';
import { OfflineMapCache } from '@/components/ambulance/OfflineMapCache';
import IntegratedNavigation from '@/components/navigation/IntegratedNavigation';
import EmergencyReportModal from '@/components/EmergencyReportModal';

interface AmbulanceEmergencyDashboardProps {
  emergencyType?: 'trauma' | 'heart' | null;
}

const AmbulanceEmergencyDashboard: React.FC<AmbulanceEmergencyDashboardProps> = ({ 
  emergencyType = null 
}) => {
  const { emergencyCalls, updateCallStatus, activeCall, setActiveEmergencyCall } = useEmergencyCallSystem();
  const { reports } = useEmergencyReports();
  const [selectedCall, setSelectedCall] = useState<string | null>(null);
  const [showOfflineCache, setShowOfflineCache] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'trauma' | 'heart'>(emergencyType || 'trauma');
  
  // Update modal type when emergency type changes
  useEffect(() => {
    if (emergencyType) {
      setModalType(emergencyType);
      setIsReportModalOpen(true); // Auto-open modal for direct emergency routing
    }
  }, [emergencyType]);

  // Show alert when emergency type is detected from URL
  useEffect(() => {
    if (emergencyType) {
      console.log(`🚨 Emergency routing detected: ${emergencyType.toUpperCase()}`);
    }
  }, [emergencyType]);
  
  // Use ambulance ID - in real app this would come from auth context
  const ambulanceId = 'AMB-001';
  const {
    currentPosition,
    isTracking,
    speed,
    heading,
    accuracy,
    routeData,
    eta,
    error,
    isOnline,
    offlineQueue,
    startTracking,
    stopTracking,
    getTrafficAwareRoute,
    dispatchToEmergency
  } = useAdvancedGPS(ambulanceId);

  const activeCalls = emergencyCalls.filter(call => call.status !== 'selesai');
  const currentCall = activeCall || activeCalls[0];

  const getReportDetails = (reportId: string) => {
    return reports.find(r => r.id === reportId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'diterima': return 'bg-blue-500';
      case 'dalam_perjalanan': return 'bg-yellow-500';
      case 'tiba_di_lokasi': return 'bg-orange-500';
      case 'selesai': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStatusUpdate = (callId: string, status: string) => {
    updateCallStatus(callId, status as any);
    if (status === 'dalam_perjalanan') {
      setActiveEmergencyCall(callId);
      // Auto-route to emergency location if we have coordinates
      const call = emergencyCalls.find(c => c.id === callId);
      if (call && call.location.lat && call.location.lng) {
        getTrafficAwareRoute({
          lat: call.location.lat,
          lng: call.location.lng
        });
      }
    }
  };

  const [showNavigation, setShowNavigation] = useState<string | null>(null);

  const openNavigation = (address: string, coordinates?: { lat: number; lng: number }) => {
    // Show integrated navigation instead of just opening new tab
    if (coordinates) {
      setShowNavigation(JSON.stringify({ coordinates, address }));
    } else {
      // Fallback for address-only
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  };

  const handleEmergencyReport = (type: 'trauma' | 'heart') => {
    setModalType(type);
    setIsReportModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🚑 Emergency Response</h2>
        <div className="flex items-center space-x-2">
          <Badge variant={isOnline ? "default" : "destructive"}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Badge variant={isTracking ? "default" : "secondary"}>
            {isTracking ? 'GPS Active' : 'GPS Inactive'}
          </Badge>
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {activeCalls.length} Active
          </div>
        </div>
      </div>

      {/* GPS Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Ambulance Status - {ambulanceId}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium">
                {currentPosition ? 
                  `${currentPosition.latitude.toFixed(6)}, ${currentPosition.longitude.toFixed(6)}` : 
                  'Unknown'
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Speed</div>
              <div className="font-medium">{Math.round(speed * 3.6)} km/h</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
              <div className="font-medium">±{Math.round(accuracy)}m</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ETA</div>
              <div className="font-medium">
                {eta ? eta.toLocaleTimeString() : 'N/A'}
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {!isOnline && offlineQueue > 0 && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
              {offlineQueue} GPS positions queued for sync
            </div>
          )}

          <div className="flex gap-2 mt-3">
            {!isTracking ? (
              <Button onClick={startTracking} size="sm">
                Start GPS Tracking
              </Button>
            ) : (
              <Button onClick={stopTracking} variant="outline" size="sm">
                Stop GPS Tracking
              </Button>
            )}
            <Button 
              onClick={() => setShowOfflineCache(!showOfflineCache)} 
              variant="outline" 
              size="sm"
            >
              {showOfflineCache ? 'Hide' : 'Show'} Offline Maps
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Offline Map Cache */}
      {showOfflineCache && (
        <OfflineMapCache currentLocation={
          currentPosition ? {
            lat: currentPosition.latitude,
            lng: currentPosition.longitude
          } : undefined
        } />
      )}

        {/* Real-time Map - Responsive container */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">Live Ambulance Tracking</CardTitle>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            <div className="map-container w-full bg-gray-100 rounded-lg overflow-hidden">
              <div style={{ height: "300px", position: 'relative' }}>
                <RealTimeAmbulanceMap 
                  height="300px"
                  showControls={false}
                  emergencyLocation={
                    currentCall && currentCall.location.lat && currentCall.location.lng ? {
                      lat: currentCall.location.lat,
                      lng: currentCall.location.lng
                    } : undefined
                  }
                  onAmbulanceSelect={(ambulanceId) => {
                    console.log('Selected ambulance:', ambulanceId);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Current Active Call */}
      {currentCall && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-red-800 flex items-center">
              <AlertTriangle className="mr-2" size={24} />
              PANGGILAN AKTIF
            </h3>
            <div className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getStatusColor(currentCall.status)}`}>
              {currentCall.status.replace('_', ' ').toUpperCase()}
            </div>
          </div>

          {(() => {
            const report = getReportDetails(currentCall.reportId);
            return report && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700 w-20">ID:</span>
                    <span className="text-gray-800">#{currentCall.id.slice(-8)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700 w-20">Jenis:</span>
                    <span className="text-gray-800 capitalize">{report.type}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700 w-20">Pasien:</span>
                    <span className="text-gray-800">{report.patient_name}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-semibold text-gray-700 w-20">Pelapor:</span>
                    <span className="text-gray-800">{report.reporter_name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start">
                    <MapPin className="mr-2 mt-1 text-red-600" size={16} />
                    <div>
                      <span className="font-semibold text-gray-700">Lokasi:</span>
                      <p className="text-gray-800">{currentCall.location.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Clock className="mr-2 mt-1 text-blue-600" size={16} />
                    <div>
                      <span className="font-semibold text-gray-700">Waktu:</span>
                      <p className="text-gray-800">{new Date(currentCall.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-4">
            {currentCall.status === 'diterima' && (
              <Button
                onClick={() => handleStatusUpdate(currentCall.id, 'dalam_perjalanan')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                🚑 Mulai Perjalanan
              </Button>
            )}
            {currentCall.status === 'dalam_perjalanan' && (
              <Button
                onClick={() => handleStatusUpdate(currentCall.id, 'tiba_di_lokasi')}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                📍 Tiba di Lokasi
              </Button>
            )}
            {currentCall.status === 'tiba_di_lokasi' && (
              <Button
                onClick={() => handleStatusUpdate(currentCall.id, 'selesai')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                ✅ Selesaikan
              </Button>
            )}
            <Button
              onClick={() => openNavigation(currentCall.location.address, 
                currentCall.location.lat && currentCall.location.lng ? {
                  lat: currentCall.location.lat,
                  lng: currentCall.location.lng
                } : undefined
              )}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              <Navigation className="mr-2" size={16} />
              Navigasi Terintegrasi
            </Button>
            {currentCall.location.lat && currentCall.location.lng && currentPosition && (
              <Button
                onClick={() => getTrafficAwareRoute({
                  lat: currentCall.location.lat!,
                  lng: currentCall.location.lng!
                })}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50"
              >
                🗺️ Get Route
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Integrated Navigation Modal */}
      {showNavigation && (() => {
        const navData = JSON.parse(showNavigation);
        return (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Navigasi Emergency</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNavigation(null)}
                  >
                    ✕
                  </Button>
                </div>
              </div>
              <div className="p-4">
                <IntegratedNavigation
                  destination={{
                    lat: navData.coordinates.lat,
                    lng: navData.coordinates.lng,
                    address: navData.address,
                    name: "Lokasi Emergency"
                  }}
                  currentLocation={currentPosition ? {
                    lat: currentPosition.latitude,
                    lng: currentPosition.longitude
                  } : undefined}
                  estimatedTime={eta ? Math.ceil((eta.getTime() - Date.now()) / 60000) : undefined}
                  distance={routeData?.distance}
                />
              </div>
            </div>
          </div>
        );
        })()}

      {/* Emergency Reports Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Laporan Darurat
            </span>
            <div className="flex gap-2">
              <Button 
                onClick={() => handleEmergencyReport('trauma')}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                🚨 TRAUMA
              </Button>
              <Button 
                onClick={() => handleEmergencyReport('heart')}
                size="sm"
                className="bg-orange-600 hover:bg-orange-700"
              >
                ❤️ JANTUNG
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {reports.filter(r => r.status === 'pending').slice(0, 5).map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-1">
                      🚨 {report.type.toUpperCase()} - {report.patient_name}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center mb-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {report.location} • {report.severity}
                    </div>
                    <div className="text-sm text-gray-500">
                      Pelapor: {report.reporter_name} • {new Date(report.created_at!).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                  <Badge 
                    variant={report.status === 'pending' ? 'destructive' : 'default'}
                    className="ml-2"
                  >
                    {report.status}
                  </Badge>
                </div>
              </div>
            ))}
            {reports.filter(r => r.status === 'pending').length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Tidak ada laporan darurat pending</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* All Active Calls List */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center">
            <Phone className="mr-2 text-red-600" size={20} />
            Semua Panggilan Aktif ({activeCalls.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {activeCalls.map((call) => {
            const report = getReportDetails(call.reportId);
            const isCurrentCall = currentCall?.id === call.id;
            
            return (
              <div 
                key={call.id} 
                className={`p-4 hover:bg-gray-50 ${isCurrentCall ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="font-semibold text-gray-800">#{call.id.slice(-8)}</span>
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(call.status)}`}></div>
                      <span className="text-sm text-gray-600">
                        {call.status.replace('_', ' ')}
                      </span>
                      {isCurrentCall && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          CURRENT
                        </span>
                      )}
                    </div>
                    
                    {report && (
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Pasien: <span className="font-medium">{report.patient_name}</span></p>
                          <p className="text-gray-600">Jenis: <span className="font-medium">{report.type}</span></p>
                        </div>
                        <div>
                          <p className="text-gray-600">{call.location.address}</p>
                          <p className="text-gray-600">{new Date(call.created_at).toLocaleTimeString('id-ID')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {!isCurrentCall && (
                    <Button
                      onClick={() => setActiveEmergencyCall(call.id)}
                      size="sm"
                      variant="outline"
                      className="ml-4"
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {activeCalls.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <CheckCircle size={48} className="mx-auto mb-3 text-gray-300" />
              <p>Tidak ada panggilan darurat aktif</p>
              <p className="text-sm">Semua dalam keadaan standby</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Report Modal */}
      <EmergencyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        type={modalType}
        prefilledData={null}
      />
    </div>
  );
};

export default AmbulanceEmergencyDashboard;
