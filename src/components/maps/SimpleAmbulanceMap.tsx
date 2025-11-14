import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Truck } from 'lucide-react';

// Fix leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleAmbulanceMapProps {
  height?: string;
  showControls?: boolean;
  onAmbulanceSelect?: (ambulanceId: string) => void;
  emergencyLocation?: { lat: number; lng: number };
}

export const SimpleAmbulanceMap: React.FC<SimpleAmbulanceMapProps> = ({
  height = "400px",
  showControls = true,
  onAmbulanceSelect,
  emergencyLocation
}) => {
  const [mapCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta

  // Sample ambulance data
  const ambulances = [
    {
      ambulance_id: 'AMB-001',
      latitude: -6.2088,
      longitude: 106.8456,
      status: 'available'
    },
    {
      ambulance_id: 'AMB-002', 
      latitude: -6.2188,
      longitude: 106.8356,
      status: 'dispatched'
    }
  ];

  const createAmbulanceIcon = (status: string) => {
    const color = status === 'available' ? '#10b981' : 
                  status === 'dispatched' ? '#f59e0b' : '#6b7280';
    
    return L.divIcon({
      html: `<div style="
        background: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: 'ambulance-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        style={{ height, width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {emergencyLocation && (
          <Marker position={[emergencyLocation.lat, emergencyLocation.lng]}>
            <Popup>
              <div>🚨 Emergency Location</div>
            </Popup>
          </Marker>
        )}

        {ambulances.map((ambulance) => (
          <Marker
            key={ambulance.ambulance_id}
            position={[ambulance.latitude, ambulance.longitude]}
            icon={createAmbulanceIcon(ambulance.status)}
          >
            <Popup>
              <div className="min-w-[150px]">
                <div className="font-semibold mb-1 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  {ambulance.ambulance_id}
                </div>
                <Badge variant={ambulance.status === 'available' ? 'default' : 'secondary'}>
                  {ambulance.status}
                </Badge>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};