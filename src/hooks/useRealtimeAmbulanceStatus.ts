import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AmbulancePosition {
  id: string;
  ambulance_id: string;
  latitude: number;
  longitude: number;
  status: 'idle' | 'dispatched' | 'en_route' | 'arrived' | 'returning' | 'completed';
  speed?: number;
  heading?: number;
  timestamp: string;
  emergency_report_id?: string;
}

export const useRealtimeAmbulanceStatus = () => {
  const [ambulances, setAmbulances] = useState<AmbulancePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Lightweight data fetching - only essential data
  const fetchAmbulancePositions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('ambulance_tracking')
        .select(`
          id,
          ambulance_id,
          latitude,
          longitude,
          speed,
          heading,
          timestamp,
          created_at
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Get latest position for each ambulance
      const latestPositions = data.reduce((acc: any, curr) => {
        if (!acc[curr.ambulance_id] || new Date(curr.timestamp) > new Date(acc[curr.ambulance_id].timestamp)) {
          acc[curr.ambulance_id] = curr;
        }
        return acc;
      }, {});

      // Get ambulance status
      const { data: statusData } = await supabase
        .from('ambulance_status')
        .select('ambulance_id, status');

      // Combine position and status data
      const combinedData = Object.values(latestPositions).map((pos: any) => {
        const status = statusData?.find(s => s.ambulance_id === pos.ambulance_id);
        return {
          ...pos,
          status: status?.status || 'idle'
        };
      });

      setAmbulances(combinedData as AmbulancePosition[]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ambulance positions:', error);
      setLoading(false);
    }
  }, []);

  // Real-time subscription with optimized payload
  useEffect(() => {
    fetchAmbulancePositions();

    const channel = supabase
      .channel('ambulance-tracking-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_tracking'
        },
        (payload) => {
          console.log('Ambulance position update:', payload);
          fetchAmbulancePositions(); // Refresh data
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_status'
        },
        (payload) => {
          console.log('Ambulance status update:', payload);
          fetchAmbulancePositions(); // Refresh data
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAmbulancePositions]);

  // Auto-update ambulance status progression
  const updateAmbulanceStatus = useCallback(async (ambulanceId: string, newStatus: string, reportId?: string) => {
    try {
      // Update ambulance status
      await supabase
        .from('ambulance_status')
        .update({ 
          status: newStatus,
          last_updated_by: 'System',
          updated_at: new Date().toISOString()
        })
        .eq('ambulance_id', ambulanceId);

      // Update emergency dispatch if exists
      if (reportId) {
        const statusMap: Record<string, string> = {
          'dispatched': 'dispatched',
          'en_route': 'en_route', 
          'arrived': 'arrived',
          'completed': 'completed'
        };

        await supabase
          .from('emergency_dispatches')
          .update({
            status: statusMap[newStatus] || newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('emergency_report_id', reportId)
          .eq('ambulance_id', ambulanceId);
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating ambulance status:', error);
      return { success: false, error };
    }
  }, []);

  // Simulate ambulance movement (for demo)
  const simulateMovement = useCallback(async (ambulanceId: string) => {
    const baseCoords = { lat: -7.7956, lng: 110.3695 }; // Yogyakarta
    const randomOffset = () => (Math.random() - 0.5) * 0.01;

    await supabase
      .from('ambulance_tracking')
      .insert({
        ambulance_id: ambulanceId,
        latitude: baseCoords.lat + randomOffset(),
        longitude: baseCoords.lng + randomOffset(),
        speed: Math.random() * 60,
        heading: Math.random() * 360,
        timestamp: new Date().toISOString()
      });
  }, []);

  return {
    ambulances,
    loading,
    isConnected,
    updateAmbulanceStatus,
    simulateMovement,
    refetch: fetchAmbulancePositions
  };
};