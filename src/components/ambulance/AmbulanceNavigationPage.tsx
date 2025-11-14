
import React, { useState, useEffect } from 'react';
import { Navigation, MapPin, Clock, Route } from 'lucide-react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { useGeolocation } from '@/hooks/useGeolocation';
import RealTimeLocationMap from '../maps/RealTimeLocationMap';
import { EnhancedNavigationSystem } from './EnhancedNavigationSystem';
import { GPSPermissionDialog } from './GPSPermissionDialog';

const AmbulanceNavigationPage = () => {
  const { reports } = useEmergencyReports();
  const { permissionState, requestPermission } = useGeolocation();
  const [useEnhancedNav, setUseEnhancedNav] = useState(true);
  const [showGPSDialog, setShowGPSDialog] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  // Check GPS permission on component mount
  useEffect(() => {
    if (permissionState === 'denied' || permissionState === 'prompt') {
      setShowGPSDialog(true);
    }
  }, [permissionState]);

  // Get pending emergency reports with coordinates
  const pendingEmergencies = reports.filter(report => 
    report.status === 'pending' && report.latitude && report.longitude
  );

  // Convert to enhanced navigation format
  const activeEmergencyCall = pendingEmergencies[0] ? {
    id: pendingEmergencies[0].id,
    type: pendingEmergencies[0].type,
    patientName: pendingEmergencies[0].patient_name,
    reporterName: pendingEmergencies[0].reporter_name,
    location: {
      address: pendingEmergencies[0].location,
      lat: pendingEmergencies[0].latitude!,
      lng: pendingEmergencies[0].longitude!
    },
    severity: pendingEmergencies[0].severity,
    timestamp: new Date(pendingEmergencies[0].created_at!).toLocaleString('id-ID'),
    status: 'dalam_perjalanan'
  } : undefined;

  // Show GPS dialog if needed
  if (permissionState !== 'granted') {
    return (
      <div className="p-4 md:p-6">
        <GPSPermissionDialog
          open={showGPSDialog}
          onOpenChange={setShowGPSDialog}
          onPermissionGranted={() => {
            setShowGPSDialog(false);
            requestPermission();
          }}
        />
        
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin size={32} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">GPS Diperlukan</h2>
          <p className="text-muted-foreground mb-4 text-sm md:text-base">
            Sistem ambulans memerlukan akses GPS untuk navigasi dan tracking
          </p>
          <button
            onClick={() => setShowGPSDialog(true)}
            className="bg-emergency-red-600 hover:bg-emergency-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Aktifkan GPS
          </button>
        </div>
      </div>
    );
  }

  // If we have an active call or user preference, show enhanced navigation
  if (useEnhancedNav || activeEmergencyCall) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div className="map-container">
          <EnhancedNavigationSystem 
            activeCall={activeEmergencyCall}
            currentLocation={{ lat: -7.773789, lng: 110.425888 }} // RSPAU base location
          />
        </div>
        
        <GPSPermissionDialog
          open={showGPSDialog}
          onOpenChange={setShowGPSDialog}
          onPermissionGranted={() => setShowGPSDialog(false)}
        />
      </div>
    );
  }

  // Fallback to original navigation if needed
  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">🚑 Navigasi Ambulans</h2>
      
      {/* Real-Time Location Map - Fixed container */}
      <div className="map-container bg-white rounded-xl shadow-md overflow-hidden">
        <div style={{ height: '300px' }}>
          <RealTimeLocationMap 
            role="ambulance"
            userName="Ambulans AMB-001"
            height="300px"
            showControls={true}
            showLocationList={false}
          />
        </div>
      </div>

      {/* Emergency Calls */}
      {pendingEmergencies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-800 mb-3">🚨 Panggilan Darurat Aktif</h3>
          <div className="space-y-3">
            {pendingEmergencies.map((emergency) => (
              <button
                key={emergency.id}
                onClick={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${emergency.latitude},${emergency.longitude}&travelmode=driving`;
                  window.open(url, '_blank');
                }}
                className="w-full text-left p-3 rounded-lg border border-red-300 bg-white hover:bg-red-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-lg">
                        {emergency.type === 'trauma' ? '🚨' : '❤️'}
                      </span>
                      <span className="font-medium text-red-800">
                        {emergency.type === 'trauma' ? 'TRAUMA' : 'JANTUNG'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        emergency.severity === 'berat' 
                          ? 'bg-red-200 text-red-800' 
                          : emergency.severity === 'sedang'
                          ? 'bg-yellow-200 text-yellow-800'
                          : 'bg-green-200 text-green-800'
                      }`}>
                        {emergency.severity.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700">
                      <div><strong>Pasien:</strong> {emergency.patient_name}</div>
                      <div><strong>Lokasi:</strong> {emergency.location}</div>
                      <div><strong>Pelapor:</strong> {emergency.reporter_name} ({emergency.reporter_phone})</div>
                    </div>
                  </div>
                  <Navigation size={16} className="text-red-600 ml-2" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Location */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex items-center space-x-3 mb-3">
          <MapPin className="text-navy-blue-600" size={24} />
          <h3 className="font-semibold text-gray-800">Lokasi Saat Ini</h3>
        </div>
        <p className="text-gray-600">RSPAU dr. S. Hardjolukito</p>
        <p className="text-sm text-gray-500">Jl. Adisucipto No. 146, Yogyakarta</p>
      </div>

      {/* Quick Destinations */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Rumah Sakit Terdekat</h3>
        <div className="space-y-3">
          {[
            { 
              name: 'RSPAU dr. S. Hardjolukito', 
              distance: '0 km', 
              time: 'Base Location',
              coordinates: { lat: -7.773789, lng: 110.425888 }
            },
            { 
              name: 'RS Sardjito', 
              distance: '8.2 km', 
              time: '12 menit',
              coordinates: { lat: -7.7691, lng: 110.3735 }
            },
            { 
              name: 'RS PKU Muhammadiyah Yogyakarta', 
              distance: '6.8 km', 
              time: '9 menit',
              coordinates: { lat: -7.7956, lng: 110.3695 }
            },
            { 
              name: 'RS Bethesda Yogyakarta', 
              distance: '8.5 km', 
              time: '14 menit',
              coordinates: { lat: -7.7820, lng: 110.3740 }
            },
          ].map((destination, index) => (
            <button
              key={index}
              onClick={() => {
                const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.coordinates.lat},${destination.coordinates.lng}&travelmode=driving`;
                window.open(url, '_blank');
              }}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-gray-800">{destination.name}</div>
                  <div className="text-sm text-gray-500">
                    {destination.distance} • {destination.time}
                  </div>
                </div>
                <Navigation size={16} className="text-emergency-red-600" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="grid grid-cols-2 gap-4 pb-4">
        <button 
          onClick={() => {
            // Open Google Maps for general navigation
            const url = `https://www.google.com/maps/search/rumah+sakit+terdekat/@-7.773789,110.425888,15z`;
            window.open(url, '_blank');
          }}
          className="bg-emergency-red-600 hover:bg-emergency-red-700 text-white rounded-xl p-4 shadow-lg transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            <Route size={24} />
            <span className="font-semibold text-sm">Google Maps</span>
          </div>
        </button>

        <button 
          onClick={() => {
            // Open Waze for general navigation
            const url = `https://waze.com/ul?ll=-7.773789,110.425888&navigate=yes`;
            window.open(url, '_blank');
          }}
          className="bg-navy-blue-600 hover:bg-navy-blue-700 text-white rounded-xl p-4 shadow-lg transition-colors"
        >
          <div className="flex flex-col items-center space-y-2">
            <Clock size={24} />
            <span className="font-semibold text-sm">Buka di Waze</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AmbulanceNavigationPage;
