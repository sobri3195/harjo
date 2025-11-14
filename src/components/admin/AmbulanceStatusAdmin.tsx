import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Fuel, Users, MapPin, Clock, Settings } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useAmbulanceStatus, AmbulanceStatus } from '@/hooks/useAmbulanceStatus';

const AmbulanceStatusAdmin = () => {
  const [allStatuses, setAllStatuses] = useState<AmbulanceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { getAllAmbulanceStatuses } = useAmbulanceStatus();

  const fetchAllStatuses = async () => {
    setLoading(true);
    const statuses = await getAllAmbulanceStatuses();
    setAllStatuses(statuses);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllStatuses();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'siap_operasi': return 'green';
      case 'dispatched': return 'yellow';
      case 'maintenance': return 'red';
      default: return 'gray';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'siap_operasi': return 'SIAP OPERASI';
      case 'dispatched': return 'DALAM PERJALANAN';
      case 'maintenance': return 'MAINTENANCE';
      default: return status.toUpperCase();
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'siap_operasi': return 'default';
      case 'dispatched': return 'secondary';
      case 'maintenance': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const statusCounts = allStatuses.reduce((acc, status) => {
    acc[status.status] = (acc[status.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Status Ambulans</h2>
        <Button onClick={fetchAllStatuses} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ambulans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allStatuses.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Siap Operasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.siap_operasi || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dalam Perjalanan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.dispatched || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.maintenance || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ambulance Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allStatuses.map((ambulance) => (
          <Card key={ambulance.id} className="relative">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{ambulance.ambulance_id}</CardTitle>
                  <Badge variant={getStatusVariant(ambulance.status)} className="mt-2">
                    {getStatusText(ambulance.status)}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Shift Info */}
              <div className="flex items-center space-x-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Shift:</span> {ambulance.shift_start} - {ambulance.shift_end}
                </div>
              </div>

              {/* Fuel Level */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Bahan Bakar</span>
                  </div>
                  <span className="text-sm">{ambulance.fuel_level}%</span>
                </div>
                <Progress value={ambulance.fuel_level} className="h-2" />
              </div>

              {/* Crew */}
              <div className="flex items-center space-x-3">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Crew:</span> {ambulance.crew_count} Orang
                </div>
              </div>

              {/* Position */}
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div className="text-sm">
                  <span className="font-medium">Posisi:</span> {ambulance.position}
                </div>
              </div>

              {/* Last Updated */}
              <div className="text-xs text-muted-foreground border-t pt-2">
                Terakhir update: {new Date(ambulance.updated_at).toLocaleString('id-ID')}
                {ambulance.last_updated_by && (
                  <span> oleh {ambulance.last_updated_by}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {allStatuses.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium">Tidak ada data ambulans</h3>
              <p className="text-muted-foreground">Data status ambulans akan muncul di sini</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AmbulanceStatusAdmin;