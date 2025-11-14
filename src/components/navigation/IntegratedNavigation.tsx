import React from 'react';
import { MapPin, Navigation, Clock, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface IntegratedNavigationProps {
  destination: {
    lat: number;
    lng: number;
    address: string;
    name?: string;
  };
  currentLocation?: {
    lat: number;
    lng: number;
  };
  onRouteStart?: () => void;
  estimatedTime?: number; // minutes
  distance?: number; // km
}

const IntegratedNavigation: React.FC<IntegratedNavigationProps> = ({
  destination,
  currentLocation,
  onRouteStart,
  estimatedTime,
  distance
}) => {
  
  const openGoogleMaps = () => {
    if (currentLocation) {
      // Open with current location as starting point
      const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${destination.lat},${destination.lng}/@${destination.lat},${destination.lng},15z/data=!3m1!4b1!4m2!4m1!3e0`;
      window.open(url, '_blank');
    } else {
      // Open with destination only
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const openAppleMaps = () => {
    // For iOS devices
    if (currentLocation) {
      const url = `maps://?saddr=${currentLocation.lat},${currentLocation.lng}&daddr=${destination.lat},${destination.lng}&dirflg=d`;
      window.open(url, '_blank');
    } else {
      const url = `maps://?daddr=${destination.lat},${destination.lng}&dirflg=d`;
      window.open(url, '_blank');
    }
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${destination.lat}%2C${destination.lng}&navigate=yes`;
    window.open(url, '_blank');
  };

  const startInAppNavigation = () => {
    onRouteStart?.();
    // Could integrate with a map component here
  };

  // Detect device type for better UX
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Destination Info */}
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {destination.name || 'Tujuan Emergency'}
              </h3>
              <p className="text-sm text-gray-600">{destination.address}</p>
              {(estimatedTime || distance) && (
                <div className="flex items-center space-x-3 mt-2">
                  {estimatedTime && (
                    <div className="flex items-center space-x-1 text-xs text-blue-600">
                      <Clock className="w-4 h-4" />
                      <span>~{estimatedTime} menit</span>
                    </div>
                  )}
                  {distance && (
                    <div className="flex items-center space-x-1 text-xs text-green-600">
                      <Navigation className="w-4 h-4" />
                      <span>{distance.toFixed(1)} km</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Navigation Options */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Pilih Aplikasi Navigasi:</h4>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Google Maps - Universal */}
              <Button
                onClick={openGoogleMaps}
                variant="outline"
                className="flex flex-col items-center p-3 h-auto"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-xs font-bold">G</span>
                </div>
                <span className="text-xs">Google Maps</span>
              </Button>

              {/* Platform-specific options */}
              {isIOS ? (
                <Button
                  onClick={openAppleMaps}
                  variant="outline"
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mb-1">
                    <span className="text-white text-xs font-bold">🍎</span>
                  </div>
                  <span className="text-xs">Apple Maps</span>
                </Button>
              ) : (
                <Button
                  onClick={openWaze}
                  variant="outline"
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center mb-1">
                    <span className="text-white text-xs font-bold">W</span>
                  </div>
                  <span className="text-xs">Waze</span>
                </Button>
              )}
            </div>

            {/* Primary action button */}
            <Button
              onClick={openGoogleMaps}
              className="w-full bg-red-600 hover:bg-red-700 text-white mt-3"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Mulai Navigasi Darurat
            </Button>

            {/* Emergency contact option */}
            <div className="flex space-x-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const coords = `${destination.lat},${destination.lng}`;
                  navigator.clipboard?.writeText(coords);
                }}
              >
                📋 Copy Koordinat
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  // Share location via phone/SMS
                  const message = `Emergency location: ${destination.address} (${destination.lat}, ${destination.lng})`;
                  if (navigator.share) {
                    navigator.share({ text: message });
                  } else {
                    navigator.clipboard?.writeText(message);
                  }
                }}
              >
                📱 Share Lokasi
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntegratedNavigation;