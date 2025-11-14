
import React from 'react';
import { AlertTriangle, Truck, Users, Clock, TrendingUp, CheckCircle } from 'lucide-react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { usePersonnel } from '@/hooks/usePersonnel';

const AdminStats = () => {
  const { reports, loading: reportsLoading } = useEmergencyReports();
  const { personnel, loading: personnelLoading } = usePersonnel();

  // Calculate stats from real data
  const today = new Date().toDateString();
  const todayReports = reports.filter(report => 
    report.created_at && new Date(report.created_at).toDateString() === today
  );
  
  const traumaReports = reports.filter(report => report.type === 'trauma');
  const heartReports = reports.filter(report => report.type === 'heart');
  const completedReports = reports.filter(report => report.status === 'selesai');
  const activeReports = reports.filter(report => report.status === 'dalam_penanganan');

  const stats = [
    {
      title: 'Total Laporan Hari Ini',
      value: todayReports.length.toString(),
      change: '+12%',
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Kasus Trauma',
      value: traumaReports.length.toString(),
      change: '+8%',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Kasus Jantung',
      value: heartReports.length.toString(),
      change: '+4%',
      icon: Truck,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Total Personel',
      value: personnel.length.toString(),
      change: '100%',
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Kasus Aktif',
      value: activeReports.length.toString(),
      change: '-15%',
      icon: Clock,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Kasus Selesai',
      value: completedReports.length.toString(),
      change: '+20%',
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    }
  ];

  const recentReports = reports.slice(0, 5).map((report, index) => ({
    id: index + 1,
    type: report.type === 'trauma' ? 'Trauma' : 'Jantung',
    reporter: report.reporter_name.substring(0, 10),
    time: report.created_at ? new Date(report.created_at).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '--:--',
    status: report.status === 'dalam_penanganan' ? 'Dalam Penanganan' : 
            report.status === 'selesai' ? 'Selesai' : 'Menunggu',
    priority: report.severity === 'berat' ? 'Kritis' : 
              report.severity === 'sedang' ? 'Tinggi' : 'Sedang'
  }));

  if (reportsLoading || personnelLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Memuat data statistik...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp size={16} className="text-green-500 mr-1" />
                    <span className="text-sm text-green-600">{stat.change}</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <IconComponent size={24} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Reports Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Laporan Terbaru</h3>
        </div>
        {recentReports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Belum ada laporan darurat
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelapor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioritas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">#{report.id.toString().padStart(3, '0')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.type === 'Trauma' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">{report.reporter}</td>
                    <td className="px-6 py-4 text-sm text-gray-800">{report.time}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.status === 'Selesai' ? 'bg-green-100 text-green-800' :
                        report.status === 'Dalam Penanganan' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        report.priority === 'Kritis' ? 'bg-red-100 text-red-800' :
                        report.priority === 'Tinggi' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {report.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
