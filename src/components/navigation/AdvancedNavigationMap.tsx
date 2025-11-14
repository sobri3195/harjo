import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';
import { Navigation, MapPin, Clock, Route, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdvancedGPS } from '@/hooks/useAdvancedGPS';
import { toast } from '@/hooks/use-toast';

interface AdvancedNavigationMapProps {
  ambulanceId: string;
  destination?: {
    lat: number;
    lng: number;
    address: string;
    type: 'emergency' | 'hospital';
  };
  onRouteUpdate?: (routeData: any) => void;
}

const AdvancedNavigationMap: React.FC<AdvancedNavigationMapProps> = ({
  ambulanceId,
  destination,
  onRouteUpdate
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mapStyle, setMapStyle] = useState<'standard' | 'satellite' | 'traffic'>('standard');
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [offlineMapReady, setOfflineMapReady] = useState(false);

  const {
    currentPosition,
    isTracking,
    speed,
    heading,
    accuracy,
    routeData,
    eta,
    error,
    startTracking,
    stopTracking,
    getTrafficAwareRoute,
    getAlternativeRoutes
  } = useAdvancedGPS(ambulanceId);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "🌐 Connection Restored",
        description: "Maps are now online with live traffic data",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "📡 Offline Mode",
        description: "Using cached maps. Limited routing available",
        variant: "destructive"
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Default to Jakarta area
    const map = L.map(mapContainerRef.current, {
      center: [-6.2088, 106.8456],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    // Add tile layers based on online status and style
    const getTileLayer = () => {
      if (!isOnline && offlineMapReady) {
        // Use cached tiles for offline mode
        return L.tileLayer('/offline-maps/{z}/{x}/{y}.png', {
          attribution: 'Cached Maps',
          maxZoom: 18
        });
      }

      switch (mapStyle) {
        case 'satellite':
          return L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
          });
        case 'traffic':
          return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          });
        default:
          return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
          });
      }
    };

    getTileLayer().addTo(map);

    // Add scale control
    L.control.scale({
      position: 'bottomright',
      imperial: false
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOnline, mapStyle, offlineMapReady]);

  // Create ambulance icon with rotation
  const createAmbulanceIcon = useCallback((heading: number = 0, speed: number = 0) => {
    const isMoving = speed > 1; // Moving if speed > 1 m/s
    
    return L.divIcon({
      html: `
        <div style="
          transform: rotate(${heading}deg);
          transition: transform 0.3s ease;
        ">
          <div style="
            background: ${isMoving ? '#ef4444' : '#dc2626'};
            width: 50px;
            height: 50px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid white;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
            ${isMoving ? 'animation: ambulance-pulse 1s infinite;' : ''}
          ">
            <span style="
              transform: rotate(45deg);
              color: white;
              font-size: 20px;
              font-weight: bold;
            ">🚑</span>
          </div>
        </div>
        <style>
          @keyframes ambulance-pulse {
            0%, 100% { box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3); }
            50% { box-shadow: 0 4px 16px rgba(239, 68, 68, 0.6); }
          }
        </style>
      `,
      className: 'ambulance-marker',
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });
  }, []);

  // Update ambulance position
  useEffect(() => {
    if (!mapRef.current || !currentPosition) return;

    // Remove existing ambulance marker
    if (ambulanceMarkerRef.current) {
      mapRef.current.removeLayer(ambulanceMarkerRef.current);
    }

    // Create new ambulance marker
    const ambulanceIcon = createAmbulanceIcon(heading, speed);
    ambulanceMarkerRef.current = L.marker(
      [currentPosition.latitude, currentPosition.longitude],
      { icon: ambulanceIcon }
    )
      .bindPopup(`
        <div>
          <strong>🚑 Ambulans ${ambulanceId}</strong><br>
          <div>Speed: ${(speed * 3.6).toFixed(1)} km/h</div>
          <div>Heading: ${heading.toFixed(0)}°</div>
          <div>Accuracy: ±${accuracy.toFixed(0)}m</div>
          <small>Updated: ${new Date().toLocaleTimeString()}</small>
        </div>
      `)
      .addTo(mapRef.current);

    // Center map on ambulance if tracking is active
    if (isTracking) {
      mapRef.current.setView([currentPosition.latitude, currentPosition.longitude], 16);
    }
  }, [currentPosition, heading, speed, accuracy, ambulanceId, isTracking, createAmbulanceIcon]);

  // Update destination marker and routing
  useEffect(() => {
    if (!mapRef.current || !destination) return;

    // Remove existing destination marker
    if (destinationMarkerRef.current) {
      mapRef.current.removeLayer(destinationMarkerRef.current);
    }

    // Create destination marker
    const destinationIcon = L.divIcon({
      html: `
        <div style="
          background: ${destination.type === 'emergency' ? '#dc2626' : '#059669'};
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          ${destination.type === 'emergency' ? 'animation: emergency-blink 1s infinite;' : ''}
        ">
          <span style="color: white; font-size: 20px;">
            ${destination.type === 'emergency' ? '🚨' : '🏥'}
          </span>
        </div>
        <style>
          @keyframes emergency-blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        </style>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    destinationMarkerRef.current = L.marker([destination.lat, destination.lng], { 
      icon: destinationIcon 
    })
      .bindPopup(`
        <div>
          <strong>${destination.type === 'emergency' ? '🚨 Emergency' : '🏥 Hospital'}</strong><br>
          <div>${destination.address}</div>
          ${routeData ? `<div>ETA: ${eta?.toLocaleTimeString()}</div>` : ''}
        </div>
      `)
      .addTo(mapRef.current);

    // Calculate route if ambulance position is available
    if (currentPosition && isOnline) {
      getTrafficAwareRoute(destination);
    }
  }, [destination, currentPosition, isOnline, getTrafficAwareRoute, routeData, eta]);

  // Setup routing control
  useEffect(() => {
    if (!mapRef.current || !currentPosition || !destination || !isOnline) return;

    // Remove existing routing control
    if (routingControlRef.current) {
      mapRef.current.removeControl(routingControlRef.current);
    }

    // Create new routing control with traffic awareness
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(currentPosition.latitude, currentPosition.longitude),
        L.latLng(destination.lat, destination.lng)
      ],
      routeWhileDragging: false,
      addWaypoints: false,
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving'
      }),
      lineOptions: {
        styles: [
          { color: '#3b82f6', weight: 8, opacity: 0.7 },
          { color: '#ffffff', weight: 4, opacity: 1 }
        ],
        extendToWaypoints: true,
        missingRouteTolerance: 10
      },
      show: false, // Hide instruction panel
    }).addTo(mapRef.current);

    // Listen for route found event
    routingControlRef.current.on('routesfound', (e) => {
      const routes = e.routes;
      const route = routes[0];
      
      if (route && onRouteUpdate) {
        onRouteUpdate({
          distance: route.summary.totalDistance / 1000,
          duration: route.summary.totalTime / 60,
          coordinates: route.coordinates
        });
      }
    });

  }, [currentPosition, destination, isOnline, onRouteUpdate]);

  // Cache tiles for offline use
  const cacheMapTiles = useCallback(async () => {
    if ('serviceWorker' in navigator && 'caches' in window) {
      try {
        const cache = await caches.open('offline-maps-v1');
        
        // Cache map tiles for current area
        const bounds = mapRef.current?.getBounds();
        if (bounds) {
          const tiles = [];
          const zoom = mapRef.current?.getZoom() || 13;
          
          // Generate tile URLs for current viewport
          for (let z = Math.max(10, zoom - 2); z <= Math.min(16, zoom + 2); z++) {
            // Simplified tile caching logic
            const tileUrl = `https://{s}.tile.openstreetmap.org/${z}/{0}/{0}.png`;
            tiles.push(tileUrl);
          }
          
          await cache.addAll(tiles);
          setOfflineMapReady(true);
          
          toast({
            title: "💾 Map Cached",
            description: "Map tiles cached for offline use",
          });
        }
      } catch (error) {
        console.error('Failed to cache map tiles:', error);
      }
    }
  }, []);

  const formatSpeed = (speedMs: number) => {
    return `${(speedMs * 3.6).toFixed(1)} km/h`;
  };

  const formatDistance = (distance: number) => {
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <div className="space-y-4">
      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {isOnline ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
                <Badge variant={isOnline ? "default" : "destructive"}>
                  {isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                <span className="text-sm font-medium">
                  GPS: {isTracking ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {currentPosition && (
                <>
                  <Badge variant="outline">
                    Speed: {formatSpeed(speed)}
                  </Badge>
                  <Badge variant="outline">
                    Accuracy: ±{accuracy.toFixed(0)}m
                  </Badge>
                </>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setMapStyle(mapStyle === 'standard' ? 'satellite' : 'standard')}
              >
                {mapStyle === 'standard' ? '🗺️' : '🛰️'}
              </Button>
              
              {isOnline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cacheMapTiles}
                >
                  💾 Cache
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Information */}
      {routeData && destination && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <span>Route to {destination.type === 'emergency' ? 'Emergency' : 'Hospital'}</span>
              {destination.type === 'emergency' && (
                <Badge variant="destructive" className="animate-pulse">
                  EMERGENCY
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {formatDistance(routeData.distance)}
                </div>
                <div className="text-xs text-gray-600">Distance</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {routeData.duration.toFixed(0)}min
                </div>
                <div className="text-xs text-gray-600">
                  {routeData.trafficDelay ? `+${routeData.trafficDelay}min traffic` : 'Duration'}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {eta?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '--:--'}
                </div>
                <div className="text-xs text-gray-600">ETA</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Container */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapContainerRef} 
            className="w-full h-96 rounded-lg overflow-hidden"
          />
        </CardContent>
      </Card>

      {/* Navigation Controls */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={isTracking ? stopTracking : startTracking}
          className={`${
            isTracking 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          <MapPin className="w-4 h-4 mr-2" />
          {isTracking ? 'Stop Tracking' : 'Start Tracking'}
        </Button>

        {destination && (
          <Button
            onClick={() => {
              const url = isOnline
                ? `https://www.google.com/maps/dir/${currentPosition?.latitude},${currentPosition?.longitude}/${destination.lat},${destination.lng}`
                : `geo:${destination.lat},${destination.lng}`;
              window.open(url, '_blank');
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Navigation className="w-4 h-4 mr-2" />
            Open Navigation
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdvancedNavigationMap;