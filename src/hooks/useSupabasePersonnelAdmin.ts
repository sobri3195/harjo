import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface PersonnelAdmin {
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

export const useSupabasePersonnelAdmin = () => {
  const [personnel, setPersonnel] = useState<PersonnelAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPersonnel = async () => {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPersonnel(data || []);
    } catch (error) {
      console.error('Error fetching personnel:', error);
      toast({
        title: "❌ Error",
        description: "Gagal memuat data personel",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPersonnel = async (personnelInput: Omit<PersonnelAdmin, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .insert([personnelInput])
        .select()
        .single();

      if (error) throw error;

      setPersonnel(prev => [data, ...prev]);
      toast({
        title: "✅ Berhasil",
        description: `Personel ${personnelInput.nama} berhasil ditambahkan`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating personnel:', error);
      
      if (error.code === '23505' && error.message?.includes('personnel_nrp_key')) {
        toast({
          title: "⚠️ Error",
          description: "NRP sudah terdaftar. Gunakan NRP yang berbeda.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Error",
          description: "Gagal menambahkan data personel",
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const updatePersonnel = async (id: string, updateData: Partial<Omit<PersonnelAdmin, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('personnel')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPersonnel(prev => prev.map(person => 
        person.id === id ? data : person
      ));

      toast({
        title: "✅ Berhasil",
        description: "Data personel berhasil diupdate",
      });

      return data;
    } catch (error) {
      console.error('Error updating personnel:', error);
      toast({
        title: "❌ Error",
        description: "Gagal mengupdate data personel",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deletePersonnel = async (id: string) => {
    try {
      const personName = personnel.find(p => p.id === id)?.nama;
      
      const { error } = await supabase
        .from('personnel')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPersonnel(prev => prev.filter(person => person.id !== id));
      toast({
        title: "🗑️ Berhasil",
        description: `${personName} berhasil dihapus`,
      });
    } catch (error) {
      console.error('Error deleting personnel:', error);
      toast({
        title: "❌ Error",
        description: "Gagal menghapus data personel",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchPersonnel();

    // Real-time subscription
    const channel = supabase
      .channel('personnel_admin_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'personnel'
        },
        () => {
          fetchPersonnel();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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