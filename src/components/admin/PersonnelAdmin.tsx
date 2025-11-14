
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Search, UserCheck, UserX, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSupabasePersonnelAdmin } from '@/hooks/useSupabasePersonnelAdmin';
import { Skeleton } from '@/components/ui/skeleton';

const PersonnelAdmin = () => {
  const { personnel, loading, updatePersonnel, deletePersonnel, createPersonnel } = useSupabasePersonnelAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    pangkat: '',
    nrp: '',
    jabatan: '',
    satuan: '',
    no_telepon: '',
    alamat: '',
  });

  const filteredPersonnel = personnel.filter(person =>
    person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.nrp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.satuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.pangkat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nama: '',
      pangkat: '',
      nrp: '',
      jabatan: '',
      satuan: '',
      no_telepon: '',
      alamat: '',
    });
    setShowAddForm(false);
    setEditingId(null);
  };

  const handleAddPersonnel = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleEditPersonnel = (person: any) => {
    setFormData({
      nama: person.nama,
      pangkat: person.pangkat,
      nrp: person.nrp,
      jabatan: person.jabatan,
      satuan: person.satuan,
      no_telepon: person.no_telepon,
      alamat: person.alamat,
    });
    setEditingId(person.id);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updatePersonnel(editingId, formData);
      } else {
        await createPersonnel(formData);
      }
      resetForm();
    } catch (error) {
      console.error('Error saving personnel:', error);
    }
  };

  const handleDeletePersonnel = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus personel ini?')) {
      await deletePersonnel(id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
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
          <h2 className="text-2xl font-bold text-gray-800">👥 Manajemen Personel</h2>
          <p className="text-gray-600">Kelola semua data personel RSPAU</p>
        </div>
        <Button
          onClick={handleAddPersonnel}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Tambah Personel</span>
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? 'Edit Personel' : 'Tambah Personel Baru'}
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
              placeholder="Pangkat"
              value={formData.pangkat}
              onChange={(e) => setFormData(prev => ({ ...prev, pangkat: e.target.value }))}
              required
            />
            <Input
              placeholder="NRP"
              value={formData.nrp}
              onChange={(e) => setFormData(prev => ({ ...prev, nrp: e.target.value }))}
              required
            />
            <Input
              placeholder="Jabatan"
              value={formData.jabatan}
              onChange={(e) => setFormData(prev => ({ ...prev, jabatan: e.target.value }))}
              required
            />
            <Input
              placeholder="Unit/Satuan"
              value={formData.satuan}
              onChange={(e) => setFormData(prev => ({ ...prev, satuan: e.target.value }))}
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
              className="md:col-span-2"
            />
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingId ? 'Update Personel' : 'Simpan Personel'}
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
            placeholder="Cari personel berdasarkan nama, NRP, pangkat, atau unit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Personnel Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        {personnel.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NRP</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Pangkat</TableHead>
                <TableHead>Jabatan</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPersonnel.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{person.nrp}</TableCell>
                  <TableCell className="font-medium">{person.nama}</TableCell>
                  <TableCell>{person.pangkat}</TableCell>
                  <TableCell>{person.jabatan}</TableCell>
                  <TableCell>{person.satuan}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{person.no_telepon}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditPersonnel(person)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePersonnel(person.id)}
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
        
        {filteredPersonnel.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <div>
                <Search size={48} className="mx-auto text-gray-300 mb-2" />
                <p>Tidak ada personel yang sesuai dengan pencarian</p>
              </div>
            ) : (
              <div>
                <UserCheck size={48} className="mx-auto text-gray-300 mb-2" />
                <p>Belum ada data personel</p>
                <Button 
                  onClick={handleAddPersonnel}
                  className="mt-2"
                  size="sm"
                >
                  <Plus size={16} className="mr-1" />
                  Tambah Personel Pertama
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-blue-600 text-sm font-medium">Total Personel</div>
              <div className="text-2xl font-bold text-blue-800">{personnel.length}</div>
            </div>
            <UserCheck className="text-blue-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-green-600 text-sm font-medium">Dokter</div>
              <div className="text-2xl font-bold text-green-800">
                {personnel.filter(p => p.jabatan.toLowerCase().includes('dokter')).length}
              </div>
            </div>
            <UserCheck className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-purple-600 text-sm font-medium">Perawat</div>
              <div className="text-2xl font-bold text-purple-800">
                {personnel.filter(p => p.jabatan.toLowerCase().includes('perawat')).length}
              </div>
            </div>
            <UserCheck className="text-purple-500" size={24} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-orange-600 text-sm font-medium">Paramedis</div>
              <div className="text-2xl font-bold text-orange-800">
                {personnel.filter(p => p.jabatan.toLowerCase().includes('paramedis')).length}
              </div>
            </div>
            <UserCheck className="text-orange-500" size={24} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonnelAdmin;
