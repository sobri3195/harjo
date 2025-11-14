import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  Fuel, 
  Users, 
  MapPin, 
  Heart, 
  Stethoscope, 
  Zap, 
  Pill,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AmbulanceStatus {
  id: string;
  unit: string;
  status: 'ready' | 'dispatched' | 'maintenance' | 'offline';
  shift: string;
  fuelLevel: number;
  crewCount: number;
  position: string;
  lastUpdate: Date;
  equipment: {
    defibrillator: 'normal' | 'warning' | 'error';
    oxygen: 'normal' | 'warning' | 'error';
    stretcher: 'normal' | 'warning' | 'error';
    medicines: 'complete' | 'limited' | 'critical';
  };
}

const AmbulanceStatusMonitor = () => {
  const [ambulances, setAmbulances] = useState<AmbulanceStatus[]>([
    {
      id: '1',
      unit: 'AMB-01',
      status: 'ready',
      shift: '08:00 - 20:00',
      fuelLevel: 85,
      crewCount: 2,
      position: 'Base',
      lastUpdate: new Date(),
      equipment: {
        defibrillator: 'normal',
        oxygen: 'normal',
        stretcher: 'normal',
        medicines: 'complete'
      }
    },
    {
      id: '2',
      unit: 'AMB-02',
      status: 'dispatched',
      shift: '20:00 - 08:00',
      fuelLevel: 72,
      crewCount: 1,
      position: 'Jl. Adisucipto',
      lastUpdate: new Date(Date.now() - 300000),
      equipment: {
        defibrillator: 'normal',
        oxygen: 'warning',
        stretcher: 'normal',
        medicines: 'limited'
      }
    },
    {
      id: '3',
      unit: 'AMB-03',
      status: 'maintenance',
      shift: '12:00 - 24:00',
      fuelLevel: 45,
      crewCount: 0,
      position: 'Garage',
      lastUpdate: new Date(Date.now() - 1800000),
      equipment: {
        defibrillator: 'error',
        oxygen: 'normal',
        stretcher: 'warning',
        medicines: 'critical'
      }
    }
  ]);

  const { toast } = useToast();

  const getStatusColor = (status: AmbulanceStatus['status']) => {
    switch (status) {
      case 'ready': return 'bg-green-600';
      case 'dispatched': return 'bg-blue-600';
      case 'maintenance': return 'bg-orange-600';
      case 'offline': return 'bg-red-600';
    }
  };

  const getStatusText = (status: AmbulanceStatus['status']) => {
    switch (status) {
      case 'ready': return '✅ SIAP OPERASI';
      case 'dispatched': return '🚨 DALAM MISI';
      case 'maintenance': return '🔧 MAINTENANCE';
      case 'offline': return '❌ OFFLINE';
    }
  };

  const getEquipmentIcon = (equipment: string) => {
    switch (equipment) {
      case 'defibrillator': return <Zap className="w-4 h-4" />;
      case 'oxygen': return <Activity className="w-4 h-4" />;
      case 'stretcher': return <Users className="w-4 h-4" />;
      case 'medicines': return <Pill className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getEquipmentStatus = (status: string) => {
    switch (status) {
      case 'normal':
      case 'complete':
        return { color: 'text-green-600', text: 'Normal' };
      case 'warning':
      case 'limited':
        return { color: 'text-yellow-600', text: 'Perhatian' };
      case 'error':
      case 'critical':
        return { color: 'text-red-600', text: 'Kritis' };
      default:
        return { color: 'text-gray-600', text: 'Unknown' };
    }
  };

  const refreshStatus = (ambulanceId: string) => {
    setAmbulances(prev => prev.map(amb => 
      amb.id === ambulanceId 
        ? { ...amb, lastUpdate: new Date() }
        : amb
    ));

    toast({
      title: "🔄 Status Diperbarui",
      description: "Data ambulans telah disegarkan",
    });
  };

  const readyAmbulances = ambulances.filter(a => a.status === 'ready').length;
  const dispatchedAmbulances = ambulances.filter(a => a.status === 'dispatched').length;
  const maintenanceAmbulances = ambulances.filter(a => a.status === 'maintenance').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🚑 Status Ambulans</h2>
          <p className="text-gray-600">Monitor real-time semua unit ambulans RSPAU</p>
        </div>
        <Badge variant="default" className="bg-green-600">
          📡 LIVE MONITORING
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Siap Operasi</p>
                <p className="text-2xl font-bold text-green-600">{readyAmbulances}</p>
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
                <p className="text-sm text-gray-600">Dalam Misi</p>
                <p className="text-2xl font-bold text-blue-600">{dispatchedAmbulances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{maintenanceAmbulances}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Crew</p>
                <p className="text-2xl font-bold text-purple-600">
                  {ambulances.reduce((sum, amb) => sum + amb.crewCount, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ambulance Details */}
      <div className="grid gap-6">
        {ambulances.map((ambulance) => (
          <Card key={ambulance.id} className={`border-l-4 ${
            ambulance.status === 'ready' ? 'border-l-green-500' :
            ambulance.status === 'dispatched' ? 'border-l-blue-500' :
            ambulance.status === 'maintenance' ? 'border-l-orange-500' :
            'border-l-red-500'
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <Car className="w-6 h-6 text-gray-700" />
                  <span>🚑 {ambulance.unit}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(ambulance.status)}>
                    {getStatusText(ambulance.status)}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refreshStatus(ambulance.id)}
                  >
                    <RefreshCw className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Basic Info */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Informasi Umum</span>
                  </h4>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift:</span>
                      <span className="font-medium">{ambulance.shift}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bahan Bakar:</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={ambulance.fuelLevel} className="w-16 h-2" />
                        <span className="font-medium">{ambulance.fuelLevel}%</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Crew:</span>
                      <span className="font-medium">{ambulance.crewCount} Orang</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Posisi:</span>
                      <span className="font-medium flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{ambulance.position}</span>
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Update terakhir:</span>
                      <span className="text-gray-500">
                        {Math.floor((Date.now() - ambulance.lastUpdate.getTime()) / 60000)}m ago
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personnel */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Personel Bertugas</span>
                  </h4>
                  
                  {ambulance.crewCount > 0 ? (
                    <div className="space-y-2">
                      {ambulance.unit === 'AMB-01' && (
                        <>
                          <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Serda Budi Santoso</p>
                              <p className="text-xs text-gray-500">Driver/Paramedis</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Stethoscope className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">Kopda Ahmad Wijaya</p>
                              <p className="text-xs text-gray-500">Medis</p>
                            </div>
                          </div>
                        </>
                      )}
                      {ambulance.unit === 'AMB-02' && (
                        <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Sertu Maria Sari</p>
                            <p className="text-xs text-gray-500">Driver</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Belum ada personel yang bertugas</p>
                  )}
                </div>

                {/* Medical Equipment */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <Heart className="w-4 h-4" />
                    <span>Status Peralatan Medis</span>
                  </h4>
                  
                  <div className="space-y-3">
                    {Object.entries(ambulance.equipment).map(([equipment, status]) => {
                      const equipmentNames: Record<string, string> = {
                        defibrillator: 'Defibrilator',
                        oxygen: 'Oksigen',
                        stretcher: 'Tandu',
                        medicines: 'Obat-obatan'
                      };
                      
                      const statusInfo = getEquipmentStatus(status);
                      
                      return (
                        <div key={equipment} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center space-x-2">
                            <div className={`${statusInfo.color}`}>
                              {getEquipmentIcon(equipment)}
                            </div>
                            <span className="text-sm font-medium">{equipmentNames[equipment]}</span>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${statusInfo.color} border-current`}
                          >
                            {statusInfo.text}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AmbulanceStatusMonitor;