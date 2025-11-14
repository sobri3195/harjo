import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Clock, Route, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance, formatDistance, calculateTravelTime, formatTravelTime } from '@/utils/distanceCalculator';

interface UberStyleMapProps {
  role: 'user' | 'ambulance' | 'admin';
  userName: string;
  destination?: {
    lat: number;
    lng: number;
    name: string;
    type: 'emergency' | 'hospital';
  };
  onRouteStart?: () => void;
  onArrived?: () => void;
}

const UberStyleMap: React.FC<UberStyleMapProps> = ({
  role,
  userName,
  destination,
  onRouteStart,
  onArrived
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    duration: number;
    eta: string;
  } | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const { latitude, longitude } = useGeolocation();
  const { myLocation, allLocations } = useLocationSharing({ role, userName, enabled: true });

  // Initialize map with Uber-like styling
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map with dark theme (Uber-style)
    mapRef.current = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView([-6.2088, 106.8456], 13);

    // Uber-style dark tiles
    L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: ''
    }).addTo(mapRef.current);

    // Custom zoom control
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapRef.current);

    // Route layer group
    routeLayerRef.current = L.layerGroup().addTo(mapRef.current);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Create Uber-style custom icons
  const createUberIcon = (type: 'ambulance' | 'user' | 'destination', isActive = false) => {
    const iconMap = {
      ambulance: { emoji: '🚑', color: '#ff4444', size: isActive ? 40 : 30 },
      user: { emoji: '📍', color: '#4285f4', size: 25 },
      destination: { emoji: '🏥', color: '#ff6b6b', size: 35 }
    };

    const icon = iconMap[type];
    
    return L.divIcon({
      html: `
        <div style="
          background: ${icon.color};
          width: ${icon.size}px;
          height: ${icon.size}px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: ${icon.size * 0.6}px;
          border: 3px solid white;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
          animation: ${isActive ? 'pulse 2s infinite' : 'none'};
        ">
          ${icon.emoji}
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        </style>
      `,
      className: 'uber-marker',
      iconSize: [icon.size, icon.size],
      iconAnchor: [icon.size / 2, icon.size / 2]
    });
  };

  // Calculate route (simplified - would use routing service in production)
  const calculateRoute = () => {
    if (!myLocation || !destination || !mapRef.current || !routeLayerRef.current) return;

    const distance = calculateDistance(
      myLocation.lat,
      myLocation.lng,
      destination.lat,
      destination.lng
    );

    const duration = calculateTravelTime(distance, 'emergency');
    const eta = new Date(Date.now() + duration * 60000).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });

    setRouteInfo({ distance, duration, eta });

    // Clear previous route
    routeLayerRef.current.clearLayers();

    // Draw simple line route (in production, use proper routing service)
    const routeLine = L.polyline([
      [myLocation.lat, myLocation.lng],
      [destination.lat, destination.lng]
    ], {
      color: '#4285f4',
      weight: 4,
      opacity: 0.8,
      dashArray: isNavigating ? '10, 5' : undefined
    });

    routeLayerRef.current.addLayer(routeLine);

    // Add markers
    const startMarker = L.marker([myLocation.lat, myLocation.lng], {
      icon: createUberIcon(role === 'ambulance' ? 'ambulance' : 'user', isNavigating)
    });

    const endMarker = L.marker([destination.lat, destination.lng], {
      icon: createUberIcon('destination')
    });

    routeLayerRef.current.addLayer(startMarker);
    routeLayerRef.current.addLayer(endMarker);

    // Fit map to show route
    const group = new L.FeatureGroup([routeLine, startMarker, endMarker]);
    mapRef.current.fitBounds(group.getBounds(), { padding: [50, 50] });
  };

  useEffect(() => {
    if (destination) {
      calculateRoute();
    }
  }, [myLocation, destination, isNavigating]);

  const handleStartNavigation = () => {
    setIsNavigating(true);
    onRouteStart?.();
    
    // Open Google Maps for actual navigation
    if (destination) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const handleArrived = () => {
    setIsNavigating(false);
    onArrived?.();
  };

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0" />
      
      {/* Uber-style bottom card */}
      {destination && routeInfo && (
        <Card className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div>
                  <h3 className="font-semibold text-lg">{destination.name}</h3>
                  <p className="text-sm text-gray-600">
                    {formatDistance(routeInfo.distance)} • {formatTravelTime(routeInfo.duration)}
                  </p>
                </div>
              </div>
              <Badge variant={destination.type === 'emergency' ? 'destructive' : 'secondary'}>
                {destination.type === 'emergency' ? 'DARURAT' : 'RUMAH SAKIT'}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">ETA: {routeInfo.eta}</span>
            </div>

            {!isNavigating ? (
              <Button 
                onClick={handleStartNavigation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Mulai Navigasi
              </Button>
            ) : (
              <div className="space-y-2">
                <Button 
                  onClick={handleArrived}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Tiba di Lokasi
                </Button>
                <div className="text-center">
                  <span className="text-sm text-blue-600 font-medium">🔵 Sedang dalam perjalanan...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Emergency alert overlay */}
      {destination?.type === 'emergency' && (
        <div className="absolute top-4 left-4 right-4">
          <Card className="bg-red-500 text-white border-0">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-semibold">TANGGAP DARURAT AKTIF</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default UberStyleMap;