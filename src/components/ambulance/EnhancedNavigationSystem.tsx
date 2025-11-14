import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  Route,
  AlertTriangle,
  Play
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { calculateDistance, formatDistance, formatTravelTime } from '@/utils/distanceCalculator';
import { useToast } from '@/hooks/use-toast';
import { NavigationRouteCard } from './NavigationRouteCard';
import { NavigationMapView } from './NavigationMapView';

// RSPAU Harjolukito location (Yogyakarta)
const RSPAU_LOCATION = {
  lat: -7.773789,
  lng: 110.425888,
  name: 'RSPAU dr. S. Hardjolukito',
  address: 'Jl. Adisucipto No. 146, Maguwoharjo, Depok, Sleman, Yogyakarta'
};

interface EmergencyCall {
  id: string;
  type: string;
  patientName: string;
  reporterName: string;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  severity: string;
  timestamp: string;
  status: string;
}

interface RouteSegment {
  id: string;
  from: { lat: number; lng: number; name: string };
  to: { lat: number; lng: number; name: string };
  coordinates: Array<[number, number]>;
  distance: number;
  duration: number;
  instructions: Array<{
    text: string;
    distance: number;
    duration: number;
  }>;
}

interface EnhancedNavigationSystemProps {
  activeCall?: EmergencyCall;
  currentLocation?: { lat: number; lng: number };
}

export const EnhancedNavigationSystem: React.FC<EnhancedNavigationSystemProps> = ({
  activeCall,
  currentLocation = { lat: -7.773789, lng: 110.425888 } // Default to RSPAU
}) => {
  const [routeSegments, setRouteSegments] = useState<RouteSegment[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [navigationActive, setNavigationActive] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([currentLocation.lat, currentLocation.lng]);
  const { toast } = useToast();

  // Sample active call for demonstration
  const demoCall: EmergencyCall = activeCall || {
    id: 'mlvtkryw',
    type: 'heart',
    patientName: 'BUDI',
    reporterName: 'Weni 1',
    location: {
      address: 'Barat Magetan',
      lat: -7.630000, // Magetan coordinates
      lng: 111.350000
    },
    severity: 'berat',
    timestamp: '5/9/2025, 19:16:39',
    status: 'dalam_perjalanan'
  };

  useEffect(() => {
    if (demoCall) {
      calculateRoute();
    }
  }, [demoCall]);

  const calculateRoute = async () => {
    try {
      // Route 1: Current Location to Emergency Location
      const route1 = await getRouteData(
        currentLocation,
        demoCall.location,
        'Ambulans Base',
        demoCall.location.address
      );

      // Route 2: Emergency Location to RSPAU
      const route2 = await getRouteData(
        demoCall.location,
        RSPAU_LOCATION,
        demoCall.location.address,
        RSPAU_LOCATION.name
      );

      setRouteSegments([route1, route2]);
      
      // Set map center to show entire route
      const allPoints = [
        currentLocation,
        demoCall.location,
        RSPAU_LOCATION
      ];
      const centerLat = allPoints.reduce((sum, point) => sum + point.lat, 0) / allPoints.length;
      const centerLng = allPoints.reduce((sum, point) => sum + point.lng, 0) / allPoints.length;
      setMapCenter([centerLat, centerLng]);

    } catch (error) {
      console.error('Route calculation error:', error);
      toast({
        title: "⚠️ Route Error",
        description: "Menggunakan rute langsung",
        variant: "default"
      });
      
      // Fallback to straight lines
      setRouteSegments([
        createStraightLineRoute(currentLocation, demoCall.location, 'Ambulans Base', demoCall.location.address),
        createStraightLineRoute(demoCall.location, RSPAU_LOCATION, demoCall.location.address, RSPAU_LOCATION.name)
      ]);
    }
  };

  const getRouteData = async (from: {lat: number, lng: number}, to: {lat: number, lng: number}, fromName: string, toName: string): Promise<RouteSegment> => {
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`
      );
      const data = await response.json();
      
      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
        
        return {
          id: `route-${Date.now()}`,
          from: { lat: from.lat, lng: from.lng, name: fromName },
          to: { lat: to.lat, lng: to.lng, name: toName },
          coordinates,
          distance: route.distance / 1000, // Convert to km
          duration: route.duration / 60, // Convert to minutes
          instructions: route.legs[0]?.steps?.map((step: any) => ({
            text: step.maneuver?.instruction || 'Lanjutkan',
            distance: step.distance / 1000,
            duration: step.duration / 60
          })) || []
        };
      }
    } catch (error) {
      console.error('OSRM API error:', error);
    }
    
    // Fallback to straight line
    return createStraightLineRoute(from, to, fromName, toName);
  };

  const createStraightLineRoute = (from: {lat: number, lng: number}, to: {lat: number, lng: number}, fromName: string, toName: string): RouteSegment => {
    const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng);
    const duration = (distance / 50) * 60; // Assume 50 km/h average speed
    
    return {
      id: `straight-${Date.now()}`,
      from: { lat: from.lat, lng: from.lng, name: fromName },
      to: { lat: to.lat, lng: to.lng, name: toName },
      coordinates: [[from.lat, from.lng], [to.lat, to.lng]],
      distance,
      duration,
      instructions: [
        { text: `Menuju ${toName}`, distance, duration }
      ]
    };
  };

  const startNavigation = () => {
    setNavigationActive(true);
    setCurrentStep(0);
    toast({
      title: "🚑 Navigasi Dimulai",
      description: "Menuju lokasi darurat terlebih dahulu",
    });
  };

  const nextStep = () => {
    if (currentStep === 0) {
      setCurrentStep(1);
      toast({
        title: "📍 Tiba di Lokasi Darurat",
        description: "Sekarang menuju RSPAU Harjolukito",
      });
    } else {
      setNavigationActive(false);
      toast({
        title: "🏥 Tiba di RSPAU",
        description: "Navigasi selesai",
      });
    }
  };

  const openExternalNavigation = (segment: RouteSegment) => {
    const url = `https://www.google.com/maps/dir/${segment.from.lat},${segment.from.lng}/${segment.to.lat},${segment.to.lng}`;
    window.open(url, '_blank');
  };

  const currentRoute = routeSegments[currentStep];
  const totalDistance = routeSegments.reduce((sum, route) => sum + route.distance, 0);
  const totalDuration = routeSegments.reduce((sum, route) => sum + route.duration, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚑 Enhanced Navigation</h2>
          <p className="text-gray-600">Navigasi ambulans ke lokasi darurat dan RSPAU</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={navigationActive ? "default" : "secondary"}>
            {navigationActive ? "🟢 NAVIGASI AKTIF" : "⏸️ STANDBY"}
          </Badge>
        </div>
      </div>

      {/* Emergency Call Info */}
      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>PANGGILAN AKTIF - DALAM PERJALANAN</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-red-700 font-medium">ID:</p>
              <p className="text-red-900">#{demoCall.id}</p>
            </div>
            <div>
              <p className="text-red-700 font-medium">Jenis:</p>
              <p className="text-red-900 capitalize">{demoCall.type}</p>
            </div>
            <div>
              <p className="text-red-700 font-medium">Pasien:</p>
              <p className="text-red-900">{demoCall.patientName}</p>
            </div>
            <div>
              <p className="text-red-700 font-medium">Pelapor:</p>
              <p className="text-red-900">{demoCall.reporterName}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-red-700 font-medium">Lokasi:</p>
              <p className="text-red-900">{demoCall.location.address}</p>
            </div>
            <div>
              <p className="text-red-700 font-medium">Waktu:</p>
              <p className="text-red-900">{demoCall.timestamp}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <Route className="w-5 h-5" />
            <span>Rencana Rute</span>
          </h3>

          {routeSegments.map((segment, index) => (
            <NavigationRouteCard
              key={segment.id}
              segment={segment}
              index={index}
              currentStep={currentStep}
              navigationActive={navigationActive}
              onOpenExternalNavigation={openExternalNavigation}
              onNextStep={nextStep}
            />
          ))}

          {/* Navigation Control */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900">Kontrol Navigasi</h4>
                  <p className="text-sm text-gray-600">Total: {formatDistance(totalDistance)} • {formatTravelTime(totalDuration)}</p>
                </div>
              </div>
              
              {!navigationActive ? (
                <Button
                  onClick={startNavigation}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Mulai Navigasi
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress:</span>
                    <span>{currentStep + 1} dari {routeSegments.length}</span>
                  </div>
                  <Progress value={((currentStep + 1) / routeSegments.length) * 100} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Map */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Peta Navigasi</span>
          </h3>
          
          <NavigationMapView
            mapCenter={mapCenter}
            currentLocation={currentLocation}
            activeCall={demoCall}
            routeSegments={routeSegments}
            currentStep={currentStep}
            navigationActive={navigationActive}
            rspauLocation={RSPAU_LOCATION}
          />
        </div>
      </div>

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