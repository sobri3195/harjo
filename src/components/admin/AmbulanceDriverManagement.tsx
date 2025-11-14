import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Phone, Car, Clock, MapPin, UserCheck, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAmbulanceDrivers } from '@/hooks/useAmbulanceDrivers';
import { useToast } from '@/hooks/use-toast';

const AmbulanceDriverManagement = () => {
  const { drivers, loading, createDriver, updateDriver, deleteDriver } = useAmbulanceDrivers();
  const { toast } = useToast();
  
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newDriver, setNewDriver] = useState({
    nama: '',
    nrp: '',
    no_telepon: '',
    unit_ambulans: '',
    shift: '',
    status: 'off-duty' as 'active' | 'off-duty' | 'on-call'
  });

  const handleAddDriver = async () => {
    if (!newDriver.nama || !newDriver.nrp || !newDriver.no_telepon || !newDriver.unit_ambulans || !newDriver.shift) {
      toast({
        title: "⚠️ Data Tidak Lengkap",
        description: "Harap isi semua field yang diperlukan",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createDriver(newDriver);
      setNewDriver({ 
        nama: '', 
        nrp: '', 
        no_telepon: '', 
        unit_ambulans: '', 
        shift: '', 
        status: 'off-duty' 
      });
      setShowAddDriver(false);
    } catch (error) {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateDriverStatus = async (driverId: string, newStatus: 'active' | 'off-duty' | 'on-call') => {
    try {
      await updateDriver(driverId, { status: newStatus });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleDeleteDriver = async (driverId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus driver ini?')) {
      try {
        await deleteDriver(driverId);
      } catch (error) {
        // Error handling is done in the hook
      }
    }
  };

  const getStatusColor = (status: 'active' | 'off-duty' | 'on-call') => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'on-call': return 'bg-yellow-600';
      case 'off-duty': return 'bg-gray-500';
    }
  };

  const getStatusText = (status: 'active' | 'off-duty' | 'on-call') => {
    switch (status) {
      case 'active': return '🟢 Aktif';
      case 'on-call': return '🟡 Siaga';
      case 'off-duty': return '🔴 Off-Duty';
    }
  };

  const activeDrivers = drivers.filter(d => d.status === 'active').length;
  const onCallDrivers = drivers.filter(d => d.status === 'on-call').length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading driver data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚑 Manajemen Driver Ambulans</h2>
          <p className="text-gray-600">Kelola dan monitor driver ambulans RSPAU</p>
        </div>
        <Button onClick={() => setShowAddDriver(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Driver
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Driver Aktif</p>
                <p className="text-2xl font-bold text-green-600">{activeDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Siaga</p>
                <p className="text-2xl font-bold text-yellow-600">{onCallDrivers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Car className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Unit</p>
                <p className="text-2xl font-bold text-blue-600">{drivers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Shift Siang</p>
                <p className="text-2xl font-bold text-purple-600">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Driver Form */}
      {showAddDriver && (
        <Card>
          <CardHeader>
            <CardTitle>➕ Tambah Driver Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nama Lengkap</label>
                <Input
                  placeholder="Nama driver..."
                  value={newDriver.nama}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, nama: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">NRP</label>
                <Input
                  placeholder="Nomor NRP..."
                  value={newDriver.nrp}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, nrp: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">No. Telepon</label>
                <Input
                  placeholder="Nomor telepon..."
                  value={newDriver.no_telepon}
                  onChange={(e) => setNewDriver(prev => ({ ...prev, no_telepon: e.target.value }))}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Unit Ambulans</label>
                <Select 
                  value={newDriver.unit_ambulans} 
                  onValueChange={(value) => setNewDriver(prev => ({ ...prev, unit_ambulans: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih unit..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AMB-01">AMB-01</SelectItem>
                    <SelectItem value="AMB-02">AMB-02</SelectItem>
                    <SelectItem value="AMB-03">AMB-03</SelectItem>
                    <SelectItem value="AMB-04">AMB-04</SelectItem>
                    <SelectItem value="AMB-05">AMB-05</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Shift</label>
                <Select 
                  value={newDriver.shift} 
                  onValueChange={(value) => setNewDriver(prev => ({ ...prev, shift: value }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih shift..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00 - 20:00">Shift Pagi (08:00 - 20:00)</SelectItem>
                    <SelectItem value="20:00 - 08:00">Shift Malam (20:00 - 08:00)</SelectItem>
                    <SelectItem value="12:00 - 24:00">Shift Sore (12:00 - 24:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                <Select 
                  value={newDriver.status} 
                  onValueChange={(value) => setNewDriver(prev => ({ ...prev, status: value as 'active' | 'off-duty' | 'on-call' }))}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">🟢 Aktif</SelectItem>
                    <SelectItem value="on-call">🟡 Siaga</SelectItem>
                    <SelectItem value="off-duty">🔴 Off-Duty</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddDriver} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menyimpan...
                  </>
                ) : (
                  'Tambah Driver'
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAddDriver(false)} disabled={isSubmitting}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Driver List */}
      <div className="grid gap-4">
        {drivers.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-xl shadow-md border border-gray-200">
            <div className="mb-4">
              <Car size={64} className="mx-auto text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Belum Ada Driver</h3>
            <p className="text-gray-500 mb-4">Tambahkan driver ambulans pertama untuk memulai</p>
            <Button onClick={() => setShowAddDriver(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Driver Pertama
            </Button>
          </div>
        ) : (
          drivers.map((driver) => (
            <Card key={driver.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(driver.status)} rounded-full border-2 border-white`}></div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-900">{driver.nama}</h3>
                        <Badge variant="outline">{driver.unit_ambulans}</Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center space-x-1">
                          <User className="w-3 h-3" />
                          <span>{driver.nrp}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{driver.no_telepon}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{driver.shift}</span>
                        </span>
                      </div>
                      {driver.lokasi_terakhir && (
                        <div className="flex items-center space-x-1 text-sm text-gray-500 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span>{driver.lokasi_terakhir}</span>
                          {driver.terakhir_update && (
                            <span>• {Math.floor((Date.now() - new Date(driver.terakhir_update).getTime()) / 60000)}m ago</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(driver.status)}>
                      {getStatusText(driver.status)}
                    </Badge>
                    
                    <Select
                      value={driver.status}
                      onValueChange={(value) => updateDriverStatus(driver.id, value as 'active' | 'off-duty' | 'on-call')}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">🟢 Aktif</SelectItem>
                        <SelectItem value="on-call">🟡 Siaga</SelectItem>
                        <SelectItem value="off-duty">🔴 Off-Duty</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AmbulanceDriverManagement;