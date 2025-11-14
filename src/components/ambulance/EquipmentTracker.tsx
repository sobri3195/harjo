import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Fuel, Heart, Wrench, Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  ambulance_id: string;
  equipment_type: 'fuel' | 'oxygen' | 'defibrillator' | 'stretcher' | 'medical_bag' | 'other';
  equipment_name: string;
  current_level: number;
  max_capacity: number;
  unit: string;
  status: 'operational' | 'maintenance' | 'broken' | 'low' | 'empty';
  last_checked_at: string;
  last_checked_by: string;
  notes?: string;
}

const EquipmentTracker: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [selectedAmbulance, setSelectedAmbulance] = useState<string>('AMB-001');
  const [loading, setLoading] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const { toast } = useToast();

  const ambulanceList = ['AMB-001', 'AMB-002', 'AMB-003'];

  useEffect(() => {
    fetchEquipment();
  }, [selectedAmbulance]);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_tracking')
        .select('*')
        .eq('ambulance_id', selectedAmbulance)
        .order('equipment_type', { ascending: true });

      if (error) throw error;
      setEquipmentList(data as Equipment[] || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data peralatan",
        variant: "destructive",
      });
    }
  };

  const updateEquipment = async (equipment: Equipment) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('equipment_tracking')
        .update({
          current_level: equipment.current_level,
          status: equipment.status,
          last_checked_at: new Date().toISOString(),
          last_checked_by: equipment.last_checked_by,
          notes: equipment.notes,
        })
        .eq('id', equipment.id);

      if (error) throw error;

      await fetchEquipment();
      setEditingEquipment(null);

      toast({
        title: "✅ Update Berhasil",
        description: `${equipment.equipment_name} berhasil diupdate`,
      });

    } catch (error) {
      console.error('Error updating equipment:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate peralatan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'fuel':
        return <Fuel className="w-5 h-5" />;
      case 'oxygen':
        return <Package className="w-5 h-5" />;
      case 'defibrillator':
        return <Heart className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'maintenance':
        return 'bg-yellow-500';
      case 'broken':
        return 'bg-red-500';
      case 'low':
        return 'bg-orange-500';
      case 'empty':
        return 'bg-red-600';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'operational':
        return 'Operasional';
      case 'maintenance':
        return 'Maintenance';
      case 'broken':
        return 'Rusak';
      case 'low':
        return 'Rendah';
      case 'empty':
        return 'Kosong';
      default:
        return status;
    }
  };

  const getPercentage = (current: number, max: number) => {
    return max > 0 ? (current / max) * 100 : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Ambulance Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <span>Equipment Tracker</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="ambulance-select">Pilih Ambulans</Label>
              <Select value={selectedAmbulance} onValueChange={setSelectedAmbulance}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ambulanceList.map((ambulance) => (
                    <SelectItem key={ambulance} value={ambulance}>
                      {ambulance}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment List */}
      <div className="grid gap-4">
        {equipmentList.map((equipment) => (
          <Card key={equipment.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-blue-600">
                    {getEquipmentIcon(equipment.equipment_type)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{equipment.equipment_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {equipment.current_level} / {equipment.max_capacity} {equipment.unit}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(equipment.status)} text-white`}>
                    {getStatusLabel(equipment.status)}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingEquipment(equipment)}
                  >
                    Update
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-3">
                <Progress 
                  value={getPercentage(equipment.current_level, equipment.max_capacity)} 
                  className="h-2"
                />
                <div className="flex justify-between items-center mt-1 text-xs text-muted-foreground">
                  <span>{getPercentage(equipment.current_level, equipment.max_capacity).toFixed(1)}%</span>
                  <span>
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(equipment.last_checked_at).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Warning indicators */}
              {equipment.status === 'low' || equipment.status === 'empty' && (
                <div className="mt-2 flex items-center space-x-1 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Perlu segera diisi ulang</span>
                </div>
              )}
              
              {equipment.status === 'broken' && (
                <div className="mt-2 flex items-center space-x-1 text-red-600 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Peralatan rusak - perlu perbaikan</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Equipment Modal */}
      {editingEquipment && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Update {editingEquipment.equipment_name}</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="current-level">Level Saat Ini ({editingEquipment.unit})</Label>
                <Input
                  id="current-level"
                  type="number"
                  value={editingEquipment.current_level}
                  onChange={(e) => setEditingEquipment({
                    ...editingEquipment,
                    current_level: parseFloat(e.target.value) || 0
                  })}
                  max={editingEquipment.max_capacity}
                  min={0}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={editingEquipment.status} 
                  onValueChange={(value: any) => setEditingEquipment({
                    ...editingEquipment,
                    status: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operational">Operasional</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="broken">Rusak</SelectItem>
                    <SelectItem value="low">Rendah</SelectItem>
                    <SelectItem value="empty">Kosong</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="checked-by">Diperiksa Oleh</Label>
                <Input
                  id="checked-by"
                  value={editingEquipment.last_checked_by}
                  onChange={(e) => setEditingEquipment({
                    ...editingEquipment,
                    last_checked_by: e.target.value
                  })}
                />
              </div>

              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Input
                  id="notes"
                  value={editingEquipment.notes || ''}
                  onChange={(e) => setEditingEquipment({
                    ...editingEquipment,
                    notes: e.target.value
                  })}
                  placeholder="Catatan tambahan..."
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => updateEquipment(editingEquipment)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingEquipment(null)}
                  className="flex-1"
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EquipmentTracker;