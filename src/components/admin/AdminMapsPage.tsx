import React from 'react';
import { MapPin, Navigation, Activity, Users } from 'lucide-react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import LeafletMap from '@/components/maps/LeafletMap';
import RealTimeLocationMap from '@/components/maps/RealTimeLocationMap';

const AdminMapsPage = () => {
  const { reports } = useEmergencyReports();

  // Filter emergency reports by status
  const pendingReports = reports.filter(report => report.status === 'pending');
  const activeReports = reports.filter(report => report.status === 'dalam_penanganan');

  // Convert emergency reports to map destinations
  const emergencyDestinations = reports
    .filter(report => report.latitude && report.longitude)
    .map(emergency => ({
      id: emergency.id,
      name: `${emergency.type === 'trauma' ? 'TRAUMA' : 'JANTUNG'} - ${emergency.patient_name}`,
      lat: emergency.latitude!,
      lng: emergency.longitude!,
      type: 'emergency' as const,
      address: emergency.location
    }));

  // Hospital and admin locations
  const adminLocations = [
    {
      id: 'admin-main',
      name: 'RSPAU dr. Suhardi Harjolukito (Pusat Komando)',
      lat: -6.1393,
      lng: 106.8747,
      type: 'admin' as const,
      address: 'Jl. Raya Halim Perdanakusuma, Jakarta Timur'
    },
    {
      id: 'hospital-1',
      name: 'RS Gatot Soebroto',
      lat: -6.2088,
      lng: 106.8456,
      type: 'hospital' as const,
      address: 'Jl. Abdul Rahman Saleh No.24, Jakarta Pusat'
    },
    {
      id: 'hospital-2',
      name: 'RSPAD Gatot Soebroto',
      lat: -6.1751,
      lng: 106.8650,
      type: 'hospital' as const,
      address: 'Jl. Abdul Rahman Saleh No.24, Jakarta Pusat'
    },
    {
      id: 'hospital-3',
      name: 'RS Premier Jatinegara',
      lat: -6.2146,
      lng: 106.8710,
      type: 'hospital' as const,
      address: 'Jl. Raya Jatinegara Timur No.85-87, Jakarta Timur'
    },
    {
      id: 'ambulance-1',
      name: 'Ambulans Unit 1',
      lat: -6.1400,
      lng: 106.8760,
      type: 'ambulance' as const,
      address: 'Dalam perjalanan ke lokasi'
    },
    {
      id: 'ambulance-2',
      name: 'Ambulans Unit 2',
      lat: -6.1420,
      lng: 106.8730,
      type: 'ambulance' as const,
      address: 'Standby di base'
    }
  ];

  const allDestinations = [...emergencyDestinations, ...adminLocations];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">🗺️ Admin - Monitoring Maps</h2>
      
      {/* Real-Time Location Map */}
      <RealTimeLocationMap 
        role="admin"
        userName="Admin Command Center"
        height="500px"
        showControls={true}
        showLocationList={true}
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{pendingReports.length}</div>
          <div className="text-sm text-red-700">🚨 Laporan Pending</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{activeReports.length}</div>
          <div className="text-sm text-yellow-700">⚡ Dalam Penanganan</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{reports.filter(r => r.status === 'selesai').length}</div>
          <div className="text-sm text-green-700">✅ Selesai</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{adminLocations.filter(l => l.type === 'ambulance').length}</div>
          <div className="text-sm text-blue-700">🚑 Unit Ambulans</div>
        </div>
      </div>

      {/* Emergency Reports List */}
      {pendingReports.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Activity className="mr-2" size={20} />
            📋 Laporan Darurat Aktif
          </h3>
          <div className="space-y-3">
            {pendingReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">
                      {report.type === 'trauma' ? '🚨 TRAUMA' : '❤️ JANTUNG'} - {report.patient_name}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <div>📍 {report.location}</div>
                      <div>👤 Pelapor: {report.reporter_name} ({report.reporter_rank})</div>
                      <div>📞 {report.reporter_phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.severity === 'berat' ? 'bg-red-100 text-red-800' : 
                      report.severity === 'sedang' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.severity}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(report.created_at).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hospital & Facility Status */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Users className="mr-2" size={20} />
          🏥 Status Fasilitas Kesehatan
        </h3>
        <div className="grid gap-3">
          {adminLocations.filter(loc => loc.type === 'hospital' || loc.type === 'admin').map((facility) => (
            <div key={facility.id} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <div className="font-medium">
                  {facility.type === 'hospital' ? '🏥' : '🏢'} {facility.name}
                </div>
                <div className="text-sm text-gray-500">📍 {facility.address}</div>
              </div>
              <div className="text-center">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Aktif
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ambulance Status */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
          <Navigation className="mr-2" size={20} />
          🚑 Status Unit Ambulans
        </h3>
        <div className="grid gap-3">
          {adminLocations.filter(loc => loc.type === 'ambulance').map((ambulance) => (
            <div key={ambulance.id} className="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <div className="font-medium">🚑 {ambulance.name}</div>
                <div className="text-sm text-gray-500">📍 {ambulance.address}</div>
              </div>
              <div className="text-center">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📡 Online
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMapsPage;