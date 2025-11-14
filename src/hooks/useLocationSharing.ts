import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useGeolocation } from './useGeolocation';
import { useEmergencyAuth } from './useEmergencyAuth';
import { toast } from './use-toast';

export interface LocationData {
  id: string;
  user_id: string;
  role: 'user' | 'ambulance' | 'admin';
  name: string;
  lat: number;
  lng: number;
  last_seen: string;
  created_at: string;
  updated_at: string;
}

interface UseLocationSharingProps {
  role: 'user' | 'ambulance' | 'admin';
  userName: string;
  enabled?: boolean;
  updateInterval?: number; // milliseconds
}

export const useLocationSharing = ({ 
  role, 
  userName, 
  enabled = true, 
  updateInterval = 5000 
}: UseLocationSharingProps) => {
  const [allLocations, setAllLocations] = useState<LocationData[]>([]);
  const [myLocation, setMyLocation] = useState<LocationData | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { latitude, longitude, error: geoError, getCurrentLocation } = useGeolocation();
  const { ensureAuthenticated, isAuthenticated, user } = useEmergencyAuth();
  const locationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeChannelRef = useRef<any>(null);

  // Calculate distance between two points using Haversine formula
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Get distance to specific location
  const getDistanceTo = useCallback((targetLat: number, targetLng: number): number | null => {
    if (!latitude || !longitude) return null;
    return calculateDistance(latitude, longitude, targetLat, targetLng);
  }, [latitude, longitude, calculateDistance]);

  // Get nearest location by role
  const getNearestLocation = useCallback((targetRole?: 'user' | 'ambulance' | 'admin'): LocationData | null => {
    if (!latitude || !longitude) return null;
    
    const filteredLocations = targetRole 
      ? allLocations.filter(loc => loc.role === targetRole)
      : allLocations;

    if (filteredLocations.length === 0) return null;

    return filteredLocations.reduce((nearest, location) => {
      const currentDistance = calculateDistance(latitude, longitude, location.lat, location.lng);
      const nearestDistance = calculateDistance(latitude, longitude, nearest.lat, nearest.lng);
      return currentDistance < nearestDistance ? location : nearest;
    });
  }, [latitude, longitude, allLocations, calculateDistance]);

  // Update location in database with location stability check
  const updateLocation = useCallback(async () => {
    if (!latitude || !longitude || !enabled) return;

    try {
      // Ensure we have authentication for emergency access
      const authenticatedUser = await ensureAuthenticated();
      if (!authenticatedUser) {
        setError('Emergency authentication failed - location sharing disabled');
        return;
      }

      // Check if user already has a location record
      const { data: existingLocation } = await supabase
        .from('locations')
        .select('*')
        .eq('user_id', authenticatedUser.id)
        .single();

      // Location stability check - only update if moved more than 10 meters
      const MINIMUM_DISTANCE_THRESHOLD = 0.01; // ~10 meters in km
      let shouldUpdate = true;

      if (existingLocation) {
        const distance = calculateDistance(
          existingLocation.lat, 
          existingLocation.lng, 
          latitude, 
          longitude
        );
        
        // Don't update if the distance is less than threshold (reduces GPS jitter)
        shouldUpdate = distance >= MINIMUM_DISTANCE_THRESHOLD;
        
        if (!shouldUpdate) {
          // Still update the timestamp to show we're active, but keep same coordinates
          const { error } = await supabase
            .from('locations')
            .update({
              last_seen: new Date().toISOString(),
              name: userName
            })
            .eq('user_id', authenticatedUser.id);

          if (!error) setError(null); // Clear any previous errors
          return;
        }
      }

      if (existingLocation && shouldUpdate) {
        // Update existing location with new coordinates
        const { data, error } = await supabase
          .from('locations')
          .update({
            lat: latitude,
            lng: longitude,
            last_seen: new Date().toISOString(),
            name: userName
          })
          .eq('user_id', authenticatedUser.id)
          .select()
          .single();

        if (error) throw error;
        setMyLocation(data as LocationData);
        setError(null); // Clear any previous errors
      } else if (!existingLocation) {
        // Insert new location
        const { data, error } = await supabase
          .from('locations')
          .insert({
            user_id: authenticatedUser.id,
            role,
            name: userName,
            lat: latitude,
            lng: longitude,
            last_seen: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        setMyLocation(data as LocationData);
        setError(null); // Clear any previous errors
      }
    } catch (err) {
      console.error('Error updating location:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update location';
      setError(errorMessage);
      
      // If it's an auth error, try to re-authenticate
      if (errorMessage.includes('auth') || errorMessage.includes('unauthorized')) {
        console.log('Auth error detected, will retry on next update...');
      }
    }
  }, [latitude, longitude, enabled, role, userName, ensureAuthenticated, calculateDistance]);

  // Start location sharing
  const startSharing = useCallback(async () => {
    if (isSharing) {
      console.log('Location sharing already active');
      return;
    }

    if (geoError) {
      setError(geoError);
      return;
    }

    if (!latitude || !longitude) {
      setError('GPS location not available');
      return;
    }

    if (!isAuthenticated) {
      setError('Authentication required for location sharing');
      return;
    }

    console.log(`Starting location sharing as ${role} - ${userName}`);
    setIsSharing(true);
    setError(null);

    try {
      // Initial location update
      await updateLocation();
      
      // Clear any existing interval
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      
      // Set up interval for regular updates
      locationIntervalRef.current = setInterval(async () => {
        try {
          await updateLocation();
        } catch (intervalError) {
          console.error('Interval location update failed:', intervalError);
          // Don't stop sharing on single update failure
        }
      }, updateInterval);

      toast({
        title: "📍 Location Sharing Started",
        description: `Sharing as ${role} - ${userName}`,
      });
    } catch (err) {
      console.error('Failed to start location sharing:', err);
      setError(err instanceof Error ? err.message : 'Failed to start sharing');
      setIsSharing(false);
      
      // Clean up interval on failure
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
        locationIntervalRef.current = null;
      }
    }
  }, [isSharing, latitude, longitude, isAuthenticated, updateLocation, updateInterval, toast, role, userName, geoError]);

  // Stop location sharing
  const stopSharing = useCallback(async () => {
    console.log('Stopping location sharing...');
    
    // Clear interval first
    if (locationIntervalRef.current) {
      clearInterval(locationIntervalRef.current);
      locationIntervalRef.current = null;
    }

    // Remove location from database
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('locations')
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.error('Error removing location from database:', error);
        }
      }
      setMyLocation(null);
    } catch (err) {
      console.error('Error removing location:', err);
    }

    // Set sharing state to false after cleanup
    setIsSharing(false);
    setError(null);

    toast({
      title: "📍 Location Sharing Stopped",
      description: "Your location is no longer being shared.",
    });
  }, [toast]);

  // Fetch all locations
  const fetchAllLocations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setAllLocations((data || []) as LocationData[]);
    } catch (err) {
      console.error('Error fetching locations:', err);
    }
  }, []);

  // Set up realtime subscription
  useEffect(() => {
    fetchAllLocations();

    realtimeChannelRef.current = supabase
      .channel('locations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'locations' },
        () => {
          fetchAllLocations();
        }
      )
      .subscribe();

    return () => {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, [fetchAllLocations]);

  // Auto-start sharing if enabled and conditions are met - with debounce
  useEffect(() => {
    if (enabled && latitude && longitude && isAuthenticated && !isSharing) {
      console.log('Auto-starting location sharing for emergency system...');
      
      // Small delay to ensure all conditions are stable
      const startTimer = setTimeout(() => {
        if (enabled && latitude && longitude && isAuthenticated && !isSharing) {
          startSharing();
        }
      }, 1000);

      return () => clearTimeout(startTimer);
    }
  }, [enabled, latitude, longitude, isAuthenticated, isSharing, startSharing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationIntervalRef.current) {
        clearInterval(locationIntervalRef.current);
      }
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
    };
  }, []);

  return {
    allLocations,
    myLocation,
    isSharing,
    error: error || geoError,
    startSharing,
    stopSharing,
    getCurrentLocation,
    getDistanceTo,
    getNearestLocation,
    calculateDistance,
  };
};