import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AmbulanceDriver {
  id: string;
  nama: string;
  nrp: string;
  no_telepon: string;
  unit_ambulans: string;
  shift: string;
  status: 'active' | 'off-duty' | 'on-call';
  lokasi_terakhir?: string;
  terakhir_update?: string;
  created_at: string;
  updated_at: string;
}

export const useAmbulanceDrivers = () => {
  const [drivers, setDrivers] = useState<AmbulanceDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ambulance_drivers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure status matches our interface
      const typedData = (data || []).map(driver => ({
        ...driver,
        status: driver.status as 'active' | 'off-duty' | 'on-call'
      })) as AmbulanceDriver[];
      
      setDrivers(typedData);
    } catch (error) {
      console.error('Error fetching ambulance drivers:', error);
      toast({
        title: "❌ Error",
        description: "Gagal memuat data driver ambulans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDriver = async (driverData: Omit<AmbulanceDriver, 'id' | 'created_at' | 'updated_at' | 'terakhir_update'>) => {
    try {
      const { data, error } = await supabase
        .from('ambulance_drivers')
        .insert([{
          ...driverData,
          terakhir_update: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Type assertion to ensure status matches our interface
      const typedData = {
        ...data,
        status: data.status as 'active' | 'off-duty' | 'on-call'
      } as AmbulanceDriver;

      setDrivers(prev => [typedData, ...prev]);
      toast({
        title: "✅ Berhasil",
        description: `Driver ${driverData.nama} berhasil ditambahkan`,
      });

      return data;
    } catch (error) {
      console.error('Error creating driver:', error);
      toast({
        title: "❌ Error",
        description: error instanceof Error ? error.message : "Gagal menambahkan driver",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateDriver = async (id: string, updates: Partial<Omit<AmbulanceDriver, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('ambulance_drivers')
        .update({
          ...updates,
          terakhir_update: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Type assertion to ensure status matches our interface
      const typedData = {
        ...data,
        status: data.status as 'active' | 'off-duty' | 'on-call'
      } as AmbulanceDriver;

      setDrivers(prev => prev.map(driver => 
        driver.id === id ? typedData : driver
      ));

      const driverName = drivers.find(d => d.id === id)?.nama;
      toast({
        title: "📱 Status Diperbarui",
        description: `${driverName} - Status: ${updates.status || 'updated'}`,
      });

      return data;
    } catch (error) {
      console.error('Error updating driver:', error);
      toast({
        title: "❌ Error",
        description: "Gagal mengupdate data driver",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteDriver = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ambulance_drivers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const driverName = drivers.find(d => d.id === id)?.nama;
      setDrivers(prev => prev.filter(driver => driver.id !== id));
      
      toast({
        title: "🗑️ Driver Dihapus",
        description: `${driverName} berhasil dihapus dari sistem`,
      });
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast({
        title: "❌ Error",
        description: "Gagal menghapus driver",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Set up real-time subscription
  useEffect(() => {
    fetchDrivers();

    const channel = supabase
      .channel('ambulance_drivers_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ambulance_drivers'
        },
        () => {
          fetchDrivers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    drivers,
    loading,
    createDriver,
    updateDriver,
    deleteDriver,
    refetch: fetchDrivers,
  };
};