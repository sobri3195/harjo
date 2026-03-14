
import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Users, UserPlus, Truck, AlertTriangle, Settings, Menu, Activity, Wrench, Clock3, HeartPulse, Siren } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EnhancedAdminStats from '@/components/admin/EnhancedAdminStats';
import EnhancedEmergencyReports from '@/components/admin/EnhancedEmergencyReports';
import EnhancedPersonnelManagement from '@/components/admin/EnhancedPersonnelManagement';
import EnhancedMedicalTeam from '@/components/admin/EnhancedMedicalTeam';
import EnhancedAdminSettings from '@/components/admin/EnhancedAdminSettings';
import EnhancedMapsMonitoring from '@/components/admin/EnhancedMapsMonitoring';
import AmbulanceDriverManagement from '@/components/admin/AmbulanceDriverManagement';
import AmbulanceStatusAdmin from '@/components/admin/AmbulanceStatusAdmin';
import EquipmentManagement from '@/components/admin/EquipmentManagement';
import EmergencyCallsAdmin from '@/components/admin/EmergencyCallsAdmin';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';

const AdminDashboard = () => {
  const getInitialTab = () => {
    const hash = window.location.hash.slice(1);
    const validTabs = ['dashboard', 'maps', 'ambulance-status', 'drivers', 'equipment', 'reports', 'personnel', 'medical-team', 'settings'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(() => getInitialTab());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { reports } = useEmergencyReports();

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['dashboard', 'maps', 'ambulance-status', 'drivers', 'equipment', 'reports', 'personnel', 'medical-team', 'settings'];
      if (validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (!window.location.hash) {
      window.location.hash = activeTab;
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const setTabWithHash = (tab: string) => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const reportMetrics = useMemo(() => {
    const pending = reports.filter((report) => report.status === 'pending').length;
    const inProgress = reports.filter((report) => report.status === 'dalam_penanganan').length;
    const critical = reports.filter((report) => report.severity === 'berat' && report.status !== 'selesai').length;

    return {
      pending,
      inProgress,
      critical,
      resolvedToday: reports.filter((report) => {
        const isResolved = report.status === 'selesai';
        const resolvedDate = new Date(report.updated_at).toDateString();
        return isResolved && resolvedDate === new Date().toDateString();
      }).length,
    };
  }, [reports]);

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-blue-600' },
    { id: 'maps', icon: Activity, label: 'Maps & Monitoring', color: 'text-green-600' },
    { id: 'ambulance-status', icon: Truck, label: 'Status Ambulans', color: 'text-blue-600' },
    { id: 'drivers', icon: Users, label: 'Driver Management', color: 'text-purple-600' },
    { id: 'equipment', icon: Wrench, label: 'Manajemen Peralatan', color: 'text-orange-600' },
    { id: 'reports', icon: AlertTriangle, label: 'Laporan Darurat', color: 'text-red-600' },
    { id: 'personnel', icon: Users, label: 'Manajemen Personel', color: 'text-purple-600' },
    { id: 'medical-team', icon: UserPlus, label: 'Tim Medis', color: 'text-indigo-600' },
    { id: 'settings', icon: Settings, label: 'Pengaturan', color: 'text-gray-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mx-6 mt-4 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">👨‍💼 Admin Dashboard</h2>
              <p className="text-gray-600 text-sm">
                Kelola sistem darurat RSPAU dr. Suhardi Harjolukito
              </p>
            </div>

            {/* Quick Stats */}
            <EnhancedAdminStats />

            <div className="mx-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-700 font-medium">Pending Calls</p>
                  <Siren size={18} className="text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-800 mt-2">{reportMetrics.pending}</p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-amber-700 font-medium">Sedang Ditangani</p>
                  <Clock3 size={18} className="text-amber-600" />
                </div>
                <p className="text-2xl font-bold text-amber-800 mt-2">{reportMetrics.inProgress}</p>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-purple-700 font-medium">Kasus Kritis</p>
                  <HeartPulse size={18} className="text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-purple-800 mt-2">{reportMetrics.critical}</p>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-green-700 font-medium">Selesai Hari Ini</p>
                  <Activity size={18} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-800 mt-2">{reportMetrics.resolvedToday}</p>
              </div>
            </div>

            {/* Emergency Reports Summary */}
            <div className="mx-6 bg-white border border-gray-100 rounded-xl shadow-sm p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Activity className="mr-2" size={20} />
                Laporan Darurat Terbaru
              </h3>
              <div className="space-y-2">
                {reports.slice(0, 3).map((report) => (
                  <div key={report.id} className="flex justify-between items-center p-3 border border-gray-100 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {report.type === 'trauma' ? '🚨 TRAUMA' : '❤️ JANTUNG'} - {report.patient_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        📍 {report.location} • {report.severity}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending' ? 'bg-red-100 text-red-800' :
                      report.status === 'dalam_penanganan' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                onClick={() => setTabWithHash('reports')}
                variant="outline"
                className="w-full mt-3"
              >
                Lihat Semua Laporan
              </Button>
            </div>

            {/* Quick Actions */}
            <div className="mx-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => setTabWithHash('maps')}
                className="bg-white border border-gray-200 hover:border-gray-300 text-gray-900 rounded-xl p-4 text-left transition-colors shadow-sm"
              >
                <div className="text-lg mb-1">🗺️</div>
                <div className="font-semibold">Maps</div>
                <div className="text-xs text-gray-500">Monitoring</div>
              </button>
              <button
                onClick={() => setTabWithHash('reports')}
                className="bg-white border border-gray-200 hover:border-gray-300 text-gray-900 rounded-xl p-4 text-left transition-colors shadow-sm"
              >
                <div className="text-lg mb-1">📋</div>
                <div className="font-semibold">Laporan</div>
                <div className="text-xs text-gray-500">Darurat</div>
              </button>
            </div>
          </div>
        );
      case 'maps':
        return <EnhancedMapsMonitoring />;
      case 'ambulance-status':
        return <AmbulanceStatusAdmin />;
      case 'drivers':
        return <AmbulanceDriverManagement />;
      case 'equipment':
        return <EquipmentManagement />;
      case 'reports':
        return <EnhancedEmergencyReports />;
      case 'personnel':
        return <EnhancedPersonnelManagement />;
      case 'medical-team':
        return <EnhancedMedicalTeam />;
      case 'settings':
        return <EnhancedAdminSettings />;
      default:
        return <EnhancedAdminStats />;
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-100 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            {/* Hide navigation buttons on admin route */}
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xs">EH</span>
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs text-gray-500">RSPAU dr. Suhardi Harjolukito</p>
              </div>
            )}
          </div>
        </div>

        <nav className="mt-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTabWithHash(item.id)}
                className={`w-full flex items-center px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                  activeTab === item.id ? 'bg-blue-50 border-r-2 border-blue-600' : ''
                }`}
              >
                <IconComponent className={`${item.color} ${sidebarOpen ? 'mr-3' : 'mx-auto'}`} size={20} />
                {sidebarOpen && (
                  <span className={`font-medium ${activeTab === item.id ? 'text-blue-600' : 'text-gray-700'}`}>
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Menu size={20} className="text-gray-600" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Administrator</p>
                <p className="text-xs text-gray-500">RSPAU dr. Suhardi Harjolukito</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-white">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
