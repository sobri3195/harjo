import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AmbulanceStatus {
  id: string;
  ambulance_id: string;
  status: string;
  shift_start: string;
  shift_end: string;
  fuel_level: number;
  crew_count: number;
  position: string;
  position_lat?: number;
  position_lng?: number;
  last_updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Equipment {
  id: string;
  ambulance_id: string;
  equipment_type: string;
  equipment_name: string;
  unit: string;
  status: string;
  current_level?: number;
  max_capacity?: number;
  last_checked_by: string;
  notes?: string;
  last_checked_at: string;
}

export const useAmbulanceStatus = () => {
  const [ambulanceStatus, setAmbulanceStatus] = useState<AmbulanceStatus | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAmbulanceStatus = async (ambulanceId: string = 'AMB-001') => {
    try {
      const { data: statusData, error: statusError } = await supabase
        .from('ambulance_status')
        .select('*')
        .eq('ambulance_id', ambulanceId)
        .single();

      if (statusError) throw statusError;

      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipment_tracking')
        .select('*')
        .eq('ambulance_id', ambulanceId);

      if (equipmentError) throw equipmentError;

      setAmbulanceStatus(statusData);
      setEquipment(equipmentData || []);
    } catch (error) {
      console.error('Error fetching ambulance status:', error);
      toast.error('Gagal memuat status ambulans');
    } finally {
      setLoading(false);
    }
  };

  const updateAmbulanceStatus = async (ambulanceId: string, updates: Partial<AmbulanceStatus>) => {
    try {
      const { error } = await supabase
        .from('ambulance_status')
        .update({
          ...updates,
          last_updated_by: 'Current User',
          updated_at: new Date().toISOString()
        })
        .eq('ambulance_id', ambulanceId);

      if (error) throw error;

      toast.success('Status ambulans berhasil diperbarui');
      fetchAmbulanceStatus(ambulanceId);
    } catch (error) {
      console.error('Error updating ambulance status:', error);
      toast.error('Gagal memperbarui status ambulans');
    }
  };

  const updateEquipment = async (equipmentId: string, updates: Partial<Equipment>) => {
    try {
      const { error } = await supabase
        .from('equipment_tracking')
        .update({
          ...updates,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', equipmentId);

      if (error) throw error;

      toast.success('Status peralatan berhasil diperbarui');
      if (ambulanceStatus) {
        fetchAmbulanceStatus(ambulanceStatus.ambulance_id);
      }
    } catch (error) {
      console.error('Error updating equipment:', error);
      toast.error('Gagal memperbarui status peralatan');
    }
  };

  const getAllAmbulanceStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from('ambulance_status')
        .select('*')
        .order('ambulance_id');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all ambulance statuses:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchAmbulanceStatus();

    // Real-time subscription
    const channel = supabase
      .channel('ambulance_status_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_status'
        },
        () => {
          if (ambulanceStatus) {
            fetchAmbulanceStatus(ambulanceStatus.ambulance_id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipment_tracking'
        },
        () => {
          if (ambulanceStatus) {
            fetchAmbulanceStatus(ambulanceStatus.ambulance_id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ambulanceStatus?.ambulance_id]);

  return {
    ambulanceStatus,
    equipment,
    loading,
    updateAmbulanceStatus,
    updateEquipment,
    getAllAmbulanceStatuses,
    refetch: () => ambulanceStatus && fetchAmbulanceStatus(ambulanceStatus.ambulance_id)
  };
};