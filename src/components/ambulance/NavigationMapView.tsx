import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Card, CardContent } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface RouteSegment {
  id: string;
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  coordinates: Array<[number, number]>;
  distance: number;
  duration: number;
}

interface EmergencyCall {
  id: string;
  type: string;
  patientName: string;
  reporterName: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  severity: string;
  timestamp: string;
  status: string;
}

interface NavigationMapViewProps {
  mapCenter: [number, number];
  currentLocation: { lat: number; lng: number };
  activeCall: EmergencyCall;
  routeSegments: RouteSegment[];
  currentStep: number;
  navigationActive: boolean;
  rspauLocation: { lat: number; lng: number; name: string; address: string };
}

const createCustomIcon = (type: 'ambulance' | 'emergency' | 'hospital') => {
  const colors = {
    ambulance: '#10b981',
    emergency: '#ef4444', 
    hospital: '#3b82f6'
  };

  const icons = {
    ambulance: '🚑',
    emergency: '🚨',
    hospital: '🏥'
  };

  return L.divIcon({
    html: `<div style="
      background: ${colors[type]};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      ${type === 'emergency' ? 'animation: pulse 2s infinite;' : ''}
    ">${icons[type]}</div>`,
    className: `${type}-marker`,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export const NavigationMapView: React.FC<NavigationMapViewProps> = ({
  mapCenter,
  currentLocation,
  activeCall,
  routeSegments,
  currentStep,
  navigationActive,
  rspauLocation
}) => {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="h-96 rounded-lg overflow-hidden">
          <MapContainer
            center={mapCenter}
            zoom={9}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />

            {/* Ambulance Current Location */}
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createCustomIcon('ambulance')}>
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-green-600">🚑 Ambulans AMB-01</div>
                  <div className="text-sm">Posisi Saat Ini</div>
                </div>
              </Popup>
            </Marker>

            {/* Emergency Location */}
            <Marker position={[activeCall.location.lat, activeCall.location.lng]} icon={createCustomIcon('emergency')}>
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-red-600">🚨 Lokasi Darurat</div>
                  <div className="text-sm">{activeCall.location.address}</div>
                  <div className="text-sm">Pasien: {activeCall.patientName}</div>
                </div>
              </Popup>
            </Marker>

            {/* RSPAU Hospital */}
            <Marker position={[rspauLocation.lat, rspauLocation.lng]} icon={createCustomIcon('hospital')}>
              <Popup>
                <div className="text-center">
                  <div className="font-bold text-blue-600">🏥 {rspauLocation.name}</div>
                  <div className="text-sm">{rspauLocation.address}</div>
                </div>
              </Popup>
            </Marker>

            {/* Route Lines */}
            {routeSegments.map((segment, index) => (
              <Polyline
                key={segment.id}
                positions={segment.coordinates}
                color={
                  index === currentStep && navigationActive ? '#3b82f6' :
                  index < currentStep ? '#10b981' : '#6b7280'
                }
                weight={index === currentStep && navigationActive ? 4 : 3}
                opacity={index === currentStep && navigationActive ? 1 : 0.7}
                dashArray={index === currentStep && navigationActive ? undefined : '10, 5'}
              />
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
};