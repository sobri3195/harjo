import React, { useState, useEffect } from 'react';
import { AlertTriangle, Truck, Users, Clock, TrendingUp, CheckCircle, Activity, Zap, MapPin, Battery, Wifi, WifiOff } from 'lucide-react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { usePersonnel } from '@/hooks/usePersonnel';
import { useRealtimeAmbulanceTracking } from '@/hooks/useRealtimeAmbulanceTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const EnhancedAdminStats = () => {
  const { reports, loading: reportsLoading } = useEmergencyReports();
  const { personnel, loading: personnelLoading } = usePersonnel();
  const { ambulances, isConnected } = useRealtimeAmbulanceTracking();
  const { toast } = useToast();
  const [realTimeStats, setRealTimeStats] = useState({
    activeEmergencies: 0,
    averageResponseTime: 0,
    systemLoad: 85,
    lastUpdate: new Date()
  });

  // Real-time stats calculation
  useEffect(() => {
    const updateStats = () => {
      const activeReports = reports.filter(r => r.status === 'dalam_penanganan');
      const avgResponseTime = 8.5; // Calculate from actual data
      
      setRealTimeStats(prev => ({
        ...prev,
        activeEmergencies: activeReports.length,
        averageResponseTime: avgResponseTime,
        systemLoad: Math.random() * 20 + 70, // Simulate system load
        lastUpdate: new Date()
      }));
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [reports]);

  // Alert system for critical events
  useEffect(() => {
    const criticalReports = reports.filter(r => r.severity === 'berat' && r.status === 'pending');
    if (criticalReports.length > 0) {
      toast({
        title: "🚨 Alert Kritis!",
        description: `${criticalReports.length} laporan darurat kritis memerlukan perhatian segera`,
        variant: "destructive"
      });
    }
  }, [reports, toast]);

  const today = new Date().toDateString();
  const todayReports = reports.filter(report => 
    report.created_at && new Date(report.created_at).toDateString() === today
  );
  
  const activeReports = reports.filter(report => report.status === 'dalam_penanganan');
  const completedReports = reports.filter(report => report.status === 'selesai');

  // Ambulance status summary with proper fallbacks
  const ambulanceStats = {
    active: ambulances.filter(a => a.status === 'active' || a.status === 'dispatched' || a.status === 'en_route').length,
    idle: ambulances.filter(a => a.status === 'idle' || a.status === 'available' || !a.status).length,
    maintenance: ambulances.filter(a => a.status === 'maintenance' || a.status === 'offline').length
  };

  const statCards = [
    {
      title: 'Emergensi Aktif',
      value: realTimeStats.activeEmergencies.toString(),
      change: '+0%',
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      pulse: realTimeStats.activeEmergencies > 0
    },
    {
      title: 'Laporan Hari Ini',
      value: todayReports.length.toString(),
      change: '+12%',
      icon: Activity,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Ambulans Siap',
      value: ambulanceStats.active.toString(),
      change: `${ambulanceStats.idle}x standby`,
      icon: Truck,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Avg Response Time',
      value: `${realTimeStats.averageResponseTime}m`,
      change: '-2m',
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Personel Online',
      value: personnel.length.toString(),
      change: '100%',
      icon: Users,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'System Load',
      value: `${Math.round(realTimeStats.systemLoad)}%`,
      change: realTimeStats.systemLoad > 90 ? 'High' : 'Normal',
      icon: Activity,
      color: realTimeStats.systemLoad > 90 ? 'bg-red-500' : 'bg-green-500',
      textColor: realTimeStats.systemLoad > 90 ? 'text-red-600' : 'text-green-600'
    }
  ];

  if (reportsLoading || personnelLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Memuat statistik real-time...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-card rounded-lg p-4 border">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="text-green-500" size={20} />
          ) : (
            <WifiOff className="text-red-500" size={20} />
          )}
          <span className="text-sm font-medium">
            Status Koneksi: {isConnected ? 'Terhubung' : 'Terputus'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Last Update: {realTimeStats.lastUpdate.toLocaleTimeString('id-ID')}
        </div>
      </div>

      {/* Real-time Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index} className={`${stat.pulse ? 'animate-pulse' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <TrendingUp size={16} className="text-green-500 mr-1" />
                      <span className="text-sm text-green-600">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <IconComponent size={24} className="text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Ambulance Fleet Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Truck className="mr-2" size={20} />
            Status Armada Ambulans Real-time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-800">Aktif</p>
                  <p className="text-2xl font-bold text-green-600">{ambulanceStats.active}</p>
                </div>
                <Activity className="text-green-500" size={24} />
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Standby</p>
                  <p className="text-2xl font-bold text-blue-600">{ambulanceStats.idle}</p>
                </div>
                <Battery className="text-blue-500" size={24} />
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-800">Maintenance</p>
                  <p className="text-2xl font-bold text-orange-600">{ambulanceStats.maintenance}</p>
                </div>
                <Zap className="text-orange-500" size={24} />
              </div>
            </div>
          </div>
          
          {/* Individual Ambulance Status */}
          <div className="mt-4 space-y-2">
            {ambulances.slice(0, 5).map((ambulance, index) => {
              const status = ambulance.status || 'idle';
              const isActive = ['active', 'dispatched', 'en_route'].includes(status);
              const isIdle = ['idle', 'available'].includes(status) || !status;
              
              return (
                <div key={ambulance.ambulance_id || `ambulance-${index}`} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      isActive ? 'bg-green-500' :
                      isIdle ? 'bg-blue-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="font-medium">{ambulance.ambulance_id || `AMB-${index + 1}`}</span>
                    <MapPin size={16} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {ambulance.latitude?.toFixed(4) || '0.0000'}, {ambulance.longitude?.toFixed(4) || '0.0000'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      isActive ? 'default' :
                      isIdle ? 'secondary' : 'destructive'
                    }>
                      {status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {ambulance.speed || 0} km/h
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {reports.filter(r => r.severity === 'berat' && r.status === 'pending').length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="mr-2" size={20} />
              Alert Kritis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {reports
                .filter(r => r.severity === 'berat' && r.status === 'pending')
                .slice(0, 3)
                .map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium text-red-800">
                        {report.type === 'trauma' ? '🚨 TRAUMA' : '❤️ CARDIAC'} - {report.patient_name}
                      </div>
                      <div className="text-sm text-red-600">
                        📍 {report.location} • {report.severity.toUpperCase()}
                      </div>
                    </div>
                    <Badge variant="destructive">URGENT</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedAdminStats;