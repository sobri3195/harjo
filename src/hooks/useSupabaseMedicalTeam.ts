
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MedicalTeamMember {
  id: string;
  nama: string;
  spesialisasi: string;
  no_lisensi: string;
  no_telepon: string;
  alamat: string;
  jadwal_piket: string;
  status: 'aktif' | 'tidak_aktif';
  created_at: string;
  updated_at: string;
}

export const useSupabaseMedicalTeam = () => {
  const [medicalTeam, setMedicalTeam] = useState<MedicalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedicalTeam = async () => {
    try {
      const { data, error } = await supabase
        .from('medical_team')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion untuk memastikan status sesuai dengan interface
      const typedData = (data || []).map(item => ({
        ...item,
        status: item.status as 'aktif' | 'tidak_aktif'
      })) as MedicalTeamMember[];
      
      setMedicalTeam(typedData);
    } catch (error) {
      console.error('Error fetching medical team:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data tim medis",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createMedicalTeamMember = async (data: Omit<MedicalTeamMember, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data: newMember, error } = await supabase
        .from('medical_team')
        .insert([data])
        .select()
        .single();

      if (error) throw error;

      // Type assertion untuk newMember
      const typedNewMember = {
        ...newMember,
        status: newMember.status as 'aktif' | 'tidak_aktif'
      } as MedicalTeamMember;

      setMedicalTeam(prev => [typedNewMember, ...prev]);
      toast({
        title: "Berhasil",
        description: "Anggota tim medis berhasil ditambahkan",
      });

      return typedNewMember;
    } catch (error) {
      console.error('Error creating medical team member:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan anggota tim medis",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateMedicalTeamMember = async (id: string, data: Partial<Omit<MedicalTeamMember, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data: updatedMember, error } = await supabase
        .from('medical_team')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Type assertion untuk updatedMember
      const typedUpdatedMember = {
        ...updatedMember,
        status: updatedMember.status as 'aktif' | 'tidak_aktif'
      } as MedicalTeamMember;

      setMedicalTeam(prev => prev.map(member => 
        member.id === id ? typedUpdatedMember : member
      ));

      toast({
        title: "Berhasil",
        description: "Data tim medis berhasil diupdate",
      });

      return typedUpdatedMember;
    } catch (error) {
      console.error('Error updating medical team member:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate data tim medis",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteMedicalTeamMember = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medical_team')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedicalTeam(prev => prev.filter(member => member.id !== id));
      toast({
        title: "Berhasil",
        description: "Anggota tim medis berhasil dihapus",
      });
    } catch (error) {
      console.error('Error deleting medical team member:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus anggota tim medis",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchMedicalTeam();
  }, []);

  return {
    medicalTeam,
    loading,
    createMedicalTeamMember,
    updateMedicalTeamMember,
    deleteMedicalTeamMember,
    refetch: fetchMedicalTeam,
  };
};
