import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Navigation, MapPin, Layers, Route, Target } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';

// Fix default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  destinations?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'emergency' | 'hospital' | 'admin' | 'ambulance';
    address?: string;
  }>;
  showRoute?: boolean;
  height?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ 
  destinations = [], 
  showRoute = true, 
  height = "400px" 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const currentRouteLine = useRef<L.Polyline | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<typeof destinations[0] | null>(null);
  const [mapLayer, setMapLayer] = useState('osm');
  const { latitude, longitude, loading: locationLoading, getCurrentLocation } = useGeolocation();

  // Map layer options
  const mapLayers = {
    osm: {
      name: '🗺️ Standard',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors'
    },
    satellite: {
      name: '🛰️ Satelit',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri'
    },
    terrain: {
      name: '🏔️ Terrain',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap contributors'
    }
  };

  // Custom marker icons
  const createCustomIcon = (type: string, color: string) => {
    const icons = {
      emergency: '🚨',
      hospital: '🏥',
      admin: '🏢',
      ambulance: '🚑',
      current: '📍'
    };

    return L.divIcon({
      html: `<div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      ">${icons[type as keyof typeof icons] || '📍'}</div>`,
      className: 'custom-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !latitude || !longitude) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([latitude, longitude], 13);

    // Add initial tile layer
    L.tileLayer(mapLayers[mapLayer as keyof typeof mapLayers].url, {
      attribution: mapLayers[mapLayer as keyof typeof mapLayers].attribution,
      maxZoom: 19,
    }).addTo(map.current);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude]);

  // Update map layer
  useEffect(() => {
    if (!map.current) return;

    map.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.current!.removeLayer(layer);
      }
    });

    L.tileLayer(mapLayers[mapLayer as keyof typeof mapLayers].url, {
      attribution: mapLayers[mapLayer as keyof typeof mapLayers].attribution,
      maxZoom: 19,
    }).addTo(map.current);
  }, [mapLayer]);

  // Add markers
  useEffect(() => {
    if (!map.current || !latitude || !longitude) return;

    // Clear existing markers
    map.current.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.current!.removeLayer(layer);
      }
    });

    // Add current location marker
    const currentLocationIcon = createCustomIcon('current', '#ef4444');
    L.marker([latitude, longitude], { icon: currentLocationIcon })
      .addTo(map.current)
      .bindPopup('<strong>📍 Lokasi Anda</strong>')
      .openPopup();

    // Add destination markers
    destinations.forEach((dest) => {
      const markerColors = {
        emergency: '#dc2626',
        hospital: '#16a34a',
        admin: '#2563eb',
        ambulance: '#ea580c'
      };

      const icon = createCustomIcon(dest.type, markerColors[dest.type]);
      
      L.marker([dest.lat, dest.lng], { icon })
        .addTo(map.current!)
        .bindPopup(`<strong>${dest.name}</strong><br/>${dest.address || ''}`)
        .on('click', () => setSelectedDestination(dest));
    });

    // Fit bounds if there are destinations
    if (destinations.length > 0) {
      const group = new L.FeatureGroup([
        L.marker([latitude, longitude]),
        ...destinations.map(dest => L.marker([dest.lat, dest.lng]))
      ]);
      map.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [latitude, longitude, destinations]);

  // Add routing
  useEffect(() => {
    if (!map.current || !selectedDestination || !latitude || !longitude || !showRoute) return;

    // Remove existing route
    if (currentRouteLine.current) {
      map.current.removeLayer(currentRouteLine.current);
      currentRouteLine.current = null;
    }

    // Simple routing with OSRM (free routing service)
    const getRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${longitude},${latitude};${selectedDestination.lng},${selectedDestination.lat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          
          // Remove existing route lines  
          map.current!.eachLayer((layer) => {
            if (layer instanceof L.Polyline && currentRouteLine.current !== layer) {
              map.current!.removeLayer(layer);
            }
          });
          
          // Add route line
          currentRouteLine.current = L.polyline(coordinates, {
            color: '#3b82f6',
            weight: 5,
            opacity: 0.7
          }).addTo(map.current!);
          
          // Fit bounds to show route
          map.current!.fitBounds(currentRouteLine.current.getBounds().pad(0.1));
          
          // Add route info popup
          const distance = (route.distance / 1000).toFixed(1);
          const duration = Math.round(route.duration / 60);
          
          L.popup()
            .setLatLng([selectedDestination.lat, selectedDestination.lng])
            .setContent(`
              <strong>📍 ${selectedDestination.name}</strong><br/>
              📏 Jarak: ${distance} km<br/>
              ⏱️ Waktu: ~${duration} menit
            `)
            .openOn(map.current!);
        }
      } catch (error) {
        console.error('Error getting route:', error);
      }
    };

    getRoute();
  }, [selectedDestination, latitude, longitude, showRoute]);

  const openInGoogleMaps = () => {
    if (selectedDestination && latitude && longitude) {
      const url = `https://www.google.com/maps/dir/${latitude},${longitude}/${selectedDestination.lat},${selectedDestination.lng}`;
      window.open(url, '_blank');
    }
  };

  const openInWaze = () => {
    if (selectedDestination) {
      const url = `https://waze.com/ul?ll=${selectedDestination.lat},${selectedDestination.lng}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  if (locationLoading) {
    return (
      <div className="flex items-center justify-center p-8" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Mendapatkan lokasi...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Layers size={16} className="text-gray-600" />
          <select
            value={mapLayer}
            onChange={(e) => setMapLayer(e.target.value)}
            className="text-sm border border-gray-300 rounded px-2 py-1"
          >
            {Object.entries(mapLayers).map(([key, layer]) => (
              <option key={key} value={key}>{layer.name}</option>
            ))}
          </select>
        </div>
        
        <Button
          size="sm"
          variant="outline"
          onClick={getCurrentLocation}
          className="text-xs"
        >
          <Target size={14} className="mr-1" />
          Refresh GPS
        </Button>
      </div>

      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full rounded-lg border"
        style={{ height }}
      />

      {/* Destination Selector */}
      {destinations.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <MapPin size={18} className="mr-2" />
            Pilih Tujuan
          </h3>
          <div className="grid gap-2">
            {destinations.map((dest) => (
              <Button
                key={dest.id}
                variant={selectedDestination?.id === dest.id ? "default" : "outline"}
                className="w-full justify-start text-left"
                onClick={() => setSelectedDestination(dest)}
              >
                <span className="mr-2">
                  {{
                    emergency: '🚨',
                    hospital: '🏥',
                    admin: '🏢',
                    ambulance: '🚑'
                  }[dest.type]}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{dest.name}</div>
                  {dest.address && <div className="text-xs opacity-75">{dest.address}</div>}
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Controls */}
      {selectedDestination && (
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Navigation size={18} className="mr-2" />
            Navigasi
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={openInGoogleMaps}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              🗺️ Google Maps
            </Button>
            <Button
              onClick={openInWaze}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              🚗 Waze
            </Button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Legenda:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center">
            <span className="mr-2">📍</span>
            <span>Lokasi Anda</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🚨</span>
            <span>Darurat</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🏥</span>
            <span>Rumah Sakit</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">🏢</span>
            <span>Kantor/Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;