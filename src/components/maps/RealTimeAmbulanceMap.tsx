import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealtimeAmbulanceTracking } from '@/hooks/useRealtimeAmbulanceTracking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck, MapPin, Clock, Activity } from 'lucide-react';

// Custom ambulance icons
const createAmbulanceIcon = (status: string) => {
  const color = status === 'available' ? '#10b981' : 
                status === 'dispatched' ? '#f59e0b' : 
                status === 'en_route' ? '#ef4444' : '#6b7280';
  
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
        <path d="M4 16h1v4c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-4h6v4c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-4h1c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v6c0 .55.45 1 1 1z"/>
      </svg>
    </div>`,
    className: 'custom-ambulance-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

const MapController: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return <></>;
};

interface RealTimeAmbulanceMapProps {
  height?: string;
  showControls?: boolean;
  onAmbulanceSelect?: (ambulanceId: string) => void;
  emergencyLocation?: { lat: number; lng: number };
}

export const RealTimeAmbulanceMap: React.FC<RealTimeAmbulanceMapProps> = ({
  height = "400px",
  showControls = true,
  onAmbulanceSelect,
  emergencyLocation
}) => {
  const {
    ambulances,
    dispatches,
    isConnected,
    getAmbulancesByProximity,
    dispatchNearestAmbulance,
    getAmbulanceStatus
  } = useRealtimeAmbulanceTracking();

  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.2088, 106.8456]); // Jakarta
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null);

  // Update map center based on ambulances or emergency location
  useEffect(() => {
    if (emergencyLocation) {
      setMapCenter([emergencyLocation.lat, emergencyLocation.lng]);
    } else if (ambulances.length > 0) {
      const avgLat = ambulances.reduce((sum, a) => sum + a.latitude, 0) / ambulances.length;
      const avgLng = ambulances.reduce((sum, a) => sum + a.longitude, 0) / ambulances.length;
      setMapCenter([avgLat, avgLng]);
    }
  }, [ambulances, emergencyLocation]);

  const handleDispatchNearest = async () => {
    if (!emergencyLocation) return;
    
    const nearbyAmbulances = getAmbulancesByProximity(
      emergencyLocation.lat,
      emergencyLocation.lng,
      50
    );

    if (nearbyAmbulances.length > 0) {
      await dispatchNearestAmbulance(
        'emergency-' + Date.now(),
        emergencyLocation.lat,
        emergencyLocation.lng
      );
    }
  };

  return (
    <div className="relative">
      {/* Connection Status */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Badge variant={isConnected ? "default" : "destructive"}>
          <Activity className="w-3 h-3 mr-1" />
          {isConnected ? 'Live' : 'Disconnected'}
        </Badge>
      </div>

      {/* Control Panel - More responsive */}
      {showControls && (
        <Card className="absolute top-2 left-2 z-[1000] w-72 md:w-80 max-w-[calc(100vw-2rem)]">
          <CardHeader className="pb-2 px-3 py-2">
            <CardTitle className="flex items-center gap-2 text-xs md:text-sm">
              <Truck className="w-3 h-3 md:w-4 md:h-4" />
              Ambulance Tracking ({ambulances.length} units)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-3 pb-3">
            {emergencyLocation && (
              <Button 
                onClick={handleDispatchNearest}
                className="w-full text-xs"
                size="sm"
              >
                <MapPin className="w-3 h-3 mr-1" />
                Dispatch Nearest
              </Button>
            )}
            
            {/* Ambulance List - Compact for mobile */}
            <div className="max-h-24 md:max-h-32 overflow-y-auto space-y-1">
              {ambulances.slice(0, 3).map((ambulance) => {
                const status = getAmbulanceStatus(ambulance.ambulance_id);
                const lastUpdate = new Date(ambulance.timestamp);
                const minutesAgo = Math.floor((Date.now() - lastUpdate.getTime()) / 60000);
                
                return (
                  <div 
                    key={ambulance.ambulance_id}
                    className="flex items-center justify-between p-1.5 md:p-2 rounded bg-muted cursor-pointer hover:bg-muted/80"
                    onClick={() => {
                      setSelectedAmbulance(ambulance.ambulance_id);
                      setMapCenter([ambulance.latitude, ambulance.longitude]);
                      onAmbulanceSelect?.(ambulance.ambulance_id);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{ambulance.ambulance_id}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-2 h-2" />
                        <span className="truncate">{minutesAgo}m ago</span>
                        {ambulance.speed && (
                          <span className="hidden md:inline">• {Math.round(ambulance.speed * 3.6)} km/h</span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={status === 'available' ? 'default' : 'secondary'}
                      className="text-xs flex-shrink-0 ml-1"
                    >
                      {status}
                    </Badge>
                  </div>
                );
              })}
              {ambulances.length > 3 && (
                <div className="text-xs text-muted-foreground text-center py-1">
                  +{ambulances.length - 3} more ambulances
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Container - Properly responsive */}
      <div className="relative w-full overflow-hidden rounded-lg" style={{ height }}>
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
        <MapController center={mapCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Emergency Location Marker */}
        {emergencyLocation && (
          <Marker
            position={[emergencyLocation.lat, emergencyLocation.lng]}
            icon={L.divIcon({
              html: `<div style="
                background: #ef4444;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 4px solid white;
                box-shadow: 0 2px 12px rgba(239,68,68,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                animation: pulse 2s infinite;
              ">
                <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
              </div>`,
              className: 'emergency-marker',
              iconSize: [32, 32],
              iconAnchor: [16, 16]
            })}
          >
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

        {/* Ambulance Markers */}
        {ambulances.map((ambulance) => {
          const status = getAmbulanceStatus(ambulance.ambulance_id);
          const isSelected = selectedAmbulance === ambulance.ambulance_id;
          
          return (
            <Marker
              key={ambulance.ambulance_id}
              position={[ambulance.latitude, ambulance.longitude]}
              icon={createAmbulanceIcon(status)}
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
                      <Badge variant={status === 'available' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                    </div>
                    
                    {ambulance.speed && (
                      <div className="flex justify-between">
                        <span>Speed:</span>
                        <span>{Math.round(ambulance.speed * 3.6)} km/h</span>
                      </div>
                    )}
                    
                    {ambulance.heading && (
                      <div className="flex justify-between">
                        <span>Heading:</span>
                        <span>{Math.round(ambulance.heading)}°</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span>Accuracy:</span>
                      <span>±{Math.round(ambulance.accuracy)}m</span>
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
                      onClick={() => dispatchNearestAmbulance(
                        'emergency-' + Date.now(),
                        emergencyLocation.lat,
                        emergencyLocation.lng
                      )}
                    >
                      Dispatch This Unit
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
        </MapContainer>
      </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .emergency-marker {
          animation: pulse 2s infinite;
        }
      `}</style>
    </div>
  );
};