
import React from 'react';
import { Clock, AlertTriangle, Truck, User } from 'lucide-react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';

const HistoryPage = () => {
  const { reports, loading } = useEmergencyReports();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'berat': return 'bg-red-100 text-red-800';
      case 'sedang': return 'bg-yellow-100 text-yellow-800';
      case 'ringan': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dalam_penanganan': return 'bg-blue-100 text-blue-800';
      case 'selesai': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'dalam_penanganan': return 'Dalam Penanganan';
      case 'selesai': return 'Selesai';
      case 'pending': return 'Menunggu';
      default: return status;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Baru saja';
    if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari yang lalu`;
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Memuat riwayat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-navy-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-navy-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Riwayat Laporan</h2>
        <p className="text-gray-600">Histori laporan darurat yang telah dibuat</p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={32} className="text-gray-400" />
          </div>
          <p className="text-gray-500">Belum ada laporan darurat</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {report.type === 'trauma' ? (
                    <div className="w-10 h-10 bg-emergency-red-100 rounded-full flex items-center justify-center">
                      <AlertTriangle size={20} className="text-emergency-red-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 bg-heart-red-100 rounded-full flex items-center justify-center">
                      <Truck size={20} className="text-heart-red-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {report.type === 'trauma' ? 'Laporan Trauma' : 'Laporan Jantung'}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <Clock size={14} className="mr-1" />
                      {report.created_at ? formatTimeAgo(report.created_at) : 'Tidak diketahui'}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(report.severity)}`}>
                    {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                    {getStatusText(report.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-gray-700">
                  <User size={14} className="mr-2" />
                  <span className="font-medium">Pasien:</span>
                  <span className="ml-1">{report.patient_name}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <User size={14} className="mr-2" />
                  <span className="font-medium">Pelapor:</span>
                  <span className="ml-1">{report.reporter_name}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <span className="font-medium">Lokasi:</span>
                  <span className="ml-1">{report.location}</span>
                </div>
                <div className="text-gray-700">
                  <span className="font-medium">Deskripsi:</span>
                  <p className="mt-1 text-sm">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-gray-500 text-sm">
        {reports.length > 0 && `Menampilkan ${reports.length} laporan`}
      </div>
    </div>
  );
};

export default HistoryPage;
