import React, { useState } from 'react';
import { Settings, User, Bell, MapPin, Phone, CheckCircle, AlertCircle, Info, Shield, Heart, Navigation, Users, Stethoscope, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseMedicalTeam } from '@/hooks/useSupabaseMedicalTeam';
import { useAmbulanceDrivers } from '@/hooks/useAmbulanceDrivers';

const AmbulanceSettingsPage = () => {
  const [settings, setSettings] = useState({
    emergencyNotifications: true,
    gpsTracking: true,
    autoCallHospital: true,
    soundAlerts: true,
    autoDispatch: false,
    emergencyMode: false
  });
  
  const { toast } = useToast();
  const { medicalTeam, loading: medicalLoading } = useSupabaseMedicalTeam();
  const { drivers, loading: driversLoading } = useAmbulanceDrivers();

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    
    toast({
      title: "✅ Pengaturan Diperbarui",
      description: `${getSettingName(key)} telah ${settings[key] ? 'dinonaktifkan' : 'diaktifkan'}`,
    });
  };

  const getSettingName = (key: keyof typeof settings) => {
    const names = {
      emergencyNotifications: 'Notifikasi Darurat',
      gpsTracking: 'GPS Tracking',
      autoCallHospital: 'Auto Call RS',
      soundAlerts: 'Suara Alert',
      autoDispatch: 'Auto Dispatch',
      emergencyMode: 'Mode Darurat'
    };
    return names[key];
  };

  const handleEmergencyCall = (contact: string, number: string) => {
    toast({
      title: `📞 Menghubungi ${contact}`,
      description: `Memanggil ${number}...`,
      variant: "default"
    });
  };

  const handleEmergencyMode = () => {
    setSettings(prev => ({ ...prev, emergencyMode: !prev.emergencyMode }));
    toast({
      title: settings.emergencyMode ? "🔒 Mode Normal Aktif" : "🚨 MODE DARURAT AKTIF",
      description: settings.emergencyMode ? "Kembali ke operasi normal" : "Semua sistem siaga tinggi",
      variant: settings.emergencyMode ? "default" : "destructive"
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">⚙️ Pengaturan & Personel</h2>
        <Badge variant={settings.emergencyMode ? "destructive" : "secondary"}>
          {settings.emergencyMode ? "🚨 MODE DARURAT" : "🔒 NORMAL"}
        </Badge>
      </div>

      {/* Tabs for Settings and Personnel */}
      <Tabs defaultValue="settings" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="settings" className="text-xs md:text-sm">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="personnel" className="text-xs md:text-sm">
            <Users className="w-4 h-4 mr-1" />
            Tim Medis
          </TabsTrigger>
          <TabsTrigger value="drivers" className="text-xs md:text-sm">
            <UserCheck className="w-4 h-4 mr-1" />
            Driver
          </TabsTrigger>
        </TabsList>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          {/* Emergency Mode Toggle */}
          <Card className={`${settings.emergencyMode ? 'bg-red-50 border-red-200' : 'bg-white'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className={`${settings.emergencyMode ? 'text-red-600' : 'text-gray-500'}`} size={24} />
                  <div>
                    <h3 className="font-semibold text-gray-800">Mode Darurat</h3>
                    <p className="text-xs text-gray-600">Aktivasi sistem siaga penuh</p>
                  </div>
                </div>
                <Button
                  onClick={handleEmergencyMode}
                  variant={settings.emergencyMode ? "destructive" : "outline"}
                  size="sm"
                >
                  {settings.emergencyMode ? "🔓 NONAKTIFKAN" : "🚨 AKTIVASI"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Driver Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-base">
                <User className="text-navy-blue-600" size={20} />
                <span>👤 Informasi Driver</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Nama:</span>
                  <span className="font-semibold">Serda Budi Santoso</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">NRP:</span>
                  <span className="font-medium font-mono">31120456789</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Unit:</span>
                  <Badge variant="outline">AMB-01</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="default" className="bg-green-600">🟢 SIAGA</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Options */}
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Bell className="text-emergency-red-600" size={20} />
                    <div>
                      <span className="font-medium text-gray-800">Notifikasi Darurat</span>
                      <p className="text-xs text-gray-500">Alert suara & visual untuk panggilan darurat</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.emergencyNotifications}
                      onChange={() => toggleSetting('emergencyNotifications')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emergency-red-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MapPin className="text-navy-blue-600" size={20} />
                    <div>
                      <span className="font-medium text-gray-800">GPS Tracking</span>
                      <p className="text-xs text-gray-500">Lokasi real-time untuk command center</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.gpsTracking}
                      onChange={() => toggleSetting('gpsTracking')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy-blue-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Phone className="text-military-green-600" size={20} />
                    <div>
                      <span className="font-medium text-gray-800">Auto Call RS</span>
                      <p className="text-xs text-gray-500">Otomatis hubungi rumah sakit saat emergency</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.autoCallHospital}
                      onChange={() => toggleSetting('autoCallHospital')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-military-green-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="text-pink-600" size={20} />
                    <div>
                      <span className="font-medium text-gray-800">Suara Alert</span>
                      <p className="text-xs text-gray-500">Nada sirine dan voice notification</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.soundAlerts}
                      onChange={() => toggleSetting('soundAlerts')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Navigation className="text-purple-600" size={20} />
                    <div>
                      <span className="font-medium text-gray-800">Auto Dispatch</span>
                      <p className="text-xs text-gray-500">Otomatis terima panggilan terdekat</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={settings.autoDispatch}
                      onChange={() => toggleSetting('autoDispatch')}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Emergency Contacts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center space-x-2">
                  <Phone className="text-emergency-red-600" size={20} />
                  <span>📞 Kontak Darurat</span>
                </span>
                <Badge variant="outline" className="text-xs">24/7 SIAGA</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <span className="text-gray-700 font-medium">Command Center:</span>
                    <p className="text-xs text-gray-500">Pusat Komando TNI AU</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmergencyCall("Command Center", "118")}
                    className="text-emergency-red-600 border-red-200 hover:bg-red-50"
                  >
                    📞 118
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div>
                    <span className="text-gray-700 font-medium">RSPAU Harjolukito:</span>
                    <p className="text-xs text-gray-500">Rumah Sakit Pusat AU</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmergencyCall("RSPAU Harjolukito", "(0274) 489-144")}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    📞 (0274) 489-144
                  </Button>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                  <div>
                    <span className="text-gray-700 font-medium">Supervisor:</span>
                    <p className="text-xs text-gray-500">Pengawas Lapangan</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEmergencyCall("Supervisor", "(0274) 489-145")}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    📞 (0274) 489-145
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📊 Status Sistem</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>GPS: Aktif</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>Radio: Online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="text-green-500" size={16} />
                  <span>Medis: Siap</span>
                </div>
                <div className="flex items-center space-x-2">
                  {settings.emergencyMode ? (
                    <AlertCircle className="text-red-500" size={16} />
                  ) : (
                    <CheckCircle className="text-green-500" size={16} />
                  )}
                  <span>Mode: {settings.emergencyMode ? 'Darurat' : 'Normal'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Team Personnel Tab */}
        <TabsContent value="personnel" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center space-x-2">
                  <Stethoscope className="text-navy-blue-600" size={20} />
                  <span>👩‍⚕️ Tim Medis</span>
                </span>
                <Badge variant="outline" className="text-xs">
                  {medicalLoading ? "..." : medicalTeam.length} Dokter
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {medicalLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-navy-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading tim medis...
                </div>
              ) : medicalTeam.length > 0 ? (
                <div className="space-y-3">
                  {medicalTeam.slice(0, 5).map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-navy-blue-100 rounded-full flex items-center justify-center">
                          <Stethoscope size={16} className="text-navy-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{doctor.nama}</div>
                          <div className="text-xs text-gray-500">{doctor.spesialisasi}</div>
                          <div className="text-xs text-gray-400">Lisensi: {doctor.no_lisensi}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={doctor.status === 'aktif' ? 'default' : 'secondary'}
                          className="text-xs mb-1"
                        >
                          {doctor.status === 'aktif' ? '✅ Aktif' : '⏸️ Off'}
                        </Badge>
                        <div className="text-xs text-gray-500">{doctor.jadwal_piket}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs mt-1 h-6"
                          onClick={() => handleEmergencyCall(doctor.nama, doctor.no_telepon)}
                        >
                          📞 Call
                        </Button>
                      </div>
                    </div>
                  ))}
                  {medicalTeam.length > 5 && (
                    <div className="text-center text-xs text-gray-500 py-2">
                      +{medicalTeam.length - 5} dokter lainnya tersedia
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada data tim medis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ambulance Drivers Tab */}
        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center space-x-2">
                  <UserCheck className="text-military-green-600" size={20} />
                  <span>🚑 Driver Ambulans</span>
                </span>
                <Badge variant="outline" className="text-xs">
                  {driversLoading ? "..." : drivers.length} Driver
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {driversLoading ? (
                <div className="text-center py-4 text-gray-500">
                  <div className="animate-spin w-6 h-6 border-2 border-military-green-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Loading driver data...
                </div>
              ) : drivers.length > 0 ? (
                <div className="space-y-3">
                  {drivers.slice(0, 5).map((driver) => (
                    <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-military-green-100 rounded-full flex items-center justify-center">
                          <UserCheck size={16} className="text-military-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{driver.nama}</div>
                          <div className="text-xs text-gray-500">NRP: {driver.nrp}</div>
                          <div className="text-xs text-gray-400">Unit: {driver.unit_ambulans}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={driver.status === 'active' ? 'default' : 'secondary'}
                          className="text-xs mb-1"
                        >
                          {driver.status === 'active' ? '🟢 Active' : '⏸️ Off Duty'}
                        </Badge>
                        <div className="text-xs text-gray-500">{driver.shift}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs mt-1 h-6"
                          onClick={() => handleEmergencyCall(driver.nama, driver.no_telepon)}
                        >
                          📞 Call
                        </Button>
                      </div>
                    </div>
                  ))}
                  {drivers.length > 5 && (
                    <div className="text-center text-xs text-gray-500 py-2">
                      +{drivers.length - 5} driver lainnya tersedia
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <UserCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Tidak ada data driver</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AmbulanceSettingsPage;