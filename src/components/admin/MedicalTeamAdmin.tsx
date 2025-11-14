
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, Clock, UserCheck, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabaseMedicalTeam, MedicalTeamMember } from '@/hooks/useSupabaseMedicalTeam';
import { Skeleton } from '@/components/ui/skeleton';

const MedicalTeamAdmin = () => {
  const { medicalTeam, loading, createMedicalTeamMember, updateMedicalTeamMember, deleteMedicalTeamMember } = useSupabaseMedicalTeam();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    spesialisasi: '',
    no_lisensi: '',
    no_telepon: '',
    alamat: '',
    jadwal_piket: '',
    status: 'aktif' as 'aktif' | 'tidak_aktif',
  });

  const filteredTeam = medicalTeam.filter(member =>
    member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.spesialisasi.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nama: '',
      spesialisasi: '',
      no_lisensi: '',
      no_telepon: '',
      alamat: '',
      jadwal_piket: '',
      status: 'aktif',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddMember = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditMember = (member: MedicalTeamMember) => {
    setFormData({
      nama: member.nama,
      spesialisasi: member.spesialisasi,
      no_lisensi: member.no_lisensi,
      no_telepon: member.no_telepon,
      alamat: member.alamat,
      jadwal_piket: member.jadwal_piket,
      status: member.status,
    });
    setEditingId(member.id);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateMedicalTeamMember(editingId, formData);
      } else {
        await createMedicalTeamMember(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving medical team member:', error);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggota tim medis ini?')) {
      await deleteMedicalTeamMember(id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">⚕️ Manajemen Tim Medis</h2>
          <p className="text-gray-600">Kelola anggota tim medis RSPAU</p>
        </div>
        <Button
          onClick={handleAddMember}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Tambah Anggota</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tim</p>
              <p className="text-2xl font-bold text-gray-800">{medicalTeam.length}</p>
            </div>
            <UserCheck className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sedang Aktif</p>
              <p className="text-2xl font-bold text-green-600">
                {medicalTeam.filter(m => m.status === 'aktif').length}
              </p>
            </div>
            <Clock className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dokter</p>
              <p className="text-2xl font-bold text-orange-600">
                {medicalTeam.filter(m => m.spesialisasi.toLowerCase().includes('dokter')).length}
              </p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Perawat</p>
              <p className="text-2xl font-bold text-purple-600">
                {medicalTeam.filter(m => m.spesialisasi.toLowerCase().includes('perawat')).length}
              </p>
            </div>
            <Clock className="text-purple-500" size={24} />
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Edit Anggota Tim Medis' : 'Tambah Anggota Tim Medis Baru'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Nama Lengkap"
              value={formData.nama}
              onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value }))}
              required
            />
            <Input
              placeholder="Spesialisasi"
              value={formData.spesialisasi}
              onChange={(e) => setFormData(prev => ({ ...prev, spesialisasi: e.target.value }))}
              required
            />
            <Input
              placeholder="No. Lisensi"
              value={formData.no_lisensi}
              onChange={(e) => setFormData(prev => ({ ...prev, no_lisensi: e.target.value }))}
              required
            />
            <Input
              placeholder="No. Telepon"
              value={formData.no_telepon}
              onChange={(e) => setFormData(prev => ({ ...prev, no_telepon: e.target.value }))}
              required
            />
            <Input
              placeholder="Alamat"
              value={formData.alamat}
              onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
              required
            />
            <Input
              placeholder="Jadwal Piket"
              value={formData.jadwal_piket}
              onChange={(e) => setFormData(prev => ({ ...prev, jadwal_piket: e.target.value }))}
              required
            />
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'aktif' | 'tidak_aktif' }))}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="aktif">Aktif</option>
              <option value="tidak_aktif">Tidak Aktif</option>
            </select>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingId ? 'Update Anggota' : 'Simpan Anggota'}
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cari anggota tim medis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {medicalTeam.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Spesialisasi</TableHead>
                <TableHead>No. Lisensi</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Jadwal Piket</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeam.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.nama}</TableCell>
                  <TableCell>{member.spesialisasi}</TableCell>
                  <TableCell>{member.no_lisensi}</TableCell>
                  <TableCell>{member.no_telepon}</TableCell>
                  <TableCell className="text-sm">{member.jadwal_piket}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'aktif' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {member.status === 'aktif' ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditMember(member)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}
        
        {filteredTeam.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <div>
                <Search size={48} className="mx-auto text-gray-300 mb-2" />
                <p>Tidak ada anggota tim yang sesuai dengan pencarian</p>
              </div>
            ) : (
              <div>
                <UserCheck size={48} className="mx-auto text-gray-300 mb-2" />
                <p>Belum ada data tim medis</p>
                <Button 
                  onClick={handleAddMember}
                  className="mt-2"
                  size="sm"
                >
                  <Plus size={16} className="mr-1" />
                  Tambah Anggota Pertama
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalTeamAdmin;
