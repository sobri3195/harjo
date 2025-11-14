import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Users, Truck, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocationSharing, LocationData } from '@/hooks/useLocationSharing';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from '@/hooks/use-toast';

interface RealTimeLocationMapProps {
  role: 'user' | 'ambulance' | 'admin';
  userName: string;
  height?: string;
  showControls?: boolean;
  showLocationList?: boolean;
}

const RealTimeLocationMap: React.FC<RealTimeLocationMapProps> = ({
  role,
  userName,
  height = '500px',
  showControls = true,
  showLocationList = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);

  const { latitude, longitude, getCurrentLocation } = useGeolocation();
  const {
    allLocations,
    myLocation,
    isSharing,
    startSharing,
    stopSharing,
    getDistanceTo,
    getNearestLocation,
    calculateDistance
  } = useLocationSharing({ role, userName, enabled: true });

  // Create custom icons for different roles with clear visual distinction
  const createCustomIcon = (role: 'user' | 'ambulance' | 'admin', isMyLocation = false) => {
    const roleConfig = {
      user: {
        icon: '🧍‍♂️',
        bgColor: isMyLocation ? '#3b82f6' : '#6b7280',
        borderColor: '#1e40af',
        label: 'PELAPOR',
        size: 44
      },
      ambulance: {
        icon: '🚑',
        bgColor: isMyLocation ? '#ef4444' : '#dc2626',
        borderColor: '#991b1b',
        label: 'AMBULANS',
        size: 50
      },
      admin: {
        icon: '🧑‍💼',
        bgColor: isMyLocation ? '#8b5cf6' : '#7c3aed',
        borderColor: '#5b21b6',
        label: 'ADMIN',
        size: 44
      }
    };

    const config = roleConfig[role];
    
    return L.divIcon({
      html: `
        <div class="marker-container">
          <div class="marker-main" style="
            background: ${config.bgColor};
            width: ${config.size}px;
            height: ${config.size}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${role === 'ambulance' ? '24px' : '20px'};
            border: 4px solid ${config.borderColor};
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            position: relative;
            ${isMyLocation ? 'animation: pulse 2s infinite;' : ''}
          ">
            ${config.icon}
            ${role === 'ambulance' ? '<div style="position: absolute; top: -2px; right: -2px; background: #ffffff; color: #dc2626; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; font-weight: bold; border: 2px solid #dc2626;">!</div>' : ''}
          </div>
          <div class="marker-label" style="
            background: ${config.bgColor};
            color: white;
            padding: 2px 6px;
            border-radius: 8px;
            font-size: 10px;
            font-weight: bold;
            text-align: center;
            margin-top: 4px;
            border: 1px solid ${config.borderColor};
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">
            ${config.label}${isMyLocation ? ' (SAYA)' : ''}
          </div>
        </div>
        <style>
          .marker-container {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
            50% { transform: scale(1.1); box-shadow: 0 6px 16px rgba(0,0,0,0.5); }
            100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0,0,0,0.4); }
          }
          ${role === 'ambulance' ? `
          .marker-main {
            animation: ${isMyLocation ? 'pulse 2s infinite' : 'ambulance-glow 3s infinite'} !important;
          }
          @keyframes ambulance-glow {
            0%, 100% { box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4); }
            50% { box-shadow: 0 4px 16px rgba(220, 38, 38, 0.8), 0 0 20px rgba(220, 38, 38, 0.5); }
          }
          ` : ''}
        </style>
      `,
      className: 'custom-location-icon',
      iconSize: [config.size + 20, config.size + 30],
      iconAnchor: [config.size/2 + 10, config.size + 15],
    });
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      [latitude || -6.2088, longitude || 106.8456], // Default to Jakarta
      latitude && longitude ? 15 : 11
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [latitude, longitude]);

  // Optimized marker updates - only update when necessary
  useEffect(() => {
    if (!mapRef.current) return;

    // Performance optimization: batch marker updates
    const updateMarkers = () => {
      // Only clear markers that no longer exist
      const currentLocationIds = new Set([
        ...(latitude && longitude ? ['my-location'] : []),
        ...allLocations.map(loc => loc.id)
      ]);

      // Remove obsolete markers
      Object.keys(markersRef.current).forEach(markerId => {
        if (!currentLocationIds.has(markerId)) {
          mapRef.current?.removeLayer(markersRef.current[markerId]);
          delete markersRef.current[markerId];
        }
      });

      // Add/update current user location
      if (latitude && longitude) {
        if (!markersRef.current['my-location']) {
          const myIcon = createCustomIcon(role, true);
          const myMarker = L.marker([latitude, longitude], { 
            icon: myIcon,
            riseOnHover: true
          })
            .bindPopup(`
              <div class="marker-popup" style="min-width: 180px; padding: 6px; font-family: system-ui;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                  <div style="font-size: 20px;">${role === 'ambulance' ? '🚑' : role === 'user' ? '🧍‍♂️' : '🧑‍💼'}</div>
                  <strong style="color: ${role === 'ambulance' ? '#dc2626' : role === 'user' ? '#3b82f6' : '#7c3aed'}; font-size: 14px;">
                    📍 Lokasi Saya
                  </strong>
                </div>
                <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; margin-bottom: 6px;">
                  <div style="font-weight: 500; font-size: 13px;">👤 ${userName}</div>
                  <div style="font-size: 11px; color: #6b7280;">Status: ${isSharing ? '🟢 Aktif' : '🔴 Off'}</div>
                </div>
              </div>
            `, { 
              maxWidth: 200,
              className: 'custom-popup'
            })
            .addTo(mapRef.current);
          
          markersRef.current['my-location'] = myMarker;
        } else {
          // Update position if marker exists
          markersRef.current['my-location'].setLatLng([latitude, longitude]);
        }
      }

      // Add/update other locations efficiently
      allLocations.forEach(location => {
        if (myLocation && location.id === myLocation.id) return;

        if (!markersRef.current[location.id]) {
          const icon = createCustomIcon(location.role, false);
          const distance = latitude && longitude 
            ? calculateDistance(latitude, longitude, location.lat, location.lng)
            : null;

          const marker = L.marker([location.lat, location.lng], { 
            icon,
            riseOnHover: true
          })
            .bindPopup(`
              <div class="marker-popup" style="min-width: 180px; padding: 6px; font-family: system-ui;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                  <div style="font-size: 20px;">${location.role === 'ambulance' ? '🚑' : location.role === 'user' ? '🧍‍♂️' : '🧑‍💼'}</div>
                  <strong style="color: ${location.role === 'ambulance' ? '#dc2626' : location.role === 'user' ? '#3b82f6' : '#7c3aed'}; font-size: 14px;">
                    ${location.role === 'ambulance' ? '🚑 AMBULANS' : location.role === 'user' ? '👤 PELAPOR' : '🧑‍💼 ADMIN'}
                  </strong>
                </div>
                <div style="background: #f8f9fa; padding: 6px; border-radius: 4px; margin-bottom: 6px;">
                  <div style="font-weight: 500; font-size: 13px;">📋 ${location.name}</div>
                  ${distance ? `<div style="font-size: 11px; color: #6b7280;">📏 ${distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}</div>` : ''}
                  <div style="font-size: 11px; color: #6b7280;">⏰ ${new Date(location.last_seen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                ${distance ? `
                  <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}', '_blank')" 
                          style="width: 100%; background: #3b82f6; color: white; border: none; padding: 4px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                    🧭 Navigate
                  </button>
                ` : ''}
              </div>
            `, { 
              maxWidth: 200,
              className: 'custom-popup'
            })
            .addTo(mapRef.current);

          marker.on('click', () => {
            setSelectedLocation(location);
          });

          markersRef.current[location.id] = marker;
        } else {
          // Update existing marker position
          markersRef.current[location.id].setLatLng([location.lat, location.lng]);
        }
      });

      // Fit map to show all markers only on first load
      const allMarkers = Object.values(markersRef.current);
      if (allMarkers.length > 0) {
        const group = new L.FeatureGroup(allMarkers);
        mapRef.current.fitBounds(group.getBounds(), { 
          padding: [15, 15],
          maxZoom: 16 
        });
      }
    };

    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(updateMarkers);
    
  }, [allLocations, latitude, longitude, myLocation?.id, role, userName, isSharing]);

  const handleNavigateToLocation = (location: LocationData) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${location.lat},${location.lng}`;
    window.open(googleMapsUrl, '_blank');
  };

  const handleRefreshLocation = async () => {
    await getCurrentLocation();
    toast({
      title: "📍 Location Refreshed",
      description: "Your GPS location has been updated.",
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'user': return <Users className="w-4 h-4 text-blue-600" />;
      case 'ambulance': return <Truck className="w-4 h-4 text-red-600" />;
      case 'admin': return <UserCheck className="w-4 h-4 text-purple-600" />;
      default: return <MapPin className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'user': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'ambulance': return 'bg-red-100 text-red-800 border border-red-200 font-semibold';
      case 'admin': return 'bg-purple-100 text-purple-800 border border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'user': return '👤 PELAPOR';
      case 'ambulance': return '🚑 AMBULANS';
      case 'admin': return '🧑‍💼 ADMIN';
      default: return role.toUpperCase();
    }
  };

  const formatDistance = (targetLat: number, targetLng: number) => {
    if (!latitude || !longitude) return null;
    const distance = calculateDistance(latitude, longitude, targetLat, targetLng);
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      {showControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="w-5 h-5" />
              <span>Location Sharing Control</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {!isSharing ? (
                <Button onClick={startSharing} className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Start Sharing Location</span>
                </Button>
              ) : (
                <Button 
                  onClick={stopSharing} 
                  variant="destructive"
                  className="flex items-center space-x-2"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Stop Sharing</span>
                </Button>
              )}
              
              <Button 
                onClick={handleRefreshLocation}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Navigation className="w-4 h-4" />
                <span>Refresh GPS</span>
              </Button>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${isSharing ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span>{isSharing ? 'Sharing Active' : 'Not Sharing'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Container - Optimized for performance */}
      <Card>
        <CardContent className="p-0">
          <div 
            ref={mapContainerRef} 
            style={{ 
              height, 
              width: '100%', 
              zIndex: 1,
              contain: 'layout style paint',
              willChange: 'transform'
            }}
            className="rounded-lg overflow-hidden relative"
          />
        </CardContent>
      </Card>

      {/* Location List */}
      {showLocationList && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Active Locations ({allLocations.length})</span>
              <Badge variant="outline">{role}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
              style={{ 
                contain: 'layout',
                willChange: 'scroll-position' 
              }}
            >
              {allLocations.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 text-sm">
                  No other locations currently sharing
                </p>
              ) : (
                allLocations.map((location) => (
                  <div 
                    key={location.id}
                    className="flex items-center justify-between p-2.5 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors duration-150 transform-gpu"
                    onClick={() => setSelectedLocation(location)}
                    style={{ contain: 'layout' }}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div className="flex items-center">
                        {getRoleIcon(location.role)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{location.name}</div>
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                           <Badge className={`${getRoleBadgeColor(location.role)} text-xs px-1.5 py-0.5`} variant="secondary">
                             {getRoleLabel(location.role)}
                           </Badge>
                          <span>•</span>
                          <span>{new Date(location.last_seen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1.5 shrink-0">
                      {formatDistance(location.lat, location.lng) && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                          {formatDistance(location.lat, location.lng)}
                        </Badge>
                      )}
                      <Button 
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigateToLocation(location);
                        }}
                      >
                        <Navigation className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeLocationMap;