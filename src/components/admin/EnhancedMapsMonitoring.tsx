import React, { useState, useEffect } from 'react';
import { MapPin, AlertTriangle, Navigation, Zap, Settings, Filter, Users, Truck, Plus, Eye, EyeOff, Edit, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRealtimeAmbulanceTracking } from '@/hooks/useRealtimeAmbulanceTracking';
import { RSPAURoutingMap } from '@/components/maps/RSPAURoutingMap';
import { useToast } from '@/hooks/use-toast';

interface GeofenceZone {
  id: string;
  name: string;
  center: [number, number];
  radius: number;
  type: 'hospital' | 'danger' | 'restricted';
  alerts: boolean;
}

interface TrafficAlert {
  id: string;
  location: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
}

// RSPAU dr. S. Hardjolukito coordinates (Yogyakarta)
const RSPAU_LOCATION = {
  lat: -7.773789,
  lng: 110.425888,
  name: 'RSPAU dr. S. Hardjolukito',
  address: 'Jl. Adisucipto No. 146, Maguwoharjo, Depok, Sleman, Yogyakarta'
};

const EnhancedMapsMonitoring = () => {
  const { ambulances } = useRealtimeAmbulanceTracking();
  const { toast } = useToast();
  const [selectedAmbulance, setSelectedAmbulance] = useState<string | null>(null);
  const [showAddGeofenceDialog, setShowAddGeofenceDialog] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<GeofenceZone | null>(null);
  const [newGeofence, setNewGeofence] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '500',
    type: 'hospital' as 'hospital' | 'danger' | 'restricted',
    alerts: true
  });
  const [geofenceZones, setGeofenceZones] = useState<GeofenceZone[]>([
    {
      id: 'rspau-zone',
      name: 'RSPAU dr. S. Hardjolukito',
      center: [RSPAU_LOCATION.lat, RSPAU_LOCATION.lng],
      radius: 500,
      type: 'hospital',
      alerts: true
    },
    {
      id: 'zone-1',
      name: 'RS Sardjito',
      center: [-7.7691, 110.3735],
      radius: 1000,
      type: 'hospital',
      alerts: true
    },
    {
      id: 'zone-2', 
      name: 'Zona Kemacetan Malioboro',
      center: [-7.7926, 110.3656],
      radius: 2000,
      type: 'danger',
      alerts: true
    }
  ]);
  const [trafficAlerts, setTrafficAlerts] = useState<TrafficAlert[]>([
    {
      id: 'traffic-1',
      location: 'Jl. Gatot Subroto',
      severity: 'high',
      description: 'Kemacetan padat, estimasi delay +15 menit',
      timestamp: new Date()
    },
    {
      id: 'traffic-2',
      location: 'Jl. Rasuna Said',
      severity: 'medium',
      description: 'Lalu lintas sedang, estimasi delay +5 menit',
      timestamp: new Date()
    }
  ]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showGeofences, setShowGeofences] = useState(true);

  // Geofencing alerts
  useEffect(() => {
    const checkGeofenceAlerts = () => {
      ambulances.forEach(ambulance => {
        geofenceZones.forEach(zone => {
          if (!zone.alerts) return;
          
          const distance = calculateDistance(
            [ambulance.latitude || 0, ambulance.longitude || 0],
            zone.center
          );
          
          if (distance <= zone.radius && zone.type === 'danger') {
            toast({
              title: "🚨 Geofence Alert",
              description: `Ambulans ${ambulance.ambulance_id} memasuki zona ${zone.name}`,
              variant: "destructive"
            });
          }
        });
      });
    };

    const interval = setInterval(checkGeofenceAlerts, 30000);
    return () => clearInterval(interval);
  }, [ambulances, geofenceZones, toast]);

  // Traffic integration simulation
  useEffect(() => {
    const updateTrafficAlerts = () => {
      if (Math.random() > 0.8) { // 20% chance of new traffic alert
        const newAlert: TrafficAlert = {
          id: `traffic-${Date.now()}`,
          location: `Jl. ${['Sudirman', 'Thamrin', 'Kuningan', 'Senayan'][Math.floor(Math.random() * 4)]}`,
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
          description: 'Kemacetan terdeteksi oleh sistem traffic monitoring',
          timestamp: new Date()
        };
        
        setTrafficAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
        
        toast({
          title: "🚦 Traffic Alert",
          description: `Kemacetan baru terdeteksi di ${newAlert.location}`,
        });
      }
    };

    const interval = setInterval(updateTrafficAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [toast]);

  const calculateDistance = (point1: [number, number], point2: [number, number]) => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance from ambulance to RSPAU
  const getDistanceToRSPAU = (ambulance: any) => {
    if (!ambulance.latitude || !ambulance.longitude) return null;
    
    const distance = calculateDistance(
      [ambulance.latitude, ambulance.longitude],
      [RSPAU_LOCATION.lat, RSPAU_LOCATION.lng]
    );
    
    return distance < 1000 
      ? `${Math.round(distance)}m` 
      : `${(distance / 1000).toFixed(1)}km`;
  };

  // Calculate ETA to RSPAU (assuming average speed)
  const getETAToRSPAU = (ambulance: any) => {
    if (!ambulance.latitude || !ambulance.longitude) return null;
    
    const distance = calculateDistance(
      [ambulance.latitude, ambulance.longitude],
      [RSPAU_LOCATION.lat, RSPAU_LOCATION.lng]
    ) / 1000; // Convert to km
    
    const avgSpeed = ambulance.speed > 0 ? ambulance.speed : 50; // Default 50 km/h
    const eta = (distance / avgSpeed) * 60; // Convert to minutes
    
    return eta < 60 
      ? `${Math.round(eta)} mnt` 
      : `${Math.floor(eta / 60)}j ${Math.round(eta % 60)}m`;
  };

  const filteredAmbulances = ambulances.filter(ambulance => {
    if (filterStatus === 'all') return true;
    const status = ambulance.status || 'idle';
    
    // Map different status variations to filter options
    if (filterStatus === 'active') {
      return ['active', 'dispatched', 'en_route'].includes(status);
    }
    if (filterStatus === 'idle') {
      return ['idle', 'available'].includes(status) || !status;
    }
    if (filterStatus === 'maintenance') {
      return ['maintenance', 'offline'].includes(status);
    }
    
    return ambulance.status === filterStatus;
  });

  const addGeofenceZone = () => {
    if (!newGeofence.name || !newGeofence.latitude || !newGeofence.longitude) {
      toast({
        title: "❌ Error",
        description: "Semua field harus diisi",
        variant: "destructive"
      });
      return;
    }

    const lat = parseFloat(newGeofence.latitude);
    const lng = parseFloat(newGeofence.longitude);
    const radius = parseInt(newGeofence.radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(radius)) {
      toast({
        title: "❌ Error",
        description: "Koordinat dan radius harus berupa angka",
        variant: "destructive"
      });
      return;
    }

    if (editingGeofence) {
      // Update existing geofence
      setGeofenceZones(prev => 
        prev.map(zone => 
          zone.id === editingGeofence.id 
            ? {
                ...zone,
                name: newGeofence.name,
                center: [lat, lng],
                radius,
                type: newGeofence.type,
                alerts: newGeofence.alerts
              }
            : zone
        )
      );
      toast({
        title: "✅ Berhasil",
        description: `Geofence "${newGeofence.name}" berhasil diupdate`,
      });
    } else {
      // Add new geofence
      const newZone: GeofenceZone = {
        id: `zone-${Date.now()}`,
        name: newGeofence.name,
        center: [lat, lng],
        radius,
        type: newGeofence.type,
        alerts: newGeofence.alerts
      };
      setGeofenceZones(prev => [...prev, newZone]);
      toast({
        title: "✅ Berhasil",
        description: `Geofence "${newGeofence.name}" berhasil ditambahkan`,
      });
    }

    // Reset form
    setNewGeofence({
      name: '',
      latitude: '',
      longitude: '',
      radius: '500',
      type: 'hospital',
      alerts: true
    });
    setEditingGeofence(null);
    setShowAddGeofenceDialog(false);
  };

  const editGeofence = (zone: GeofenceZone) => {
    setEditingGeofence(zone);
    setNewGeofence({
      name: zone.name,
      latitude: zone.center[0].toString(),
      longitude: zone.center[1].toString(),
      radius: zone.radius.toString(),
      type: zone.type,
      alerts: zone.alerts
    });
    setShowAddGeofenceDialog(true);
  };

  const deleteGeofence = (zoneId: string) => {
    setGeofenceZones(prev => prev.filter(zone => zone.id !== zoneId));
    toast({
      title: "🗑️ Dihapus",
      description: "Geofence berhasil dihapus",
    });
  };

  const resetGeofenceForm = () => {
    setNewGeofence({
      name: '',
      latitude: '',
      longitude: '',
      radius: '500',
      type: 'hospital',
      alerts: true
    });
    setEditingGeofence(null);
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MapPin className="mr-2 text-blue-600" size={20} />
              🗺️ Real-Time Tracking - RSPAU dr. S. Hardjolukito (Yogyakarta)
            </div>
            <div className="flex items-center space-x-2">
              <Dialog open={showAddGeofenceDialog} onOpenChange={setShowAddGeofenceDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => resetGeofenceForm()}>
                    <Plus className="mr-2" size={16} />
                    Add Geofence
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center">
                      <Zap className="mr-2" size={20} />
                      {editingGeofence ? 'Edit Geofence Zone' : 'Tambah Geofence Zone'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="geofence-name">Nama Zona</Label>
                      <Input
                        id="geofence-name"
                        placeholder="Contoh: RS Gatot Soebroto"
                        value={newGeofence.name}
                        onChange={(e) => setNewGeofence(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="geofence-lat">Latitude</Label>
                        <Input
                          id="geofence-lat"
                          placeholder="-7.773789"
                          value={newGeofence.latitude}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, latitude: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="geofence-lng">Longitude</Label>
                        <Input
                          id="geofence-lng"
                          placeholder="110.425888"
                          value={newGeofence.longitude}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, longitude: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="geofence-radius">Radius (meter)</Label>
                        <Input
                          id="geofence-radius"
                          placeholder="500"
                          value={newGeofence.radius}
                          onChange={(e) => setNewGeofence(prev => ({ ...prev, radius: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="geofence-type">Tipe Zona</Label>
                        <Select value={newGeofence.type} onValueChange={(value: 'hospital' | 'danger' | 'restricted') => setNewGeofence(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hospital">🏥 Hospital</SelectItem>
                            <SelectItem value="danger">⚠️ Danger Zone</SelectItem>
                            <SelectItem value="restricted">🚫 Restricted</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="geofence-alerts"
                        checked={newGeofence.alerts}
                        onChange={(e) => setNewGeofence(prev => ({ ...prev, alerts: e.target.checked }))}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary"
                      />
                      <Label htmlFor="geofence-alerts">Aktifkan alert untuk zona ini</Label>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddGeofenceDialog(false)}>
                        <X className="mr-2" size={16} />
                        Batal
                      </Button>
                      <Button onClick={addGeofenceZone}>
                        <Zap className="mr-2" size={16} />
                        {editingGeofence ? 'Update' : 'Tambah'} Zona
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🚑 All Ambulances</SelectItem>
                <SelectItem value="active">🟢 Active</SelectItem>
                <SelectItem value="idle">🔵 Standby</SelectItem>
                <SelectItem value="maintenance">🔴 Maintenance</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant={showGeofences ? "default" : "outline"}
              onClick={() => setShowGeofences(!showGeofences)}
              className="w-full"
            >
              {showGeofences ? <EyeOff className="mr-2" size={16} /> : <Eye className="mr-2" size={16} />}
              {showGeofences ? 'Sembunyikan' : 'Tampilkan'} Geofences
            </Button>
            
            <div className="flex items-center space-x-2 bg-blue-50 p-2 rounded-lg">
              <Users size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{filteredAmbulances.length} Unit Aktif</span>
            </div>
            
            <div className="flex items-center space-x-2 bg-red-50 p-2 rounded-lg">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="text-sm font-medium text-red-800">{trafficAlerts.length} Traffic Alerts</span>
            </div>

            <div className="bg-green-50 p-2 rounded-lg">
              <div className="text-xs font-medium text-green-800">🏥 RSPAU Yogyakarta</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="h-[500px] rounded-lg overflow-hidden">
                <RSPAURoutingMap 
                  height="500px"
                  onAmbulanceSelect={(ambulanceId) => setSelectedAmbulance(ambulanceId)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* Ambulance List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Ambulance Fleet ({filteredAmbulances.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {filteredAmbulances.map((ambulance, index) => {
                const status = ambulance.status || 'idle';
                const isActive = ['active', 'dispatched', 'en_route'].includes(status);
                const isIdle = ['idle', 'available'].includes(status) || !status;
                const distanceToRSPAU = getDistanceToRSPAU(ambulance);
                const etaToRSPAU = getETAToRSPAU(ambulance);
                
                return (
                  <div
                    key={ambulance.ambulance_id || `ambulance-${index}`}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAmbulance === (ambulance.ambulance_id || `ambulance-${index}`) 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedAmbulance(ambulance.ambulance_id || `ambulance-${index}`)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isActive ? 'bg-green-500' :
                          isIdle ? 'bg-blue-500' : 'bg-orange-500'
                        }`}></div>
                        <span className="font-medium text-sm">🚑 {ambulance.ambulance_id || `AMB-${index + 1}`}</span>
                      </div>
                      <Badge variant={
                        isActive ? 'default' :
                        isIdle ? 'secondary' : 'destructive'
                      } className="text-xs">
                        {status}
                      </Badge>
                    </div>
                    
                    {/* Distance to RSPAU - Prominent Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mb-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-blue-700 font-medium">📍 Jarak ke RSPAU (YK):</div>
                <div className="text-sm font-bold text-blue-800">
                  {distanceToRSPAU || 'N/A'}
                </div>
              </div>
                      {etaToRSPAU && (
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-xs text-blue-600">⏱️ ETA:</div>
                          <div className="text-xs font-medium text-blue-700">
                            {etaToRSPAU}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>🚗 Kecepatan: {ambulance.speed || 0} km/h</div>
                      <div>🕐 Update: {ambulance.timestamp ? new Date(ambulance.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}</div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      📍 Koordinat: {ambulance.latitude?.toFixed(4) || '0.0000'}, {ambulance.longitude?.toFixed(4) || '0.0000'}
                    </div>
                  </div>
                );
              })}
              
              {filteredAmbulances.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Truck className="mx-auto mb-2" size={24} />
                  <p className="text-sm">Tidak ada ambulans aktif</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Traffic Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <AlertTriangle className="mr-2" size={16} />
                Traffic Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-48 overflow-y-auto">
              {trafficAlerts.map((alert) => (
                <div key={alert.id} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{alert.location}</span>
                    <Badge variant={
                      alert.severity === 'high' ? 'destructive' :
                      alert.severity === 'medium' ? 'default' : 'secondary'
                    } className="text-xs">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.timestamp.toLocaleTimeString('id-ID')}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Geofence Zones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center">
                  <Navigation className="mr-2" size={16} />
                  Geofence Zones ({geofenceZones.length})
                </div>
                <Badge variant="outline" className={showGeofences ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}>
                  {showGeofences ? "Aktif" : "Tersembunyi"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-64 overflow-y-auto">
              {geofenceZones.map((zone) => (
                <div key={zone.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{zone.name}</span>
                      <Badge variant={
                        zone.type === 'hospital' ? 'default' :
                        zone.type === 'danger' ? 'destructive' : 'secondary'
                      } className="text-xs">
                        {zone.type === 'hospital' ? '🏥' : zone.type === 'danger' ? '⚠️' : '🚫'} {zone.type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => editGeofence(zone)}
                        className="h-6 w-6 p-0"
                      >
                        <Edit size={12} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteGeofence(zone.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                    <div>📍 Radius: {zone.radius}m</div>
                    <div>📍 Koordinat: {zone.center[0].toFixed(4)}, {zone.center[1].toFixed(4)}</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={zone.alerts}
                          onChange={(e) => {
                            setGeofenceZones(prev => 
                              prev.map(z => 
                                z.id === zone.id 
                                  ? { ...z, alerts: e.target.checked }
                                  : z
                              )
                            );
                            toast({
                              title: zone.alerts ? "🔕 Alert Dinonaktifkan" : "🔔 Alert Diaktifkan",
                              description: `Alert untuk zona ${zone.name} ${e.target.checked ? 'diaktifkan' : 'dinonaktifkan'}`,
                            });
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-6 h-3 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[1px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-2 after:w-2 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                      <span className="text-xs text-muted-foreground">
                        {zone.alerts ? "🔔 Alert Aktif" : "🔕 Alert Nonaktif"}
                      </span>
                    </div>
                    
                    {showGeofences && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Tampil di peta
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {geofenceZones.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Navigation className="mx-auto mb-2" size={24} />
                  <p className="text-sm">Belum ada zona geofence</p>
                  <p className="text-xs">Klik "Add Geofence" untuk menambah zona</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMapsMonitoring;