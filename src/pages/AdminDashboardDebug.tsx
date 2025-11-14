import React, { useState } from 'react';
import { BarChart3, Users, UserPlus, Truck, AlertTriangle, Settings, LogOut, Menu, Phone, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LeafletAmbulanceMap from '@/components/maps/LeafletAmbulanceMap';

const AdminDashboardDebug = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-blue-600' },
    { id: 'emergency-calls', icon: Phone, label: 'Emergency Calls', color: 'text-red-600' },
    { id: 'maps', icon: Activity, label: 'Maps & Monitoring', color: 'text-green-600' },
    { id: 'reports', icon: AlertTriangle, label: 'Laporan Darurat', color: 'text-orange-600' },
    { id: 'personnel', icon: Users, label: 'Manajemen Personel', color: 'text-purple-600' },
    { id: 'medical-team', icon: UserPlus, label: 'Tim Medis', color: 'text-indigo-600' },
    { id: 'settings', icon: Settings, label: 'Pengaturan', color: 'text-gray-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mx-6 mt-4">
              <h2 className="text-xl font-bold text-gray-800 mb-2">👨‍💼 Admin Dashboard</h2>
              <p className="text-gray-600 text-sm">
                Kelola sistem darurat RSPAU dr. Suhardi Harjolukito
              </p>
            </div>
            
            {/* Basic Stats */}
            <div className="mx-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Total Reports</h3>
                    <p className="text-2xl font-bold text-blue-600">156</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Active Personnel</h3>
                    <p className="text-2xl font-bold text-green-600">89</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Ambulances</h3>
                    <p className="text-2xl font-bold text-orange-600">12</p>
                  </div>
                  <Truck className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Response Time</h3>
                    <p className="text-2xl font-bold text-purple-600">8 min</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'emergency-calls':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Emergency Calls</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600">Emergency calls management interface will be displayed here.</p>
            </div>
          </div>
        );
      case 'maps':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Maps & Monitoring</h2>
            <div className="space-y-6">
              {/* Import the ambulance tracking map */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <LeafletAmbulanceMap height="500px" showControls={true} />
              </div>
              
              {/* Additional monitoring info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Status Unit</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Available:</span>
                      <span className="text-sm font-medium text-green-600">1 unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Dispatched:</span>
                      <span className="text-sm font-medium text-yellow-600">1 unit</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">En Route:</span>
                      <span className="text-sm font-medium text-red-600">1 unit</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Response Time</h3>
                  <div className="text-2xl font-bold text-blue-600">8.5 min</div>
                  <div className="text-sm text-gray-600">Rata-rata hari ini</div>
                </div>
                
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Coverage Area</h3>
                  <div className="text-2xl font-bold text-purple-600">15 km</div>
                  <div className="text-sm text-gray-600">Radius maksimal</div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Laporan Darurat</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600">Emergency reports will be displayed here.</p>
            </div>
          </div>
        );
      case 'personnel':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Manajemen Personel</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600">Personnel management interface will be displayed here.</p>
            </div>
          </div>
        );
      case 'medical-team':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Tim Medis</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600">Medical team management interface will be displayed here.</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Pengaturan</h2>
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-gray-600">System settings will be displayed here.</p>
            </div>
          </div>
        );
      default:
        return <div>Content not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col`}>
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <h1 className="text-lg font-bold text-gray-800">RSPAU dr. Suhardi Harjolukito</h1>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={20} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon size={20} className={`${item.color} ${!sidebarOpen && 'mx-auto'}`} />
                  {sidebarOpen && (
                    <span className="ml-3 font-medium">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
          >
            <LogOut size={20} className="text-red-500" />
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm px-6 py-4">
          <h1 className="text-xl font-semibold text-gray-800">
            {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
          </h1>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardDebug;