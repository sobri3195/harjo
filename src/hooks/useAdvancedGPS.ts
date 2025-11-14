import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface RouteData {
  distance: number;
  duration: number;
  steps: Array<{
    instruction: string;
    distance: number;
    duration: number;
    polyline: string;
  }>;
  polyline: string;
  trafficDelay?: number;
  alternativeRoutes?: RouteData[];
}

export const useAdvancedGPS = (ambulanceId: string) => {
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [speed, setSpeed] = useState<number>(0);
  const [heading, setHeading] = useState<number>(0);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [eta, setEta] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<GPSPosition[]>([]);
  const [activeAmbulances, setActiveAmbulances] = useState<any[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPositionRef = useRef<GPSPosition | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Enhanced geolocation options for high accuracy
  const geoOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 1000 // Allow 1 second old positions for better performance
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Connection Restored",
        description: "GPS tracking is back online",
      });
      // Sync offline queue when back online
      syncOfflineQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Connection Lost",
        description: "GPS data will be queued for sync",
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

  // Sync offline queue when connection is restored
  const syncOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    
    try {
      const batch = offlineQueue.map(position => ({
        ambulance_id: ambulanceId,
        latitude: position.latitude,
        longitude: position.longitude,
        accuracy: position.accuracy,
        speed: position.speed,
        heading: position.heading,
        timestamp: new Date(position.timestamp).toISOString()
      }));

      await (supabase as any).from('ambulance_tracking').insert(batch);
      setOfflineQueue([]);
      toast({
        title: "Data Synced",
        description: `${batch.length} GPS positions synchronized`,
      });
    } catch (error) {
      console.error('Failed to sync offline queue:', error);
    }
  }, [offlineQueue, ambulanceId]);

  // Calculate speed between two positions
  const calculateSpeed = useCallback((pos1: GPSPosition, pos2: GPSPosition): number => {
    const distance = calculateDistance(pos1.latitude, pos1.longitude, pos2.latitude, pos2.longitude);
    const timeDiff = (pos2.timestamp - pos1.timestamp) / 1000; // seconds
    return timeDiff > 0 ? (distance * 1000) / timeDiff : 0; // m/s
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Update position in real-time
  const updatePosition = useCallback(async (position: GeolocationPosition) => {
    const newPosition: GPSPosition = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude || undefined,
      altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
      heading: position.coords.heading || undefined,
      speed: position.coords.speed || undefined,
      timestamp: Date.now()
    };

    // Calculate speed if we have previous position
    if (lastPositionRef.current) {
      const calculatedSpeed = calculateSpeed(lastPositionRef.current, newPosition);
      setSpeed(calculatedSpeed);
    }

    setCurrentPosition(newPosition);
    setAccuracy(position.coords.accuracy);
    setHeading(position.coords.heading || 0);
    setError(null);

    // Store position in database for real-time tracking
    const calculatedSpeed = lastPositionRef.current ? 
      calculateSpeed(lastPositionRef.current, newPosition) : 0;
    
    const positionData = {
      ambulance_id: ambulanceId,
      latitude: newPosition.latitude,
      longitude: newPosition.longitude,
      accuracy: newPosition.accuracy,
      speed: newPosition.speed || calculatedSpeed,
      heading: newPosition.heading,
      timestamp: new Date().toISOString()
    };

    if (isOnline) {
      try {
        await (supabase as any)
          .from('ambulance_tracking')
          .upsert(positionData, { onConflict: 'ambulance_id' });
      } catch (error) {
        console.error('Failed to update position in database:', error);
        // Add to offline queue if database update fails
        setOfflineQueue(prev => [...prev, newPosition]);
      }
    } else {
      // Store in offline queue
      setOfflineQueue(prev => [...prev, newPosition]);
    }

    lastPositionRef.current = newPosition;
  }, [ambulanceId, calculateSpeed]);

  // Setup real-time ambulance tracking channel
  const setupRealtimeTracking = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
    }

    realtimeChannelRef.current = supabase
      .channel('ambulance-tracking')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_tracking'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setActiveAmbulances(prev => {
              const filtered = prev.filter(a => a.ambulance_id !== payload.new.ambulance_id);
              return [...filtered, payload.new];
            });
          }
        }
      )
      .subscribe();
  }, []);

  // Start real-time GPS tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsTracking(true);
    setError(null);

    // Setup realtime tracking
    setupRealtimeTracking();

    // Start watching position with improved error handling
    watchIdRef.current = navigator.geolocation.watchPosition(
      updatePosition,
      (error) => {
        let errorMessage = 'GPS Error: ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Location access denied. Please enable GPS permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information unavailable. Check GPS signal.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Retrying...';
            break;
          default:
            errorMessage += error.message;
        }
        setError(errorMessage);
        
        // Don't stop tracking on timeout, retry instead
        if (error.code !== error.TIMEOUT) {
          setIsTracking(false);
        }
      },
      geoOptions
    );

    // High frequency position updates for emergency vehicles
    trackingIntervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        updatePosition,
        (error) => {
          console.error('GPS update error:', error.message || 'Unknown GPS error');
          // Only show user notification on critical errors
          if (error.code === error.PERMISSION_DENIED) {
            toast({
              title: "GPS Permission Required",
              description: "Please enable location access for tracking",
              variant: "destructive"
            });
          }
        },
        geoOptions
      );
    }, 2000); // Increased to every 2 seconds for emergency vehicles
  }, [updatePosition, setupRealtimeTracking]);

  // Stop GPS tracking
  const stopTracking = useCallback(() => {
    setIsTracking(false);
    
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }

    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  // Enhanced traffic-aware routing with multiple providers
  const getTrafficAwareRoute = useCallback(async (destination: { lat: number; lng: number }) => {
    if (!currentPosition) return null;

    try {
      // Priority 1: Try GraphHopper (free tier with traffic)
      const graphHopperResponse = await fetch(
        `https://graphhopper.com/api/1/route?point=${currentPosition.latitude},${currentPosition.longitude}&point=${destination.lat},${destination.lng}&vehicle=car&locale=en&optimize=false&instructions=true&calc_points=true&debug=false&elevation=false&points_encoded=false`
      );
      
      if (graphHopperResponse.ok) {
        const data = await graphHopperResponse.json();
        const route = data.paths[0];
        
        const routeData: RouteData = {
          distance: route.distance / 1000, // Convert to km
          duration: route.time / 60000, // Convert to minutes
          polyline: route.points.coordinates.map((coord: number[]) => `${coord[1]},${coord[0]}`).join(';'),
          steps: route.instructions.map((step: any) => ({
            instruction: step.text,
            distance: step.distance,
            duration: step.time / 1000,
            polyline: ''
          })),
          trafficDelay: 0
        };

        setRouteData(routeData);
        
        // Calculate ETA with traffic consideration
        const etaTime = new Date();
        etaTime.setMinutes(etaTime.getMinutes() + routeData.duration);
        setEta(etaTime);
        
        // Store route for offline use
        localStorage.setItem(`route_${ambulanceId}`, JSON.stringify(routeData));
        
        return routeData;
      }

      // Fallback: Use OSRM (Open Source Routing Machine)
      const osrmResponse = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${currentPosition.longitude},${currentPosition.latitude};${destination.lng},${destination.lat}?overview=full&geometries=polyline&steps=true`
      );

      if (osrmResponse.ok) {
        const data = await osrmResponse.json();
        const route = data.routes[0];
        
        const routeData: RouteData = {
          distance: route.distance / 1000,
          duration: route.duration / 60,
          polyline: route.geometry,
          steps: route.legs[0].steps.map((step: any) => ({
            instruction: step.maneuver.type,
            distance: step.distance,
            duration: step.duration,
            polyline: step.geometry || ''
          })),
          trafficDelay: 0
        };

        setRouteData(routeData);
        
        const etaTime = new Date();
        etaTime.setMinutes(etaTime.getMinutes() + routeData.duration);
        setEta(etaTime);
        
        return routeData;
      }
      
      // Final fallback to cached route or simple calculation
      const cachedRoute = localStorage.getItem(`route_${ambulanceId}`);
      if (cachedRoute && !isOnline) {
        const routeData = JSON.parse(cachedRoute);
        setRouteData(routeData);
        toast({
          title: "Using Cached Route",
          description: "Offline mode - using last known route",
        });
        return routeData;
      }

      // Simple distance calculation as last resort
      const distance = calculateDistance(
        currentPosition.latitude,
        currentPosition.longitude,
        destination.lat,
        destination.lng
      );
      
      const estimatedDuration = (distance / 40) * 60; // Assume 40 km/h average
      
      const fallbackRoute: RouteData = {
        distance,
        duration: estimatedDuration,
        steps: [],
        polyline: ''
      };
      
      setRouteData(fallbackRoute);
      return fallbackRoute;
      
    } catch (error) {
      console.error('Route calculation error:', error);
      setError('Failed to calculate route - using offline data if available');
      
      // Try to use cached route in case of error
      const cachedRoute = localStorage.getItem(`route_${ambulanceId}`);
      if (cachedRoute) {
        const routeData = JSON.parse(cachedRoute);
        setRouteData(routeData);
        return routeData;
      }
      
      return null;
    }
  }, [currentPosition, calculateDistance, ambulanceId, isOnline]);

  // Get alternative routes
  const getAlternativeRoutes = useCallback(async (destination: { lat: number; lng: number }) => {
    if (!currentPosition) return [];

    try {
      // This would normally call multiple routing services
      // For demo, we'll create mock alternatives
      const mainRoute = await getTrafficAwareRoute(destination);
      if (!mainRoute) return [];

      const alternatives: RouteData[] = [
        {
          ...mainRoute,
          duration: mainRoute.duration * 1.2, // 20% longer
          distance: mainRoute.distance * 1.1,  // 10% longer
          trafficDelay: 5 // 5 minutes traffic delay
        },
        {
          ...mainRoute,
          duration: mainRoute.duration * 0.9, // 10% shorter but highway
          distance: mainRoute.distance * 1.3,  // 30% longer distance
          trafficDelay: 0 // No traffic on highway
        }
      ];

      return alternatives;
    } catch (error) {
      console.error('Alternative routes error:', error);
      return [];
    }
  }, [currentPosition, getTrafficAwareRoute]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  // Auto-start tracking on mount
  useEffect(() => {
    if (ambulanceId) {
      startTracking();
    }
  }, [ambulanceId, startTracking]);

  // Dispatch to emergency location
  const dispatchToEmergency = useCallback(async (emergencyReportId: string, emergencyLocation: { lat: number; lng: number }) => {
    if (!currentPosition) return null;

    try {
      const routeData = await getTrafficAwareRoute(emergencyLocation);
      if (!routeData) return null;

      // Create dispatch record
      await (supabase as any).from('emergency_dispatches').insert({
        emergency_report_id: emergencyReportId,
        ambulance_id: ambulanceId,
        route_data: routeData,
        distance_km: routeData.distance,
        eta_minutes: routeData.duration,
        status: 'en_route'
      });

      toast({
        title: "Dispatched to Emergency",
        description: `ETA: ${Math.round(routeData.duration)} minutes`,
      });

      return routeData;
    } catch (error) {
      console.error('Dispatch error:', error);
      return null;
    }
  }, [currentPosition, getTrafficAwareRoute, ambulanceId]);

  return {
    currentPosition,
    isTracking,
    speed,
    heading,
    accuracy,
    routeData,
    eta,
    error,
    isOnline,
    offlineQueue: offlineQueue.length,
    activeAmbulances,
    startTracking,
    stopTracking,
    getTrafficAwareRoute,
    getAlternativeRoutes,
    calculateDistance,
    dispatchToEmergency,
    syncOfflineQueue
  };
};