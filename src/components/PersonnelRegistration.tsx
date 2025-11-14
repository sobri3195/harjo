
import React, { useState, useEffect } from 'react';
import { UserPlus, Phone, User, Shield, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePersonnelContext } from '@/contexts/PersonnelContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const PersonnelRegistration = () => {
  const { createPersonnel, updatePersonnel, personnel } = usePersonnelContext();
  const { user, signInAnonymously } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    rank: '',
    nrp: '',
    phone: '',
    unit: '',
    position: '',
    address: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingPersonnel, setExistingPersonnel] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Auto sign in anonymously if no user
  useEffect(() => {
    if (!user) {
      signInAnonymously();
    }
  }, [user, signInAnonymously]);

  // Check for existing personnel data when user is available
  useEffect(() => {
    if (user && personnel.length > 0) {
      const userPersonnel = personnel.find(p => p.user_id === user.id);
      if (userPersonnel) {
        setExistingPersonnel(userPersonnel);
        setFormData({
          name: userPersonnel.nama,
          rank: userPersonnel.pangkat,
          nrp: userPersonnel.nrp,
          phone: userPersonnel.no_telepon,
          unit: userPersonnel.satuan,
          position: userPersonnel.jabatan,
          address: userPersonnel.alamat,
        });
      }
    }
  }, [user, personnel]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const personnelData = {
        nama: formData.name,
        pangkat: formData.rank,
        nrp: formData.nrp,
        jabatan: formData.position,
        satuan: formData.unit,
        no_telepon: formData.phone,
        alamat: formData.address,
      };

      if (existingPersonnel) {
        // Update existing personnel
        await updatePersonnel(existingPersonnel.id, personnelData);
        setIsEditing(false);
        toast({
          title: "✅ Berhasil Diperbarui",
          description: "Data personel berhasil diperbarui di sistem",
        });
      } else {
        // Create new personnel
        await createPersonnel(personnelData);
        toast({
          title: "✅ Berhasil Disimpan",
          description: "Data personel berhasil disimpan di sistem",
        });
      }
    } catch (error: any) {
      console.error('Error saving personnel:', error);
      
      // More specific error messages
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast({
          title: "❌ Error Duplikasi",
          description: "NRP sudah terdaftar. Gunakan NRP yang berbeda.",
          variant: "destructive",
        });
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        toast({
          title: "❌ Koneksi Error",
          description: "Periksa koneksi internet dan coba lagi.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "❌ Gagal Menyimpan",
          description: "Terjadi kesalahan saat menyimpan data. Silakan coba lagi.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      {existingPersonnel && !isEditing ? (
        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Data Personel Anda</h2>
            <p className="text-gray-600">Data sudah tersimpan di sistem</p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Nama:</span>
                <p>{existingPersonnel.nama}</p>
              </div>
              <div>
                <span className="font-semibold">Pangkat:</span>
                <p>{existingPersonnel.pangkat}</p>
              </div>
              <div>
                <span className="font-semibold">NRP:</span>
                <p>{existingPersonnel.nrp}</p>
              </div>
              <div>
                <span className="font-semibold">Jabatan:</span>
                <p>{existingPersonnel.jabatan}</p>
              </div>
              <div>
                <span className="font-semibold">Unit:</span>
                <p>{existingPersonnel.satuan}</p>
              </div>
              <div>
                <span className="font-semibold">Telepon:</span>
                <p>{existingPersonnel.no_telepon}</p>
              </div>
            </div>
            <div className="col-span-2">
              <span className="font-semibold">Alamat:</span>
              <p>{existingPersonnel.alamat}</p>
            </div>
          </div>
          
          <Button
            onClick={() => setIsEditing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl"
          >
            <Edit size={20} className="mr-2" />
            EDIT DATA PERSONEL
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="w-16 h-16 bg-military-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              {existingPersonnel ? <Edit size={32} className="text-blue-600" /> : <UserPlus size={32} className="text-military-green-600" />}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {existingPersonnel ? 'Edit Data Personel' : 'Daftar Personel'}
            </h2>
            <p className="text-gray-600">
              {existingPersonnel ? 'Update data personel Anda' : 'Registrasi data personel untuk sistem darurat'}
            </p>
          </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <User size={18} className="mr-2" />
            Data Pribadi
          </h3>
          <Input
            placeholder="Nama Lengkap"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
          <Input
            placeholder="Pangkat"
            value={formData.rank}
            onChange={(e) => handleChange('rank', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
          <Input
            placeholder="NRP (Nomor Registrasi Personel)"
            value={formData.nrp}
            onChange={(e) => handleChange('nrp', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
          <Input
            placeholder="Jabatan"
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 flex items-center">
            <Phone size={18} className="mr-2" />
            Kontak & Unit
          </h3>
          <Input
            placeholder="Nomor Telepon"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
          <Input
            placeholder="Unit/Satuan Kerja"
            value={formData.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
          <Input
            placeholder="Alamat"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            required
            className="text-base"
            disabled={isSubmitting}
          />
        </div>

          <div className="space-y-3">
            <Button
              type="submit"
              className="w-full bg-military-green-600 hover:bg-military-green-700 text-white py-4 text-lg font-semibold rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? "🔄 MENYIMPAN..." 
                : existingPersonnel 
                  ? "💾 UPDATE DATA" 
                  : "📝 DAFTAR PERSONEL"
              }
            </Button>
            
            {existingPersonnel && (
              <Button
                type="button"
                onClick={() => setIsEditing(false)}
                variant="outline"
                className="w-full py-4 text-lg font-semibold rounded-xl"
              >
                BATAL
              </Button>
            )}
          </div>
        </form>
        </>
      )}
    </div>
  );
};

export default PersonnelRegistration;
