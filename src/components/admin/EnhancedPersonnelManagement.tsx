import React, { useState, useEffect } from 'react';
import { Users, Calendar, Clock, UserCheck, UserX, Plus, Filter, Download, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePersonnel } from '@/hooks/usePersonnel';
import { useToast } from '@/hooks/use-toast';

interface ShiftSchedule {
  id: string;
  personnelId: string;
  date: string;
  shift: 'pagi' | 'siang' | 'malam';
  status: 'scheduled' | 'confirmed' | 'absent';
  startTime: string;
  endTime: string;
}

interface PersonnelAvailability {
  personnelId: string;
  status: 'available' | 'busy' | 'off-duty' | 'emergency';
  lastUpdate: Date;
  location?: string;
  currentAssignment?: string;
}

const EnhancedPersonnelManagement = () => {
  const { personnel, loading } = usePersonnel();
  const { toast } = useToast();
  
  const [selectedPersonnel, setSelectedPersonnel] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterShift, setFilterShift] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [shiftSchedules, setShiftSchedules] = useState<ShiftSchedule[]>([]);
  const [availabilityStatus, setAvailabilityStatus] = useState<PersonnelAvailability[]>([]);

  // Generate sample shift schedules
  useEffect(() => {
    const generateShiftSchedules = () => {
      const schedules: ShiftSchedule[] = [];
      const today = new Date();
      
      personnel.forEach(person => {
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          
          const shifts: ('pagi' | 'siang' | 'malam')[] = ['pagi', 'siang', 'malam'];
          const assignedShift = shifts[Math.floor(Math.random() * shifts.length)];
          
          schedules.push({
            id: `${person.id}-${date.toISOString().split('T')[0]}-${assignedShift}`,
            personnelId: person.id,
            date: date.toISOString().split('T')[0],
            shift: assignedShift,
            status: Math.random() > 0.1 ? 'confirmed' : 'scheduled',
            startTime: assignedShift === 'pagi' ? '07:00' : assignedShift === 'siang' ? '15:00' : '23:00',
            endTime: assignedShift === 'pagi' ? '15:00' : assignedShift === 'siang' ? '23:00' : '07:00'
          });
        }
      });
      
      setShiftSchedules(schedules);
    };

    if (personnel.length > 0) {
      generateShiftSchedules();
    }
  }, [personnel]);

  // Generate sample availability status
  useEffect(() => {
    const generateAvailability = () => {
      const availability: PersonnelAvailability[] = personnel.map(person => ({
        personnelId: person.id,
        status: ['available', 'busy', 'off-duty'][Math.floor(Math.random() * 3)] as 'available' | 'busy' | 'off-duty',
        lastUpdate: new Date(),
        location: ['RS Efram', 'Ambulans 01', 'Base Camp', 'Field'][Math.floor(Math.random() * 4)],
        currentAssignment: Math.random() > 0.5 ? 'Emergency Response Team A' : undefined
      }));
      
      setAvailabilityStatus(availability);
    };

    if (personnel.length > 0) {
      generateAvailability();
      
      // Update availability every 30 seconds
      const interval = setInterval(generateAvailability, 30000);
      return () => clearInterval(interval);
    }
  }, [personnel]);

  const getPersonnelAvailability = (personnelId: string) => {
    return availabilityStatus.find(a => a.personnelId === personnelId);
  };

  const getTodayShift = (personnelId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return shiftSchedules.find(s => s.personnelId === personnelId && s.date === today);
  };

  const updateAvailabilityStatus = (personnelId: string, status: PersonnelAvailability['status']) => {
    setAvailabilityStatus(prev => 
      prev.map(a => 
        a.personnelId === personnelId 
          ? { ...a, status, lastUpdate: new Date() }
          : a
      )
    );
    
    toast({
      title: "✅ Status Updated",
      description: `Personnel availability status changed to ${status}`,
    });
  };

  const filteredPersonnel = personnel.filter(person => {
    const availability = getPersonnelAvailability(person.id);
    const matchesStatus = filterStatus === 'all' || availability?.status === filterStatus;
    const todayShift = getTodayShift(person.id);
    const matchesShift = filterShift === 'all' || todayShift?.shift === filterShift;
    const matchesSearch = searchTerm === '' || 
      person.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.jabatan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.pangkat.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesShift && matchesSearch;
  });

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'busy': return 'destructive';
      case 'off-duty': return 'secondary';
      case 'emergency': return 'outline';
      default: return 'secondary';
    }
  };

  const getShiftColor = (shift: string) => {
    switch (shift) {
      case 'pagi': return 'default';
      case 'siang': return 'secondary';
      case 'malam': return 'outline';
      default: return 'secondary';
    }
  };

  const exportPersonnelData = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Rank,Position,Unit,Phone,Availability,Current Shift\n" +
      filteredPersonnel.map(p => {
        const availability = getPersonnelAvailability(p.id);
        const todayShift = getTodayShift(p.id);
        return `${p.nama},${p.pangkat},${p.jabatan},${p.satuan},${p.no_telepon},${availability?.status || 'unknown'},${todayShift?.shift || 'none'}`;
      }).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `personnel_report_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading personnel data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2" size={20} />
              Enhanced Personnel Management
            </div>
            <div className="flex space-x-2">
              <Button onClick={exportPersonnelData} variant="outline" size="sm">
                <Download className="mr-2" size={16} />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Plus className="mr-2" size={16} />
                Add Personnel
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search personnel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="off-duty">Off Duty</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterShift} onValueChange={setFilterShift}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                <SelectItem value="pagi">Morning</SelectItem>
                <SelectItem value="siang">Afternoon</SelectItem>
                <SelectItem value="malam">Night</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground flex items-center">
              <Filter className="mr-2" size={16} />
              {filteredPersonnel.length} of {personnel.length}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Available: {availabilityStatus.filter(a => a.status === 'available').length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personnel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPersonnel.map((person) => {
          const availability = getPersonnelAvailability(person.id);
          const todayShift = getTodayShift(person.id);
          
          return (
            <Card key={person.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{person.nama}</h3>
                    <p className="text-sm text-muted-foreground">{person.pangkat}</p>
                    <p className="text-sm text-muted-foreground">{person.jabatan}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getAvailabilityColor(availability?.status || 'unknown')}>
                      {availability?.status || 'unknown'}
                    </Badge>
                    {todayShift && (
                      <Badge variant={getShiftColor(todayShift.shift)} className="block">
                        {todayShift.shift}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Unit:</span>
                    <span>{person.satuan}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{person.no_telepon}</span>
                  </div>
                  {availability?.location && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Location:</span>
                      <span>{availability.location}</span>
                    </div>
                  )}
                  {todayShift && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Shift Time:</span>
                      <span>{todayShift.startTime} - {todayShift.endTime}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex space-x-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedPersonnel(person)}
                      >
                        Details
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  
                  <Select 
                    value={availability?.status || 'available'} 
                    onValueChange={(status) => updateAvailabilityStatus(person.id, status as PersonnelAvailability['status'])}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="busy">Busy</SelectItem>
                      <SelectItem value="off-duty">Off Duty</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Personnel Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Users className="mr-2" size={20} />
              Personnel Details - {selectedPersonnel?.nama}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPersonnel && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Full Name:</strong> {selectedPersonnel.nama}</p>
                      <p><strong>Rank:</strong> {selectedPersonnel.pangkat}</p>
                      <p><strong>NRP:</strong> {selectedPersonnel.nrp}</p>
                      <p><strong>Position:</strong> {selectedPersonnel.jabatan}</p>
                      <p><strong>Unit:</strong> {selectedPersonnel.satuan}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Phone:</strong> {selectedPersonnel.no_telepon}</p>
                      <p><strong>Address:</strong> {selectedPersonnel.alamat}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <h4 className="font-medium">Weekly Schedule</h4>
                <div className="space-y-2">
                  {shiftSchedules
                    .filter(s => s.personnelId === selectedPersonnel.id)
                    .slice(0, 7)
                    .map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(schedule.date).toLocaleDateString('id-ID', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                          <p className="text-sm text-muted-foreground">{schedule.startTime} - {schedule.endTime}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getShiftColor(schedule.shift)} className="mb-1">
                            {schedule.shift}
                          </Badge>
                          <p className="text-xs text-muted-foreground">{schedule.status}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </TabsContent>
              
              <TabsContent value="availability" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Current Status</h4>
                    <div className="space-y-2">
                      {(() => {
                        const availability = getPersonnelAvailability(selectedPersonnel.id);
                        return availability ? (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                              <Badge variant={getAvailabilityColor(availability.status)}>
                                {availability.status}
                              </Badge>
                            </div>
                            <p><strong>Last Update:</strong> {availability.lastUpdate.toLocaleString('id-ID')}</p>
                            {availability.location && <p><strong>Location:</strong> {availability.location}</p>}
                            {availability.currentAssignment && <p><strong>Assignment:</strong> {availability.currentAssignment}</p>}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No availability data</p>
                        );
                      })()}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Today's Shift</h4>
                    {(() => {
                      const todayShift = getTodayShift(selectedPersonnel.id);
                      return todayShift ? (
                        <div className="space-y-2 text-sm">
                          <Badge variant={getShiftColor(todayShift.shift)}>
                            {todayShift.shift}
                          </Badge>
                          <p><strong>Time:</strong> {todayShift.startTime} - {todayShift.endTime}</p>
                          <p><strong>Status:</strong> {todayShift.status}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No shift today</p>
                      );
                    })()}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedPersonnelManagement;