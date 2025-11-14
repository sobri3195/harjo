
import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface GoogleMapsRouteProps {
  destination?: {
    lat: number;
    lng: number;
    address: string;
  };
}

const GoogleMapsRoute: React.FC<GoogleMapsRouteProps> = ({ destination }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  // Default RSPAU dr. Suhardi Harjolukito coordinates
  const baseLocation = { lat: -6.1393, lng: 106.8747 };

  useEffect(() => {
    // Get current location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        // Fallback to base location
        setCurrentLocation(baseLocation);
      }
    );
  }, []);

  useEffect(() => {
    if (!mapRef.current || !currentLocation) return;

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=directions`;
    script.async = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [currentLocation]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !currentLocation) return;

    const map = new google.maps.Map(mapRef.current, {
      center: currentLocation,
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
    });

    // Add current location marker
    new google.maps.Marker({
      position: currentLocation,
      map: map,
      title: 'Ambulans (Lokasi Anda)',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23dc2626"%3E%3Cpath d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z"/%3E%3C/svg%3E',
        scaledSize: new google.maps.Size(30, 30),
      },
    });

    // If destination is provided, show route
    if (destination) {
      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
      });
      directionsRenderer.setMap(map);

      const request: google.maps.DirectionsRequest = {
        origin: currentLocation,
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      };

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        }
      });

      // Add destination marker
      new google.maps.Marker({
        position: { lat: destination.lat, lng: destination.lng },
        map: map,
        title: `Tujuan: ${destination.address}`,
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23dc2626"%3E%3Cpath d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/%3E%3C/svg%3E',
          scaledSize: new google.maps.Size(40, 40),
        },
      });
    }
  }, [mapLoaded, currentLocation, destination]);

  const openInGoogleMaps = () => {
    if (destination && currentLocation) {
      const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${destination.lat},${destination.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <p className="text-sm text-yellow-800">
          ⚠️ Google Maps API Key diperlukan untuk navigasi real-time
        </p>
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center"
      >
        {!mapLoaded ? (
          <div className="text-center">
            <p className="text-gray-600">📍 Memuat peta...</p>
            <p className="text-xs text-gray-500 mt-1">Configurasi Google Maps API diperlukan</p>
          </div>
        ) : null}
      </div>

      {destination && (
        <div className="space-y-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-800">🎯 Tujuan:</p>
            <p className="text-sm text-blue-600">{destination.address}</p>
          </div>
          
          <Button 
            onClick={openInGoogleMaps}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            🗺️ Buka di Google Maps
          </Button>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsRoute;
