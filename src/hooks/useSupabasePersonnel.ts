import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Personnel {
  id: string;
  user_id?: string;
  nama: string;
  pangkat: string;
  nrp: string;
  jabatan: string;
  satuan: string;
  no_telepon: string;
  alamat: string;
  created_at: string;
  updated_at: string;
}

export const useSupabasePersonnel = () => {
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonnel = async () => {
    try {
      // Get current user
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        console.log('No user authenticated');
        setPersonnel([]);
        return;
      }

      const personnelResponse = await supabase
        .from('personnel')
        .select('*')
        .eq('user_id', userResponse.data.user.id)
        .order('created_at', { ascending: false });

      if (personnelResponse.error) throw personnelResponse.error;
      setPersonnel(personnelResponse.data || []);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      setPersonnel([]);
      toast({
        title: "Error",
        description: "Gagal memuat data personel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPersonnel = async (personnelInput: {
    nama: string;
    pangkat: string;
    nrp: string;
    jabatan: string;
    satuan: string;
    no_telepon: string;
    alamat: string;
  }) => {
    try {
      // Get current user
      const userResponse = await supabase.auth.getUser();
      
      if (!userResponse.data.user) {
        throw new Error('User not authenticated');
      }

      // Add user_id to data
      const personnelData = {
        ...personnelInput,
        user_id: userResponse.data.user.id
      };

      const insertResponse = await supabase
        .from('personnel')
        .insert([personnelData])
        .select()
        .single();

      if (insertResponse.error) throw insertResponse.error;

      const newPersonnel = insertResponse.data;
      setPersonnel(prev => [newPersonnel, ...prev]);
      toast({
        title: "Berhasil",
        description: "Data personel berhasil ditambahkan",
      });

      return newPersonnel;
    } catch (error: any) {
      console.error('Error creating personnel:', error);
      
      // Handle specific duplicate NRP error (409 conflict)
      if (error.code === '23505' && error.message?.includes('personnel_nrp_key')) {
        toast({
          title: "Error",
          description: "NRP sudah terdaftar. Gunakan NRP yang berbeda.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal menambahkan data personel",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const updatePersonnel = async (id: string, updateData: {
    nama?: string;
    pangkat?: string;
    nrp?: string;
    jabatan?: string;
    satuan?: string;
    no_telepon?: string;
    alamat?: string;
  }) => {
    try {
      const updateResponse = await supabase
        .from('personnel')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (updateResponse.error) throw updateResponse.error;

      const updatedPersonnel = updateResponse.data;
      setPersonnel(prev => prev.map(person => 
        person.id === id ? updatedPersonnel : person
      ));

      toast({
        title: "Berhasil",
        description: "Data personel berhasil diupdate",
      });

      return updatedPersonnel;
    } catch (error) {
      console.error('Error updating personnel:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate data personel",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePersonnel = async (id: string) => {
    try {
      const deleteResponse = await supabase
        .from('personnel')
        .delete()
        .eq('id', id);

      if (deleteResponse.error) throw deleteResponse.error;

      setPersonnel(prev => prev.filter(person => person.id !== id));
      toast({
        title: "Berhasil",
        description: "Data personel berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting personnel:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus data personel",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPersonnel();
  }, []);

  return {
    personnel,
    loading,
    createPersonnel,
    updatePersonnel,
    deletePersonnel,
    refetch: fetchPersonnel,
  };
};