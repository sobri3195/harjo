import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Clock, Activity } from 'lucide-react';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createAmbulanceIcon = (status: string) => {
  const color = status === 'available' ? '#10b981' : 
                status === 'dispatched' ? '#f59e0b' : 
                status === 'en_route' ? '#ef4444' : '#6b7280';
  
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

interface WorkingAmbulanceMapProps {
  height?: string;
  showControls?: boolean;
  onAmbulanceSelect?: (ambulanceId: string) => void;
  emergencyLocation?: { lat: number; lng: number };
}

export const WorkingAmbulanceMap: React.FC<WorkingAmbulanceMapProps> = ({
  height = "400px",
  showControls = true,
  onAmbulanceSelect,
  emergencyLocation
}) => {
  const [mapCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null);

  // Sample ambulance data for demonstration
  const ambulances = [
    {
      ambulance_id: 'AMB-001',
      latitude: -6.2088,
      longitude: 106.8456,
      status: 'available',
      speed: 25,
      accuracy: 5,
      timestamp: new Date().toISOString()
    },
    {
      ambulance_id: 'AMB-002', 
      latitude: -6.2188,
      longitude: 106.8356,
      status: 'dispatched',
      speed: 45,
      accuracy: 3,
      timestamp: new Date().toISOString()
    },
    {
      ambulance_id: 'AMB-003',
      latitude: -6.1988,
      longitude: 106.8556,
      status: 'en_route',
      speed: 60,
      accuracy: 8,
      timestamp: new Date().toISOString()
    }
  ];

  return (
    <div className="relative">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Badge variant="default">
          <Activity className="w-3 h-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Control Panel */}
      {showControls && (
        <Card className="absolute top-4 left-4 z-[1000] w-80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4" />
              Ambulance Tracking ({ambulances.length} units)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {emergencyLocation && (
              <Button 
                className="w-full"
                size="sm"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Dispatch Nearest
              </Button>
            )}
            
            {/* Ambulance List */}
            <div className="max-h-32 overflow-y-auto space-y-1">
              {ambulances.map((ambulance) => {
                const lastUpdate = new Date(ambulance.timestamp);
                const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
                
                return (
                  <div 
                    key={ambulance.ambulance_id}
                    className="flex items-center justify-between p-2 rounded bg-muted cursor-pointer hover:bg-muted/80"
                    onClick={() => {
                      setSelectedAmbulance(ambulance.ambulance_id);
                      onAmbulanceSelect?.(ambulance.ambulance_id);
                    }}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-xs">{ambulance.ambulance_id}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {minutesAgo}m ago
                        <span>• {ambulance.speed} km/h</span>
                      </div>
                    </div>
                    <Badge 
                      variant={ambulance.status === 'available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ambulance.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
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
              <div className="text-center">
                <div className="font-semibold text-red-600 mb-1">🚨 Emergency Location</div>
                <div className="text-xs text-gray-600">
                  {emergencyLocation.lat.toFixed(6)}, {emergencyLocation.lng.toFixed(6)}
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {ambulances.map((ambulance) => (
          <Marker
            key={ambulance.ambulance_id}
            position={[ambulance.latitude, ambulance.longitude]}
            icon={createAmbulanceIcon(ambulance.status)}
            eventHandlers={{
              click: () => {
                setSelectedAmbulance(ambulance.ambulance_id);
                onAmbulanceSelect?.(ambulance.ambulance_id);
              }
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <div className="font-semibold mb-2 flex items-center gap-2">
                  <Truck className="w-4 h-4" />
                  {ambulance.ambulance_id}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge variant={ambulance.status === 'available' ? 'default' : 'secondary'}>
                      {ambulance.status}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span>{ambulance.speed} km/h</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Accuracy:</span>
                    <span>±{ambulance.accuracy}m</span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Updated:</span>
                    <span>{new Date(ambulance.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>

                {emergencyLocation && (
                  <Button 
                    size="sm" 
                    className="w-full mt-2"
                  >
                    Dispatch This Unit
                  </Button>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};