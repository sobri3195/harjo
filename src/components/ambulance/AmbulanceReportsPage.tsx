
import React from 'react';
import { FileText, Clock, MapPin } from 'lucide-react';

const AmbulanceReportsPage = () => {
  const reports = [
    {
      id: 1,
      time: '14:30',
      type: 'Trauma',
      location: 'Jl. Sudirman No. 45',
      status: 'Selesai',
      distance: '8.2 km'
    },
    {
      id: 2,
      time: '11:15',
      type: 'Jantung',
      location: 'Apartemen Green Bay',
      status: 'Selesai',
      distance: '12.5 km'
    },
    {
      id: 3,
      time: '09:45',
      type: 'Trauma',
      location: 'Kantor Kemhan RI',
      status: 'Selesai',
      distance: '5.3 km'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Laporan Perjalanan</h2>
      
      {/* Today's Summary */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Ringkasan Hari Ini</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-emergency-red-600">3</div>
            <div className="text-xs text-gray-600">Panggilan</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-navy-blue-600">26</div>
            <div className="text-xs text-gray-600">KM Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-military-green-600">7</div>
            <div className="text-xs text-gray-600">Menit Avg</div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-800">Riwayat Panggilan</h3>
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-md p-4">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center space-x-2">
                <FileText size={20} className="text-navy-blue-600" />
                <span className="font-semibold text-gray-800">
                  {report.type === 'Trauma' ? '🚨 Trauma' : '❤️ Jantung'}
                </span>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                {report.status}
              </span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock size={16} />
                <span>{report.time}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={16} />
                <span>{report.location}</span>
              </div>
              <div className="text-xs text-gray-500">
                Jarak tempuh: {report.distance}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <button className="w-full bg-navy-blue-600 hover:bg-navy-blue-700 text-white rounded-xl p-4 transition-colors">
        <div className="flex items-center justify-center space-x-2">
          <FileText size={20} />
          <span className="font-semibold">Export Laporan Harian</span>
        </div>
      </button>
    </div>
  );
};

export default AmbulanceReportsPage;
