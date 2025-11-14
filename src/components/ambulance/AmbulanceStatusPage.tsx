
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Truck, Activity, Users, Phone, Clock, Navigation, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAmbulanceStatus } from '@/hooks/useAmbulanceStatus';
import { usePersonnel } from '@/hooks/usePersonnel';
import { useRealtimeAmbulanceStatus } from '@/hooks/useRealtimeAmbulanceStatus';
import AmbulanceStatusFlow from '@/components/AmbulanceStatusFlow';

const AmbulanceStatusPage = () => {
  const { ambulanceStatus, equipment, loading } = useAmbulanceStatus();
  const { personnel } = usePersonnel();
  const { ambulances, isConnected } = useRealtimeAmbulanceStatus();
  const [currentAmbulance] = useState('AMB-001'); // This would come from context/props in real app

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ambulanceStatus) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Data ambulans tidak ditemukan</h3>
              <p className="text-muted-foreground">Pastikan Anda telah login sebagai crew ambulans</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'siap_operasi': return 'bg-green-100 text-green-800';
      case 'dispatched': return 'bg-yellow-100 text-yellow-800';
      case 'en_route': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'siap_operasi': return 'SIAP OPERASI';
      case 'dispatched': return 'DIKIRIM';
      case 'en_route': return 'DALAM PERJALANAN';
      case 'arrived': return 'TIBA DI LOKASI';
      case 'maintenance': return 'MAINTENANCE';
      default: return status.toUpperCase();
    }
  };

  const onDutyPersonnel = personnel.filter(p => 
    p.jabatan.toLowerCase().includes('dokter') || 
    p.jabatan.toLowerCase().includes('perawat') ||
    p.jabatan.toLowerCase().includes('paramedis')
  ).slice(0, 3);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Koneksi real-time terputus</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Status Ambulans</h1>
        <Badge className={`px-4 py-2 text-lg ${getStatusColor(ambulanceStatus.status)}`}>
          {getStatusText(ambulanceStatus.status)}
        </Badge>
      </div>

      {/* Status Flow */}
      {(ambulanceStatus.status === 'dispatched' || ambulanceStatus.status === 'en_route' || ambulanceStatus.status === 'arrived') && (
        <AmbulanceStatusFlow 
          ambulanceId={ambulanceStatus.ambulance_id}
          onStatusChange={(status) => console.log('Status changed:', status)}
        />
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Shift</p>
                <p className="font-semibold">{ambulanceStatus.shift_start} - {ambulanceStatus.shift_end}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Crew</p>
                <p className="font-semibold">{ambulanceStatus.crew_count} Orang</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Bahan Bakar</p>
                <p className="font-semibold">{ambulanceStatus.fuel_level}%</p>
              </div>
            </div>
            <Progress value={ambulanceStatus.fuel_level} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Posisi</p>
                <p className="font-semibold">{ambulanceStatus.position}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personnel List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2" size={20} />
            Personel Bertugas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {onDutyPersonnel.map((person) => (
              <div key={person.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{person.nama}</p>
                  <p className="text-sm text-muted-foreground">{person.pangkat} - {person.jabatan}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-1" />
                  {person.no_telepon}
                </Button>
              </div>
            ))}
            {onDutyPersonnel.length === 0 && (
              <p className="text-muted-foreground text-center py-4">Tidak ada personel yang bertugas saat ini</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Equipment Status - Admin Managed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="mr-2" size={20} />
              Status Peralatan Medis
            </div>
            <Badge variant="outline" className="text-xs">
              Dikelola Admin
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipment.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium">{item.equipment_name}</h4>
                  <Badge variant={item.status === 'operational' ? 'default' : 'destructive'} className="text-xs">
                    {item.status === 'operational' ? 'Normal' : item.status}
                  </Badge>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{item.current_level}/{item.max_capacity} {item.unit}</span>
                  <span>{Math.round((item.current_level / item.max_capacity) * 100)}%</span>
                </div>
                <Progress value={(item.current_level / item.max_capacity) * 100} className="mt-2 h-2" />
              </div>
            ))}
          </div>
          {equipment.length === 0 && (
            <p className="text-muted-foreground text-center py-4">
              Tidak ada data peralatan. Status peralatan dikelola oleh admin.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AmbulanceStatusPage;
