import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Activity, Clock, MapPin } from 'lucide-react';

interface AmbulanceData {
  id: string;
  callSign: string;
  latitude: number;
  longitude: number;
  status: 'available' | 'dispatched' | 'en_route' | 'busy';
  speed?: number;
  heading?: number;
  lastUpdate: string;
}

interface LeafletAmbulanceMapProps {
  height?: string;
  showControls?: boolean;
}

const LeafletAmbulanceMap: React.FC<LeafletAmbulanceMapProps> = ({
  height = "400px",
  showControls = true
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [ambulances, setAmbulances] = useState<AmbulanceData[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null);

  // Sample ambulance data
  const sampleAmbulances: AmbulanceData[] = [
    {
      id: 'amb-001',
      callSign: 'AMB-001',
      latitude: -6.2088,
      longitude: 106.8456,
      status: 'available',
      speed: 0,
      heading: 45,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'amb-002', 
      callSign: 'AMB-002',
      latitude: -6.2188,
      longitude: 106.8356,
      status: 'dispatched',
      speed: 45,
      heading: 120,
      lastUpdate: new Date().toISOString()
    },
    {
      id: 'amb-003',
      callSign: 'AMB-003',
      latitude: -6.1988,
      longitude: 106.8556,
      status: 'en_route',
      speed: 60,
      heading: 270,
      lastUpdate: new Date().toISOString()
    }
  ];

  const createCustomIcon = (status: string) => {
    const statusColors = {
      'available': '#10b981',
      'dispatched': '#f59e0b', 
      'en_route': '#ef4444',
      'busy': '#6b7280'
    };

    const color = statusColors[status] || '#6b7280';
    
    return L.divIcon({
      html: `
        <div style="
          width: 30px;
          height: 30px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
            <path d="M4 16h1v4c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-4h6v4c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-4h1c.55 0 1-.45 1-1V9c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v2H5c-1.1 0-2 .9-2 2v6c0 .55.45 1 1 1z"/>
          </svg>
        </div>
      `,
      className: 'custom-ambulance-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
  };

  const initializeMap = () => {
    if (!mapContainer.current || map.current) return;

    // Initialize Leaflet map
    map.current = L.map(mapContainer.current).setView([-6.2088, 106.8456], 12);

    // Add OpenStreetMap tile layer (completely free)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map.current);

    // Add ambulance markers
    addAmbulanceMarkers();
    setAmbulances(sampleAmbulances);
  };

  const addAmbulanceMarkers = () => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add markers for each ambulance
    sampleAmbulances.forEach((ambulance) => {
      const icon = createCustomIcon(ambulance.status);
      
      const marker = L.marker([ambulance.latitude, ambulance.longitude], { icon })
        .addTo(map.current!);

      // Create popup content
      const popupContent = `
        <div style="min-width: 200px; padding: 10px;">
          <div style="font-weight: bold; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
            <span>🚑</span>
            <span>${ambulance.callSign}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 14px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Status:</span>
              <span style="background: ${
                ambulance.status === 'available' ? '#10b981' :
                ambulance.status === 'dispatched' ? '#f59e0b' :
                ambulance.status === 'en_route' ? '#ef4444' : '#6b7280'
              }; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px;">
                ${ambulance.status}
              </span>
            </div>
            ${ambulance.speed ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Kecepatan:</span>
                <span>${ambulance.speed} km/h</span>
              </div>
            ` : ''}
            ${ambulance.heading ? `
              <div style="display: flex; justify-content: space-between;">
                <span>Arah:</span>
                <span>${ambulance.heading}°</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; color: #666; font-size: 12px;">
              <span>Update:</span>
              <span>${new Date(ambulance.lastUpdate).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      
      // Add click handler
      marker.on('click', () => {
        setSelectedAmbulance(ambulance.id);
      });

      markersRef.current.push(marker);
    });
  };

  useEffect(() => {
    initializeMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        style={{ height }}
        className="w-full rounded-lg shadow-lg"
      />

      {/* Status Overlay */}
      <div className="absolute top-4 right-4 z-[1000]">
        <Badge variant="default" className="bg-green-600">
          <Activity className="w-3 h-3 mr-1" />
          Live Tracking
        </Badge>
      </div>

      {/* Ambulance Control Panel */}
      {showControls && (
        <Card className="absolute top-4 left-4 z-[1000] w-80 max-h-96 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Truck className="w-4 h-4" />
              Unit Ambulans ({ambulances.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-64 overflow-y-auto">
            {ambulances.map((ambulance) => {
              const minutesAgo = Math.floor(
                (Date.now() - new Date(ambulance.lastUpdate).getTime()) / 60000
              );
              
              return (
                <div 
                  key={ambulance.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAmbulance === ambulance.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    setSelectedAmbulance(ambulance.id);
                    if (map.current) {
                      map.current.setView([ambulance.latitude, ambulance.longitude], 15);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ambulance.callSign}</div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {minutesAgo}m yang lalu
                        {ambulance.speed && ambulance.speed > 0 && (
                          <span>• {ambulance.speed} km/h</span>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={ambulance.status === 'available' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {ambulance.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Free Map Attribution */}
      <div className="absolute bottom-4 right-4 z-[1000]">
        <Badge variant="outline" className="bg-white/90 text-xs">
          <MapPin className="w-3 h-3 mr-1" />
          OpenStreetMap - Free
        </Badge>
      </div>
    </div>
  );
};

export default LeafletAmbulanceMap;