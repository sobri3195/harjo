import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Wrench, AlertTriangle, CheckCircle, Edit3, Save, X, Fuel, Activity } from 'lucide-react';
import { useAmbulanceStatus } from '@/hooks/useAmbulanceStatus';
import { useToast } from '@/hooks/use-toast';

const EquipmentManagement = () => {
  const { equipment, updateEquipment, loading, refetch } = useAmbulanceStatus();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    current_level: '',
    status: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({
      current_level: item.current_level?.toString() || '',
      status: item.status,
      notes: item.notes || ''
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    try {
      await updateEquipment(editingId, {
        current_level: parseFloat(editForm.current_level) || 0,
        status: editForm.status,
        notes: editForm.notes,
        last_checked_by: 'Admin',
        last_checked_at: new Date().toISOString()
      });
      
      setEditingId(null);
      toast({
        title: "Berhasil",
        description: "Status peralatan berhasil diperbarui",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memperbarui status peralatan",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ current_level: '', status: '', notes: '' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'default';
      case 'maintenance': return 'destructive';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return CheckCircle;
      case 'maintenance': return Wrench;
      case 'low': return AlertTriangle;
      default: return Activity;
    }
  };

  const groupedEquipment = equipment.reduce((acc: any, item) => {
    if (!acc[item.ambulance_id]) {
      acc[item.ambulance_id] = [];
    }
    acc[item.ambulance_id].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Peralatan</h2>
        <Button onClick={refetch} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {Object.entries(groupedEquipment).map(([ambulanceId, items]: [string, any]) => (
        <Card key={ambulanceId} className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {ambulanceId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item: any) => {
                const StatusIcon = getStatusIcon(item.status);
                const isEditing = editingId === item.id;
                
                return (
                  <Card key={item.id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-sm">{item.equipment_name}</h4>
                          <p className="text-xs text-muted-foreground capitalize">{item.equipment_type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(item.status)} className="text-xs">
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {item.status}
                          </Badge>
                          {!isEditing && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium">Level/Jumlah</label>
                            <Input
                              type="number"
                              value={editForm.current_level}
                              onChange={(e) => setEditForm({...editForm, current_level: e.target.value})}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium">Status</label>
                            <Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value})}>
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="operational">Operational</SelectItem>
                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                <SelectItem value="low">Low Stock</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-xs font-medium">Catatan</label>
                            <Input
                              value={editForm.notes}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              className="h-8"
                              placeholder="Catatan tambahan..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                              <Save className="h-3 w-3 mr-1" />
                              Simpan
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancel}>
                              <X className="h-3 w-3 mr-1" />
                              Batal
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">
                              {item.current_level} / {item.max_capacity} {item.unit}
                            </span>
                            <span className="text-xs font-medium">
                              {Math.round((item.current_level / item.max_capacity) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(item.current_level / item.max_capacity) * 100} 
                            className="h-2"
                          />
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-2">{item.notes}</p>
                          )}
                          <div className="text-xs text-muted-foreground border-t pt-2 mt-2">
                            Terakhir cek: {new Date(item.last_checked_at).toLocaleString('id-ID')}
                            {item.last_checked_by && (
                              <span> oleh {item.last_checked_by}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {equipment.length === 0 && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">Tidak ada data peralatan</h3>
              <p className="text-muted-foreground">Data peralatan akan muncul di sini</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EquipmentManagement;