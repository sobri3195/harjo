import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AmbulancePosition {
  ambulance_id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
  timestamp: string;
  status?: string;
}

export interface EmergencyDispatch {
  id: string;
  emergency_report_id: string | null;
  ambulance_id: string;
  dispatch_time: string;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  route_data: any;
  status: string;
  distance_km: number | null;
  eta_minutes: number | null;
}

export const useRealtimeAmbulanceTracking = () => {
  const [ambulances, setAmbulances] = useState<AmbulancePosition[]>([]);
  const [dispatches, setDispatches] = useState<EmergencyDispatch[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Setup real-time subscriptions
  useEffect(() => {
    // Track ambulance positions
    const ambulanceChannel = supabase
      .channel('ambulance-positions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_tracking'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setAmbulances(prev => {
              const filtered = prev.filter(a => a.ambulance_id !== payload.new.ambulance_id);
              return [...filtered, payload.new as AmbulancePosition];
            });
          } else if (payload.eventType === 'DELETE') {
            setAmbulances(prev => prev.filter(a => a.ambulance_id !== payload.old.ambulance_id));
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Track emergency dispatches
    const dispatchChannel = supabase
      .channel('emergency-dispatches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_dispatches'
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setDispatches(prev => {
              const filtered = prev.filter(d => d.id !== payload.new.id);
              return [...filtered, payload.new as EmergencyDispatch];
            });
          } else if (payload.eventType === 'DELETE') {
            setDispatches(prev => prev.filter(d => d.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Load initial data
    loadInitialData();

    return () => {
      supabase.removeChannel(ambulanceChannel);
      supabase.removeChannel(dispatchChannel);
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Load recent ambulance positions
      const { data: ambulanceData } = await supabase
        .from('ambulance_tracking')
        .select('*')
        .order('timestamp', { ascending: false });

      if (ambulanceData) {
        setAmbulances(ambulanceData);
      }

      // Load active dispatches
      const { data: dispatchData } = await supabase
        .from('emergency_dispatches')
        .select('*')
        .in('status', ['dispatched', 'en_route', 'arrived'])
        .order('dispatch_time', { ascending: false });

      if (dispatchData) {
        setDispatches(dispatchData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const getAmbulancesByProximity = useCallback((
    targetLat: number, 
    targetLng: number, 
    maxDistanceKm: number = 50
  ) => {
    return ambulances
      .map(ambulance => {
        const distance = calculateDistance(
          targetLat,
          targetLng,
          ambulance.latitude,
          ambulance.longitude
        );
        return { ...ambulance, distance };
      })
      .filter(ambulance => ambulance.distance <= maxDistanceKm)
      .sort((a, b) => a.distance - b.distance);
  }, [ambulances]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const dispatchNearestAmbulance = useCallback(async (
    emergencyReportId: string,
    emergencyLat: number,
    emergencyLng: number
  ) => {
    const nearbyAmbulances = getAmbulancesByProximity(emergencyLat, emergencyLng, 100);
    
    if (nearbyAmbulances.length === 0) {
      toast({
        title: "No Ambulances Available",
        description: "No ambulances found within 100km radius",
        variant: "destructive"
      });
      return null;
    }

    const nearest = nearbyAmbulances[0];
    const estimatedTime = Math.round((nearest.distance / 40) * 60); // Assume 40km/h average speed

    try {
      const { data } = await supabase
        .from('emergency_dispatches')
        .insert({
          emergency_report_id: emergencyReportId,
          ambulance_id: nearest.ambulance_id,
          distance_km: nearest.distance,
          eta_minutes: estimatedTime,
          status: 'dispatched'
        })
        .select()
        .single();

      toast({
        title: "Ambulance Dispatched",
        description: `${nearest.ambulance_id} dispatched - ETA: ${estimatedTime} minutes`,
      });

      return data;
    } catch (error) {
      console.error('Dispatch failed:', error);
      toast({
        title: "Dispatch Failed",
        description: "Failed to dispatch ambulance",
        variant: "destructive"
      });
      return null;
    }
  }, [getAmbulancesByProximity]);

  const updateDispatchStatus = useCallback(async (
    dispatchId: string,
    status: string,
    additionalData?: Partial<EmergencyDispatch>
  ) => {
    try {
      const updateData = {
        status,
        ...additionalData,
        ...(status === 'arrived' && { actual_arrival: new Date().toISOString() })
      };

      await supabase
        .from('emergency_dispatches')
        .update(updateData)
        .eq('id', dispatchId);

      toast({
        title: "Status Updated",
        description: `Dispatch status updated to: ${status}`,
      });
    } catch (error) {
      console.error('Status update failed:', error);
    }
  }, []);

  const getActiveDispatches = useCallback(() => {
    return dispatches.filter(d => ['dispatched', 'en_route'].includes(d.status));
  }, [dispatches]);

  const getAmbulanceStatus = useCallback((ambulanceId: string) => {
    const activeDispatch = dispatches.find(
      d => d.ambulance_id === ambulanceId && ['dispatched', 'en_route'].includes(d.status)
    );
    
    return activeDispatch ? activeDispatch.status : 'available';
  }, [dispatches]);

  return {
    ambulances,
    dispatches,
    isConnected,
    getAmbulancesByProximity,
    dispatchNearestAmbulance,
    updateDispatchStatus,
    getActiveDispatches,
    getAmbulanceStatus,
    loadInitialData
  };
};