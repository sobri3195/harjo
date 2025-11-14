
import React, { useState } from 'react';
import { Search, Phone, User, MapPin, Truck, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePersonnel } from '@/hooks/usePersonnel';
import { useAmbulanceDrivers } from '@/hooks/useAmbulanceDrivers';

const AmbulancePersonnelPage = () => {
  const { personnel } = usePersonnel();
  const { drivers, loading } = useAmbulanceDrivers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersonnel = personnel.filter(person =>
    person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.nrp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.satuan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.pangkat.toLowerCase().includes(searchTerm.toLowerCase()) ||
    person.jabatan.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDrivers = drivers.filter(driver =>
    driver.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.nrp.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.unit_ambulans.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.shift.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const doctorCount = personnel.filter(p => p.jabatan.toLowerCase().includes('dokter')).length;
  const nurseCount = personnel.filter(p => p.jabatan.toLowerCase().includes('perawat')).length;
  const activeDriversCount = drivers.filter(d => d.status === 'active').length;

  const getDriverStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'on-call': return 'bg-yellow-600';
      case 'off-duty': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getDriverStatusText = (status: string) => {
    switch (status) {
      case 'active': return '🟢 Aktif';
      case 'on-call': return '🟡 Siaga';
      case 'off-duty': return '🔴 Off-Duty';
      default: return '❓ Unknown';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Daftar Personel & Driver</h2>
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-navy-blue-600">{personnel.length}</div>
          <div className="text-xs text-gray-600">Medis</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-military-green-600">{doctorCount}</div>
          <div className="text-xs text-gray-600">Dokter</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-emergency-red-600">{nurseCount}</div>
          <div className="text-xs text-gray-600">Perawat</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{activeDriversCount}</div>
          <div className="text-xs text-gray-600">Driver Aktif</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Cari personel atau driver..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs for Personnel and Drivers */}
      <Tabs defaultValue="personnel" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personnel" className="flex items-center space-x-2">
            <Users size={16} />
            <span>Tim Medis ({personnel.length})</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center space-x-2">
            <Truck size={16} />
            <span>Driver Ambulans ({drivers.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Personnel Tab */}
        <TabsContent value="personnel" className="space-y-4">
          {filteredPersonnel.map((person) => (
            <div key={person.id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 flex items-center">
                    <User size={16} className="mr-2 text-navy-blue-600" />
                    {person.nama}
                  </h3>
                  <p className="text-sm text-gray-600">{person.pangkat} • {person.jabatan}</p>
                  <p className="text-xs text-gray-500">{person.satuan}</p>
                </div>
                <div className="text-right text-xs text-gray-500">
                  NRP: {person.nrp}
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin size={14} className="mr-1" />
                  <span className="text-xs">{person.alamat}</span>
                </div>
                <a
                  href={`tel:${person.no_telepon}`}
                  className="bg-emergency-red-600 hover:bg-emergency-red-700 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors"
                >
                  <Phone size={12} />
                  <span>Hubungi</span>
                </a>
              </div>
            </div>
          ))}

          {filteredPersonnel.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'Tidak ada tim medis yang sesuai dengan pencarian' : 'Belum ada data tim medis'}
            </div>
          )}
        </TabsContent>

        {/* Drivers Tab */}
        <TabsContent value="drivers" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p>Loading driver data...</p>
            </div>
          ) : (
            <>
              {filteredDrivers.map((driver) => (
                <div key={driver.id} className="bg-white rounded-xl shadow-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-gray-800 flex items-center">
                          <Truck size={16} className="mr-2 text-blue-600" />
                          {driver.nama}
                        </h3>
                        <Badge variant="outline">{driver.unit_ambulans}</Badge>
                        <Badge className={getDriverStatusColor(driver.status)}>
                          {getDriverStatusText(driver.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>NRP: {driver.nrp}</span>
                        <span className="flex items-center space-x-1">
                          <Clock size={12} />
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
                  
                  <div className="flex justify-end items-center mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={`tel:${driver.no_telepon}`}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs flex items-center space-x-1 transition-colors"
                    >
                      <Phone size={12} />
                      <span>Hubungi Driver</span>
                    </a>
                  </div>
                </div>
              ))}

              {filteredDrivers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'Tidak ada driver yang sesuai dengan pencarian' : 'Belum ada data driver'}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AmbulancePersonnelPage;
