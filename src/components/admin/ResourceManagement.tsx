import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Package, Calendar, AlertTriangle, Plus, Edit, Trash2, Clock, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  item_name: string;
  category: 'medicine' | 'medical_equipment' | 'consumables' | 'vehicle_parts';
  current_stock: number;
  minimum_stock: number;
  unit: string;
  location?: string;
  expiry_date?: string;
  supplier?: string;
  cost_per_unit?: number;
  last_updated_by: string;
  created_at: string;
  updated_at: string;
}

interface MaintenanceSchedule {
  id: string;
  item_type: 'ambulance' | 'equipment' | 'facility';
  item_name: string;
  item_identifier: string;
  maintenance_type: 'routine' | 'preventive' | 'repair' | 'inspection';
  scheduled_date: string;
  completed_date?: string;
  assigned_to?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  description?: string;
  cost?: number;
  notes?: string;
}

const ResourceManagement: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([]);
  const [activeTab, setActiveTab] = useState('inventory');
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
    fetchMaintenanceSchedules();
  }, []);

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('resource_inventory')
        .select('*')
        .order('item_name', { ascending: true });

      if (error) throw error;
      setInventory(data as InventoryItem[] || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchMaintenanceSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select('*')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      setMaintenanceSchedules(data as MaintenanceSchedule[] || []);
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('resource_inventory')
        .insert([item]);

      if (error) throw error;

      await fetchInventory();
      setShowAddInventory(false);

      toast({
        title: "✅ Item Ditambahkan",
        description: `${item.item_name} berhasil ditambahkan ke inventory`,
      });

    } catch (error) {
      console.error('Error adding inventory item:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan item ke inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addMaintenanceSchedule = async (schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('maintenance_schedules')
        .insert([schedule]);

      if (error) throw error;

      await fetchMaintenanceSchedules();
      setShowAddMaintenance(false);

      toast({
        title: "✅ Jadwal Ditambahkan",
        description: `Maintenance ${schedule.item_name} berhasil dijadwalkan`,
      });

    } catch (error) {
      console.error('Error adding maintenance schedule:', error);
      toast({
        title: "Error",
        description: "Gagal menambahkan jadwal maintenance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMaintenanceStatus = async (id: string, status: MaintenanceSchedule['status']) => {
    try {
      const updateData: any = { status };
      if (status === 'completed') {
        updateData.completed_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('maintenance_schedules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await fetchMaintenanceSchedules();

      toast({
        title: "✅ Status Updated",
        description: "Status maintenance berhasil diupdate",
      });

    } catch (error) {
      console.error('Error updating maintenance status:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status maintenance",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medicine': return '💊';
      case 'medical_equipment': return '🏥';
      case 'consumables': return '📦';
      case 'vehicle_parts': return '🔧';
      default: return '📋';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'medicine': return 'Obat-obatan';
      case 'medical_equipment': return 'Alat Medis';
      case 'consumables': return 'Consumables';
      case 'vehicle_parts': return 'Spare Part';
      default: return category;
    }
  };

  const getStockStatus = (current: number, minimum: number) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 50) return 'critical';
    if (percentage <= 100) return 'low';
    return 'normal';
  };

  const getStockColor = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'low': return 'bg-orange-500';
      default: return 'bg-green-500';
    }
  };

  const lowStockItems = inventory.filter(item => getStockStatus(item.current_stock, item.minimum_stock) !== 'normal');
  const upcomingMaintenance = maintenanceSchedules.filter(schedule => {
    const scheduleDate = new Date(schedule.scheduled_date);
    const today = new Date();
    const daysDiff = Math.ceil((scheduleDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff <= 7 && schedule.status === 'scheduled';
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Resource Management</span>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Alert Section */}
      {(lowStockItems.length > 0 || upcomingMaintenance.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockItems.length > 0 && (
            <Card className="border-orange-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2 text-orange-600">
                  <TrendingDown className="w-4 h-4" />
                  <span>Stock Rendah ({lowStockItems.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <span>{item.item_name}</span>
                      <Badge variant="outline" className="text-orange-600">
                        {item.current_stock} {item.unit}
                      </Badge>
                    </div>
                  ))}
                  {lowStockItems.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{lowStockItems.length - 3} item lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {upcomingMaintenance.length > 0 && (
            <Card className="border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center space-x-2 text-blue-600">
                  <Calendar className="w-4 h-4" />
                  <span>Maintenance Minggu Ini ({upcomingMaintenance.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {upcomingMaintenance.slice(0, 3).map((schedule) => (
                    <div key={schedule.id} className="flex justify-between items-center text-sm">
                      <span>{schedule.item_name}</span>
                      <Badge variant="outline" className="text-blue-600">
                        {new Date(schedule.scheduled_date).toLocaleDateString('id-ID')}
                      </Badge>
                    </div>
                  ))}
                  {upcomingMaintenance.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{upcomingMaintenance.length - 3} jadwal lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Schedule</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Resource Inventory</h3>
            <Button onClick={() => setShowAddInventory(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Item
            </Button>
          </div>

          <div className="grid gap-4">
            {inventory.map((item) => {
              const stockStatus = getStockStatus(item.current_stock, item.minimum_stock);
              const stockPercentage = (item.current_stock / item.minimum_stock) * 100;
              
              return (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{item.item_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {getCategoryLabel(item.category)} • {item.location}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStockColor(stockStatus)} text-white`}>
                            {item.current_stock} / {item.minimum_stock} {item.unit}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Min: {item.minimum_stock} {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress value={Math.min(stockPercentage, 100)} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>{stockPercentage.toFixed(0)}% dari minimum</span>
                        {item.expiry_date && (
                          <span>
                            Exp: {new Date(item.expiry_date).toLocaleDateString('id-ID')}
                          </span>
                        )}
                      </div>
                    </div>

                    {stockStatus !== 'normal' && (
                      <div className="mt-2 flex items-center space-x-1 text-sm">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-orange-600">
                          {stockStatus === 'critical' ? 'Stock sangat rendah!' : 'Stock rendah'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Maintenance Schedule</h3>
            <Button onClick={() => setShowAddMaintenance(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Jadwal
            </Button>
          </div>

          <div className="grid gap-4">
            {maintenanceSchedules.map((schedule) => (
              <Card key={schedule.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{schedule.item_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {schedule.item_type} • {schedule.maintenance_type}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {schedule.item_identifier}
                      </p>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge 
                        className={
                          schedule.status === 'completed' ? 'bg-green-500' :
                          schedule.status === 'in_progress' ? 'bg-blue-500' :
                          schedule.status === 'cancelled' ? 'bg-red-500' :
                          'bg-orange-500'
                        }
                      >
                        {schedule.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(schedule.scheduled_date).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {schedule.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {schedule.description}
                    </p>
                  )}

                  {schedule.assigned_to && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Assigned to:</span> {schedule.assigned_to}
                    </p>
                  )}

                  {schedule.status === 'scheduled' && (
                    <div className="flex space-x-2 mt-3">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateMaintenanceStatus(schedule.id, 'in_progress')}
                      >
                        Mulai
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => updateMaintenanceStatus(schedule.id, 'completed')}
                      >
                        Selesai
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Inventory Modal */}
      {showAddInventory && (
        <AddInventoryModal
          onAdd={addInventoryItem}
          onClose={() => setShowAddInventory(false)}
          loading={loading}
        />
      )}

      {/* Add Maintenance Modal */}
      {showAddMaintenance && (
        <AddMaintenanceModal
          onAdd={addMaintenanceSchedule}
          onClose={() => setShowAddMaintenance(false)}
          loading={loading}
        />
      )}
    </div>
  );
};

// Add Inventory Modal Component
const AddInventoryModal: React.FC<{
  onAdd: (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ onAdd, onClose, loading }) => {
  const [formData, setFormData] = useState({
    item_name: '',
    category: 'medicine' as InventoryItem['category'],
    current_stock: 0,
    minimum_stock: 0,
    unit: '',
    location: '',
    expiry_date: '',
    supplier: '',
    cost_per_unit: 0,
    last_updated_by: 'Admin',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Tambah Item Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="item_name">Nama Item</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select value={formData.category} onValueChange={(value: any) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medicine">Obat-obatan</SelectItem>
                  <SelectItem value="medical_equipment">Alat Medis</SelectItem>
                  <SelectItem value="consumables">Consumables</SelectItem>
                  <SelectItem value="vehicle_parts">Spare Part</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_stock">Stock Saat Ini</Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: parseInt(e.target.value)})}
                  required
                />
              </div>
              <div>
                <Label htmlFor="minimum_stock">Stock Minimum</Label>
                <Input
                  id="minimum_stock"
                  type="number"
                  value={formData.minimum_stock}
                  onChange={(e) => setFormData({...formData, minimum_stock: parseInt(e.target.value)})}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                placeholder="pcs, box, liter, dll"
                required
              />
            </div>

            <div>
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Gudang A1, Ruang Medis, dll"
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// Add Maintenance Modal Component
const AddMaintenanceModal: React.FC<{
  onAdd: (schedule: Omit<MaintenanceSchedule, 'id' | 'created_at' | 'updated_at'>) => void;
  onClose: () => void;
  loading: boolean;
}> = ({ onAdd, onClose, loading }) => {
  const [formData, setFormData] = useState({
    item_type: 'ambulance' as MaintenanceSchedule['item_type'],
    item_name: '',
    item_identifier: '',
    maintenance_type: 'routine' as MaintenanceSchedule['maintenance_type'],
    scheduled_date: '',
    assigned_to: '',
    status: 'scheduled' as MaintenanceSchedule['status'],
    description: '',
    cost: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle>Tambah Jadwal Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="item_type">Tipe Item</Label>
              <Select value={formData.item_type} onValueChange={(value: any) => setFormData({...formData, item_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambulance">Ambulans</SelectItem>
                  <SelectItem value="equipment">Peralatan</SelectItem>
                  <SelectItem value="facility">Fasilitas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="item_name">Nama Item</Label>
              <Input
                id="item_name"
                value={formData.item_name}
                onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="item_identifier">ID/Nomor Item</Label>
              <Input
                id="item_identifier"
                value={formData.item_identifier}
                onChange={(e) => setFormData({...formData, item_identifier: e.target.value})}
                placeholder="AMB-001, EQ-123, dll"
                required
              />
            </div>

            <div>
              <Label htmlFor="maintenance_type">Jenis Maintenance</Label>
              <Select value={formData.maintenance_type} onValueChange={(value: any) => setFormData({...formData, maintenance_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="routine">Routine</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="scheduled_date">Tanggal Jadwal</Label>
              <Input
                id="scheduled_date"
                type="date"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({...formData, scheduled_date: e.target.value})}
                required
              />
            </div>

            <div>
              <Label htmlFor="assigned_to">Assigned To</Label>
              <Input
                id="assigned_to"
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                placeholder="Nama teknisi"
              />
            </div>

            <div>
              <Label htmlFor="description">Deskripsi</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detail maintenance yang akan dilakukan"
              />
            </div>

            <div className="flex space-x-2">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceManagement;