import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRealtimeAmbulanceTracking } from '@/hooks/useRealtimeAmbulanceTracking';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Truck, MapPin, Clock, Activity, Navigation } from 'lucide-react';
import { calculateDistance, formatDistance, formatTravelTime } from '@/utils/distanceCalculator';

// Fix leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// RSPAU dr. S. Hardjolukito location (Yogyakarta)
const RSPAU_LOCATION = {
  lat: -7.773789,
  lng: 110.425888,
  name: 'RSPAU dr. S. Hardjolukito',
  address: 'Jl. Adisucipto No. 146, Maguwoharjo, Depok, Sleman, Yogyakarta'
};

// Create custom icons
const createAmbulanceIcon = (status: string, isSelected: boolean = false) => {
  const color = status === 'available' ? '#10b981' : 
                status === 'dispatched' ? '#f59e0b' : 
                status === 'en_route' ? '#ef4444' : '#6b7280';
  
  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: ${isSelected ? '32px' : '24px'};
      height: ${isSelected ? '32px' : '24px'};
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      ${isSelected ? 'animation: pulse 2s infinite;' : ''}
    ">
      🚑
    </div>`,
    className: 'custom-ambulance-icon',
    iconSize: [isSelected ? 32 : 24, isSelected ? 32 : 24],
    iconAnchor: [isSelected ? 16 : 12, isSelected ? 16 : 12]
  });
};

const createRSPAUIcon = () => {
  return L.divIcon({
    html: `<div style="
      background: #1e40af;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(30,64,175,0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    ">
      🏥
    </div>`,
    className: 'rspau-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
};

// Route drawing component
const RouteDrawer: React.FC<{
  ambulances: any[];
  selectedAmbulance: string | null;
  showAllRoutes: boolean;
}> = ({ ambulances, selectedAmbulance, showAllRoutes }) => {
  const map = useMap();
  const routeLayers = useRef<L.LayerGroup>(new L.LayerGroup());

  useEffect(() => {
    if (!map) return;
    
    routeLayers.current.addTo(map);
    
    return () => {
      routeLayers.current.remove();
    };
  }, [map]);

  useEffect(() => {
    routeLayers.current.clearLayers();

    const drawRoutes = async () => {
      const ambulancesToRoute = showAllRoutes 
        ? ambulances 
        : selectedAmbulance 
          ? ambulances.filter(a => a.ambulance_id === selectedAmbulance)
          : [];

      for (const ambulance of ambulancesToRoute) {
        try {
          const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${ambulance.longitude},${ambulance.latitude};${RSPAU_LOCATION.lng},${RSPAU_LOCATION.lat}?overview=full&geometries=geojson`
          );
          const data = await response.json();
          
          if (data.routes && data.routes[0]) {
            const route = data.routes[0];
            const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
            
            const color = selectedAmbulance === ambulance.ambulance_id ? '#ef4444' : '#3b82f6';
            const weight = selectedAmbulance === ambulance.ambulance_id ? 4 : 2;
            const opacity = selectedAmbulance === ambulance.ambulance_id ? 0.8 : 0.6;
            
            const routeLine = L.polyline(coordinates, {
              color: color,
              weight: weight,
              opacity: opacity,
              dashArray: selectedAmbulance === ambulance.ambulance_id ? undefined : '10, 5'
            });

            const distance = (route.distance / 1000).toFixed(1);
            const duration = Math.round(route.duration / 60);

            routeLine.bindPopup(`
              <div style="text-align: center;">
                <div style="font-weight: bold; color: ${color};">🚑 ${ambulance.ambulance_id} → 🏥 RSPAU</div>
                <div style="margin: 5px 0;">
                  📍 Jarak: ${distance} km<br>
                  ⏱️ ETA: ${duration} menit
                </div>
              </div>
            `);
            
            routeLayers.current.addLayer(routeLine);
          }
        } catch (error) {
          console.error('Error drawing route:', error);
          // Fallback: draw straight line
          const straightLine = L.polyline([
            [ambulance.latitude, ambulance.longitude],
            [RSPAU_LOCATION.lat, RSPAU_LOCATION.lng]
          ], {
            color: '#64748b',
            weight: 2,
            opacity: 0.5,
            dashArray: '5, 10'
          });
          
          routeLayers.current.addLayer(straightLine);
        }
      }
    };

    if (ambulances.length > 0) {
      drawRoutes();
    }
  }, [ambulances, selectedAmbulance, showAllRoutes]);

  return null;
};

interface RSPAURoutingMapProps {
  height?: string;
  onAmbulanceSelect?: (ambulanceId: string) => void;
}

export const RSPAURoutingMap: React.FC<RSPAURoutingMapProps> = ({
  height = "600px",
  onAmbulanceSelect
}) => {
  const { ambulances, isConnected } = useRealtimeAmbulanceTracking();
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null);
  const [showAllRoutes, setShowAllRoutes] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([RSPAU_LOCATION.lat, RSPAU_LOCATION.lng]);

  // Get ambulance details with distances to RSPAU
  const ambulanceDetails = ambulances.map(ambulance => {
    const distance = calculateDistance(
      ambulance.latitude,
      ambulance.longitude,
      RSPAU_LOCATION.lat,
      RSPAU_LOCATION.lng
    );
    
    const eta = ambulance.speed > 0 
      ? (distance / ambulance.speed) * 60 // Convert to minutes
      : (distance / 50) * 60; // Assume 50 km/h average speed
    
    return {
      ...ambulance,
      distanceToRSPAU: distance,
      etaToRSPAU: eta,
      formattedDistance: formatDistance(distance),
      formattedETA: formatTravelTime(eta)
    };
  }).sort((a, b) => a.distanceToRSPAU - b.distanceToRSPAU);

  const handleAmbulanceClick = (ambulanceId: string) => {
    const newSelection = selectedAmbulance === ambulanceId ? null : ambulanceId;
    setSelectedAmbulance(newSelection);
    onAmbulanceSelect?.(ambulanceId);
    
    if (newSelection) {
      const ambulance = ambulances.find(a => a.ambulance_id === newSelection);
      if (ambulance) {
        setMapCenter([ambulance.latitude, ambulance.longitude]);
      }
    }
  };

  return (
    <div className="relative">
      {/* Status and Controls */}
      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
        <Badge variant={isConnected ? "default" : "destructive"}>
          <Activity className="w-3 h-3 mr-1" />
          {isConnected ? 'Live Tracking' : 'Offline'}
        </Badge>
        
        <Button
          variant={showAllRoutes ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAllRoutes(!showAllRoutes)}
        >
          <Navigation className="w-4 h-4 mr-1" />
          {showAllRoutes ? 'Hide Routes' : 'Show All Routes'}
        </Button>
      </div>

      {/* Ambulance List Panel */}
      <Card className="absolute top-4 left-4 z-[1000] w-80 max-h-96 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              🚑 Ambulans → 🏥 RSPAU ({ambulanceDetails.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMapCenter([RSPAU_LOCATION.lat, RSPAU_LOCATION.lng])}
            >
              <MapPin className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ambulanceDetails.map((ambulance, index) => {
              const isSelected = selectedAmbulance === ambulance.ambulance_id;
              const status = ambulance.status || 'available';
              
              return (
                <div
                  key={ambulance.ambulance_id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => handleAmbulanceClick(ambulance.ambulance_id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'available' ? 'bg-green-500' :
                        status === 'dispatched' ? 'bg-yellow-500' :
                        status === 'en_route' ? 'bg-red-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="font-medium text-sm">
                        🚑 {ambulance.ambulance_id}
                        {index === 0 && <span className="ml-1 text-xs text-green-600">✨ TERDEKAT</span>}
                      </span>
                    </div>
                    <Badge variant={status === 'available' ? 'default' : 'secondary'} className="text-xs">
                      {status}
                    </Badge>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-blue-700">📍 Jarak ke RSPAU:</span>
                      <span className="font-semibold text-blue-900">{ambulance.formattedDistance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">⏱️ ETA:</span>
                      <span className="font-semibold text-blue-900">{ambulance.formattedETA}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">🚗 Kecepatan:</span>
                      <span className="font-medium text-blue-800">{ambulance.speed?.toFixed(0) || '0'} km/h</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {ambulanceDetails.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Truck className="mx-auto mb-2" size={24} />
                <p className="text-sm">Tidak ada ambulans aktif</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height, width: '100%' }}
        className="rounded-lg"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Route Drawing */}
        <RouteDrawer
          ambulances={ambulances}
          selectedAmbulance={selectedAmbulance}
          showAllRoutes={showAllRoutes}
        />

        {/* RSPAU Hospital Marker */}
        <Marker
          position={[RSPAU_LOCATION.lat, RSPAU_LOCATION.lng]}
          icon={createRSPAUIcon()}
          eventHandlers={{
            click: (e) => {
              // Toggle popup on click
              const marker = e.target;
              if (marker.isPopupOpen()) {
                marker.closePopup();
              } else {
                marker.openPopup();
              }
            }
          }}
        >
          <Popup closeButton={true} autoClose={false} closeOnClick={false}>
            <div className="text-center min-w-[300px]">
              <div className="font-bold text-blue-600 mb-2 text-lg">
                🏥 {RSPAU_LOCATION.name}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                📍 {RSPAU_LOCATION.address}
              </div>
              <div className="text-xs text-gray-500 mb-3">
                Koordinat: {RSPAU_LOCATION.lat.toFixed(6)}, {RSPAU_LOCATION.lng.toFixed(6)}
              </div>
              <div className="text-xs text-blue-600 mb-3">
                🔗 <a 
                  href={`https://maps.google.com/?q=${RSPAU_LOCATION.lat},${RSPAU_LOCATION.lng}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  Buka di Google Maps
                </a>
              </div>
              
              {ambulanceDetails.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg border">
                  <div className="font-medium text-blue-800 mb-2">🚑 Ambulans Terdekat:</div>
                  <div className="text-sm">
                    <div className="font-semibold">{ambulanceDetails[0]?.ambulance_id}</div>
                    <div className="text-blue-600">
                      📍 {ambulanceDetails[0]?.formattedDistance} • ⏱️ {ambulanceDetails[0]?.formattedETA}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                💡 Klik marker untuk tutup/buka info
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Ambulance Markers */}
        {ambulances.map((ambulance, index) => {
          const isSelected = selectedAmbulance === ambulance.ambulance_id;
          const status = ambulance.status || 'available';
          const details = ambulanceDetails.find(a => a.ambulance_id === ambulance.ambulance_id);
          
          return (
            <Marker
              key={ambulance.ambulance_id}
              position={[ambulance.latitude, ambulance.longitude]}
              icon={createAmbulanceIcon(status, isSelected)}
              eventHandlers={{
                click: (e) => {
                  const marker = e.target;
                  if (marker.isPopupOpen()) {
                    marker.closePopup();
                  } else {
                    marker.openPopup();
                    handleAmbulanceClick(ambulance.ambulance_id);
                  }
                }
              }}
            >
              <Popup closeButton={true} autoClose={false} closeOnClick={false}>
                <div className="min-w-[250px]">
                  <div className="font-bold mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    🚑 {ambulance.ambulance_id}
                    {index === 0 && <Badge variant="default" className="text-xs">TERDEKAT</Badge>}
                  </div>
                  
                  <div className="space-y-2 text-sm mb-3">
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <Badge variant={status === 'available' ? 'default' : 'secondary'}>
                        {status}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Kecepatan:</span>
                      <span>{ambulance.speed?.toFixed(0) || '0'} km/h</span>
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Update terakhir:</span>
                      <span>{new Date(ambulance.timestamp).toLocaleTimeString('id-ID')}</span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <div className="font-medium text-green-800 mb-2 text-center">
                      🏥 Rute ke RSPAU dr. S. Hardjolukito (Yogyakarta)
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center">
                        <div className="text-green-700">📍 Jarak</div>
                        <div className="font-bold text-green-900">{details?.formattedDistance}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-700">⏱️ ETA</div>
                        <div className="font-bold text-green-900">{details?.formattedETA}</div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => {
                      setSelectedAmbulance(ambulance.ambulance_id);
                    }}
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Tampilkan Rute
                  </Button>

                  <div className="mt-2 pt-2 border-t text-xs text-gray-500 text-center">
                    💡 Klik marker untuk tutup/buka info
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};