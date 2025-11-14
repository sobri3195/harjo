import React, { useState, useEffect } from 'react';
import { Truck, MapPin, Clock, Navigation, Circle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocationSharing, LocationData } from '@/hooks/useLocationSharing';
import { useGeolocation } from '@/hooks/useGeolocation';
import { toast } from '@/hooks/use-toast';

interface AmbulanceTrackerProps {
  showMap?: boolean;
  maxItems?: number;
  className?: string;
}

export const AmbulanceTracker: React.FC<AmbulanceTrackerProps> = ({
  showMap = false,
  maxItems = 3,
  className = ''
}) => {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { latitude, longitude } = useGeolocation();
  
  const { allLocations, calculateDistance } = useLocationSharing({
    role: 'user',
    userName: 'Dashboard User',
    enabled: false // Just for tracking, not sharing
  });

  // Filter for ambulances only
  const ambulanceLocations = allLocations.filter(location => location.role === 'ambulance');

  // Update timestamp when ambulance data changes
  useEffect(() => {
    if (ambulanceLocations.length > 0) {
      setLastUpdate(new Date());
    }
  }, [ambulanceLocations]);

  const getAmbulanceDistance = (ambulance: LocationData): string | null => {
    if (!latitude || !longitude) return null;
    
    const distance = calculateDistance(latitude, longitude, ambulance.lat, ambulance.lng);
    return distance < 1 
      ? `${(distance * 1000).toFixed(0)}m` 
      : `${distance.toFixed(1)}km`;
  };

  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m yang lalu`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}j yang lalu`;
    return `${Math.floor(diffMins / 1440)}h yang lalu`;
  };

  const getAmbulanceStatus = (lastSeen: string): 'active' | 'inactive' | 'offline' => {
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMins = (now.getTime() - lastSeenDate.getTime()) / 60000;
    
    if (diffMins < 2) return 'active';
    if (diffMins < 10) return 'inactive';
    return 'offline';
  };

  const handleNavigateToAmbulance = (ambulance: LocationData) => {
    if (!latitude || !longitude) {
      toast({
        title: "GPS Tidak Tersedia",
        description: "Aktifkan GPS untuk navigasi ke ambulans.",
        variant: "destructive"
      });
      return;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/${latitude},${longitude}/${ambulance.lat},${ambulance.lng}`;
    window.open(googleMapsUrl, '_blank');
    
    toast({
      title: "Navigasi Dibuka",
      description: `Menuju ${ambulance.name}`,
    });
  };

  const refreshData = () => {
    setLastUpdate(new Date());
    toast({
      title: "Data Diperbarui",
      description: "Status ambulans telah direfresh.",
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-red-600" />
            <span>Ambulans Aktif</span>
            <Badge variant="secondary">{ambulanceLocations.length}</Badge>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={refreshData}
            className="text-muted-foreground hover:text-primary"
          >
            <Activity className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {ambulanceLocations.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Tidak ada ambulans aktif</p>
            <p className="text-sm">Ambulans akan muncul saat GPS tracking diaktifkan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ambulanceLocations.slice(0, maxItems).map((ambulance) => {
              const status = getAmbulanceStatus(ambulance.last_seen);
              const distance = getAmbulanceDistance(ambulance);
              
              return (
                <div 
                  key={ambulance.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <Truck 
                        className={`w-6 h-6 ${
                          status === 'active' ? 'text-green-600' : 
                          status === 'inactive' ? 'text-yellow-600' : 
                          'text-gray-400'
                        }`}
                      />
                      <Circle 
                        className={`absolute -top-1 -right-1 w-3 h-3 ${
                          status === 'active' ? 'text-green-500 fill-green-500' :
                          status === 'inactive' ? 'text-yellow-500 fill-yellow-500' :
                          'text-gray-400 fill-gray-400'
                        }`}
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ambulance.name}</div>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        {distance && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {distance}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {getTimeAgo(ambulance.last_seen)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        status === 'active' ? 'border-green-200 text-green-700' :
                        status === 'inactive' ? 'border-yellow-200 text-yellow-700' :
                        'border-gray-200 text-gray-500'
                      }`}
                    >
                      {status === 'active' ? 'Aktif' : status === 'inactive' ? 'Standby' : 'Offline'}
                    </Badge>
                    
                    {latitude && longitude && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleNavigateToAmbulance(ambulance)}
                        className="px-2 py-1 h-7"
                      >
                        <Navigation className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
            
            {ambulanceLocations.length > maxItems && (
              <div className="text-center pt-2">
                <p className="text-sm text-muted-foreground">
                  +{ambulanceLocations.length - maxItems} ambulans lainnya
                </p>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Terakhir diperbarui:</span>
            <span>{lastUpdate.toLocaleTimeString('id-ID')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AmbulanceTracker;