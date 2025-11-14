import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Truck, MapPin, Clock, Activity, RefreshCw, Navigation } from 'lucide-react';
import { useRealtimeAmbulanceStatus } from '@/hooks/useRealtimeAmbulanceStatus';

const RealTimeAmbulanceTracker = () => {
  const { ambulances, loading, isConnected, simulateMovement } = useRealtimeAmbulanceStatus();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'bg-gray-100 text-gray-800';
      case 'dispatched': return 'bg-yellow-100 text-yellow-800';
      case 'en_route': return 'bg-blue-100 text-blue-800';
      case 'arrived': return 'bg-purple-100 text-purple-800';
      case 'returning': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'idle': return 'Standby';
      case 'dispatched': return 'Dikirim';
      case 'en_route': return 'Dalam Perjalanan';
      case 'arrived': return 'Tiba di Lokasi';
      case 'returning': return 'Kembali';
      case 'completed': return 'Selesai';
      default: return status;
    }
  };

  const formatCoordinate = (coord: number) => {
    return coord.toFixed(6);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          <span>Memuat tracking ambulans...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Tracking Ambulans Real-time
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-muted-foreground">
              {isConnected ? 'Terhubung' : 'Terputus'}
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {ambulances.length === 0 ? (
            <div className="text-center py-8">
              <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Tidak ada ambulans yang aktif saat ini</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => simulateMovement('AMB-001')}
              >
                Simulasi Pergerakan
              </Button>
            </div>
          ) : (
            ambulances.map((ambulance) => (
              <div key={ambulance.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold">{ambulance.ambulance_id}</h4>
                      <Badge className={`text-xs ${getStatusColor(ambulance.status)}`}>
                        {getStatusText(ambulance.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(ambulance.timestamp)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-500" />
                    <div>
                      <p className="text-muted-foreground">Koordinat</p>
                      <p className="font-mono">
                        {formatCoordinate(ambulance.latitude)}, {formatCoordinate(ambulance.longitude)}
                      </p>
                    </div>
                  </div>
                  
                  {ambulance.speed && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-muted-foreground">Kecepatan</p>
                        <p>{Math.round(ambulance.speed)} km/h</p>
                      </div>
                    </div>
                  )}
                </div>

                {ambulance.emergency_report_id && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm">
                    <span className="text-red-800 font-medium">
                      🚨 Menangani Emergency ID: {ambulance.emergency_report_id}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {ambulances.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Total ambulans aktif: {ambulances.length}</span>
              <span>Terakhir update: {new Date().toLocaleTimeString('id-ID')}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RealTimeAmbulanceTracker;