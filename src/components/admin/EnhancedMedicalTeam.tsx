import React, { useState, useEffect } from 'react';
import { UserPlus, Activity, Star, Clock, Phone, MapPin, Award, TrendingUp, Filter, Plus, X, Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useSupabaseMedicalTeam } from '@/hooks/useSupabaseMedicalTeam';
import { useToast } from '@/hooks/use-toast';

interface MedicalTeamPerformance {
  id: string;
  successfulCases: number;
  averageResponseTime: number;
  patientSatisfactionScore: number;
  monthlyHours: number;
  specializations: string[];
  certifications: string[];
  lastPerformanceReview: Date;
  currentAssignment?: string;
}

interface TeamAvailability {
  id: string;
  status: 'available' | 'busy' | 'off-duty' | 'on-call';
  currentLocation?: string;
  shiftEnd?: Date;
  specialtyMatch?: number; // 0-100% match for current emergency
  responseTime?: number; // estimated response time in minutes
}

const EnhancedMedicalTeam = () => {
  const { medicalTeam, loading, createMedicalTeamMember, updateMedicalTeamMember } = useSupabaseMedicalTeam();
  const { toast } = useToast();
  
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [performanceData, setPerformanceData] = useState<MedicalTeamPerformance[]>([]);
  const [availabilityData, setAvailabilityData] = useState<TeamAvailability[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state for adding new member
  const [newMemberForm, setNewMemberForm] = useState({
    nama: '',
    spesialisasi: '',
    no_lisensi: '',
    no_telepon: '',
    alamat: '',
    jadwal_piket: '',
    status: 'aktif' as 'aktif' | 'tidak_aktif'
  });

  // Generate performance metrics
  useEffect(() => {
    const generatePerformanceData = () => {
      const performance: MedicalTeamPerformance[] = medicalTeam.map(member => ({
        id: member.id,
        successfulCases: Math.floor(Math.random() * 50) + 20,
        averageResponseTime: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
        patientSatisfactionScore: Math.floor(Math.random() * 20) + 80, // 80-100%
        monthlyHours: Math.floor(Math.random() * 40) + 160, // 160-200 hours
        specializations: member.spesialisasi.split(',').map(s => s.trim()),
        certifications: ['CPR', 'ACLS', 'BLS', 'PALS'].filter(() => Math.random() > 0.5),
        lastPerformanceReview: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        currentAssignment: Math.random() > 0.6 ? 'Emergency Response Team A' : undefined
      }));
      
      setPerformanceData(performance);
    };

    if (medicalTeam.length > 0) {
      generatePerformanceData();
    }
  }, [medicalTeam]);

  // Generate availability data
  useEffect(() => {
    const generateAvailabilityData = () => {
      const availability: TeamAvailability[] = medicalTeam.map(member => {
        const status = ['available', 'busy', 'off-duty', 'on-call'][Math.floor(Math.random() * 4)] as TeamAvailability['status'];
        return {
          id: member.id,
          status,
          currentLocation: status !== 'off-duty' ? ['RS Efram', 'Ambulans 01', 'Field Unit', 'Base'][Math.floor(Math.random() * 4)] : undefined,
          shiftEnd: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000),
          specialtyMatch: Math.floor(Math.random() * 40) + 60, // 60-100% specialty match
          responseTime: Math.floor(Math.random() * 15) + 5 // 5-20 minutes
        };
      });
      
      setAvailabilityData(availability);
    };

    if (medicalTeam.length > 0) {
      generateAvailabilityData();
      
      // Update availability every 30 seconds
      const interval = setInterval(generateAvailabilityData, 30000);
      return () => clearInterval(interval);
    }
  }, [medicalTeam]);

  const getMemberPerformance = (memberId: string) => {
    return performanceData.find(p => p.id === memberId);
  };

  const getMemberAvailability = (memberId: string) => {
    return availabilityData.find(a => a.id === memberId);
  };

  const updateMemberStatus = async (memberId: string, status: 'aktif' | 'tidak_aktif') => {
    try {
      await updateMedicalTeamMember(memberId, { status });
      toast({
        title: "✅ Status Updated",
        description: "Medical team member status has been updated",
      });
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const resetNewMemberForm = () => {
    setNewMemberForm({
      nama: '',
      spesialisasi: '',
      no_lisensi: '',
      no_telepon: '',
      alamat: '',
      jadwal_piket: '',
      status: 'aktif'
    });
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!newMemberForm.nama.trim()) {
      toast({
        title: "❌ Error",
        description: "Nama tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }
    
    if (!newMemberForm.spesialisasi.trim()) {
      toast({
        title: "❌ Error", 
        description: "Spesialisasi tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }
    
    if (!newMemberForm.no_lisensi.trim()) {
      toast({
        title: "❌ Error",
        description: "Nomor lisensi tidak boleh kosong", 
        variant: "destructive"
      });
      return;
    }
    
    if (!newMemberForm.no_telepon.trim()) {
      toast({
        title: "❌ Error",
        description: "Nomor telepon tidak boleh kosong",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createMedicalTeamMember(newMemberForm);
      toast({
        title: "✅ Berhasil",
        description: `Anggota tim medis ${newMemberForm.nama} berhasil ditambahkan`,
      });
      
      resetNewMemberForm();
      setAddMemberDialogOpen(false);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Gagal menambahkan anggota tim medis",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof newMemberForm, value: string) => {
    setNewMemberForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const filteredTeam = medicalTeam.filter(member => {
    const availability = getMemberAvailability(member.id);
    const matchesStatus = filterStatus === 'all' || availability?.status === filterStatus;
    const matchesSpecialty = filterSpecialty === 'all' || member.spesialisasi.toLowerCase().includes(filterSpecialty.toLowerCase());
    const matchesSearch = searchTerm === '' || 
      member.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.spesialisasi.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSpecialty && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'default';
      case 'busy': return 'destructive';
      case 'off-duty': return 'secondary';
      case 'on-call': return 'outline';
      default: return 'secondary';
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading medical team data...</p>
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
              <UserPlus className="mr-2" size={20} />
              Enhanced Medical Team Management
            </div>
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={resetNewMemberForm}>
                  <Plus className="mr-2" size={16} />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <UserPlus className="mr-2" size={20} />
                    Tambah Anggota Tim Medis
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama" className="text-sm font-medium">
                        Nama Lengkap *
                      </Label>
                      <Input
                        id="nama"
                        placeholder="Dr. John Doe"
                        value={newMemberForm.nama}
                        onChange={(e) => handleInputChange('nama', e.target.value)}
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="spesialisasi" className="text-sm font-medium">
                        Spesialisasi *
                      </Label>
                      <Select 
                        value={newMemberForm.spesialisasi} 
                        onValueChange={(value) => handleInputChange('spesialisasi', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih spesialisasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Dokter Umum">Dokter Umum</SelectItem>
                          <SelectItem value="Dokter Spesialis Jantung">Dokter Spesialis Jantung</SelectItem>
                          <SelectItem value="Dokter Spesialis Bedah">Dokter Spesialis Bedah</SelectItem>
                          <SelectItem value="Dokter Spesialis Anak">Dokter Spesialis Anak</SelectItem>
                          <SelectItem value="Dokter Spesialis Saraf">Dokter Spesialis Saraf</SelectItem>
                          <SelectItem value="Dokter Gigi">Dokter Gigi</SelectItem>
                          <SelectItem value="Perawat">Perawat</SelectItem>
                          <SelectItem value="Perawat ICU">Perawat ICU</SelectItem>
                          <SelectItem value="Perawat UGD">Perawat UGD</SelectItem>
                          <SelectItem value="Paramedis">Paramedis</SelectItem>
                          <SelectItem value="Ahli Anestesi">Ahli Anestesi</SelectItem>
                          <SelectItem value="Radiografer">Radiografer</SelectItem>
                          <SelectItem value="Farmasis">Farmasis</SelectItem>
                          <SelectItem value="Fisioterapis">Fisioterapis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="no_lisensi" className="text-sm font-medium">
                        Nomor Lisensi *
                      </Label>
                      <Input
                        id="no_lisensi"
                        placeholder="STR.12345678"
                        value={newMemberForm.no_lisensi}
                        onChange={(e) => handleInputChange('no_lisensi', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="no_telepon" className="text-sm font-medium">
                        Nomor Telepon *
                      </Label>
                      <Input
                        id="no_telepon"
                        placeholder="08123456789"
                        value={newMemberForm.no_telepon}
                        onChange={(e) => handleInputChange('no_telepon', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="alamat" className="text-sm font-medium">
                      Alamat
                    </Label>
                    <Textarea
                      id="alamat"
                      placeholder="Jl. Contoh No. 123, Jakarta"
                      value={newMemberForm.alamat}
                      onChange={(e) => handleInputChange('alamat', e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jadwal_piket" className="text-sm font-medium">
                        Jadwal Piket
                      </Label>
                      <Select 
                        value={newMemberForm.jadwal_piket} 
                        onValueChange={(value) => handleInputChange('jadwal_piket', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih jadwal piket" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Senin-Jumat (07:00-15:00)">Senin-Jumat (07:00-15:00)</SelectItem>
                          <SelectItem value="Senin-Jumat (15:00-23:00)">Senin-Jumat (15:00-23:00)</SelectItem>
                          <SelectItem value="Senin-Jumat (23:00-07:00)">Senin-Jumat (23:00-07:00)</SelectItem>
                          <SelectItem value="Weekend (07:00-19:00)">Weekend (07:00-19:00)</SelectItem>
                          <SelectItem value="Weekend (19:00-07:00)">Weekend (19:00-07:00)</SelectItem>
                          <SelectItem value="On Call 24/7">On Call 24/7</SelectItem>
                          <SelectItem value="Fleksibel">Fleksibel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select 
                        value={newMemberForm.status} 
                        onValueChange={(value: 'aktif' | 'tidak_aktif') => handleInputChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aktif">Aktif</SelectItem>
                          <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setAddMemberDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      <X className="mr-2" size={16} />
                      Batal
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Menyimpan...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2" size={16} />
                          Simpan
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search team members..."
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
                <SelectItem value="on-call">On Call</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Specialty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specialties</SelectItem>
                <SelectItem value="cardiology">Cardiology</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="trauma">Trauma</SelectItem>
                <SelectItem value="pediatric">Pediatric</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground flex items-center">
              <Filter className="mr-2" size={16} />
              {filteredTeam.length} of {medicalTeam.length}
            </div>
            
            <div className="text-sm text-muted-foreground">
              Available: {availabilityData.filter(a => a.status === 'available').length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">
                  {performanceData.length > 0 
                    ? (performanceData.reduce((acc, p) => acc + p.averageResponseTime, 0) / performanceData.length).toFixed(1)
                    : '0'
                  }m
                </p>
              </div>
              <Clock className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {performanceData.length > 0 
                    ? (performanceData.reduce((acc, p) => acc + p.patientSatisfactionScore, 0) / performanceData.length).toFixed(0)
                    : '0'
                  }%
                </p>
              </div>
              <Star className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Cases</p>
                <p className="text-2xl font-bold text-orange-600">
                  {performanceData.reduce((acc, p) => acc + (p.currentAssignment ? 1 : 0), 0)}
                </p>
              </div>
              <Activity className="text-orange-500" size={24} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Team Capacity</p>
                <p className="text-2xl font-bold text-purple-600">
                  {availabilityData.filter(a => a.status === 'available').length}/{medicalTeam.length}
                </p>
              </div>
              <TrendingUp className="text-purple-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medical Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeam.map((member) => {
          const performance = getMemberPerformance(member.id);
          const availability = getMemberAvailability(member.id);
          
          return (
            <Card key={member.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{member.nama}</h3>
                    <p className="text-sm text-muted-foreground">{member.spesialisasi}</p>
                    <p className="text-xs text-muted-foreground">License: {member.no_lisensi}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={getStatusColor(availability?.status || 'unknown')}>
                      {availability?.status || 'unknown'}
                    </Badge>
                    {availability?.specialtyMatch && (
                      <Badge variant="outline" className="block text-xs">
                        {availability.specialtyMatch}% match
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Performance Indicators */}
                {performance && (
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span>Patient Satisfaction</span>
                      <span className={getPerformanceColor(performance.patientSatisfactionScore)}>
                        {performance.patientSatisfactionScore}%
                      </span>
                    </div>
                    <Progress value={performance.patientSatisfactionScore} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">Cases:</span>
                        <span className="ml-1 font-medium">{performance.successfulCases}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Time:</span>
                        <span className="ml-1 font-medium">{performance.averageResponseTime}m</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Current Assignment */}
                {performance?.currentAssignment && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-800">Current Assignment:</p>
                    <p className="text-xs text-blue-600">{performance.currentAssignment}</p>
                  </div>
                )}

                {/* Availability Info */}
                {availability && (
                  <div className="space-y-1 text-xs mb-3">
                    {availability.currentLocation && (
                      <div className="flex items-center">
                        <MapPin size={12} className="mr-1 text-muted-foreground" />
                        <span>{availability.currentLocation}</span>
                      </div>
                    )}
                    {availability.responseTime && (
                      <div className="flex items-center">
                        <Clock size={12} className="mr-1 text-muted-foreground" />
                        <span>ETA: {availability.responseTime}m</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center space-x-2 text-xs mb-3">
                  <Phone size={12} className="text-muted-foreground" />
                  <span>{member.no_telepon}</span>
                </div>

                <div className="flex space-x-2">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => setSelectedMember(member)}
                      >
                        Details
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  
                  <Select 
                    value={member.status || 'aktif'} 
                    onValueChange={(status) => updateMemberStatus(member.id, status as 'aktif' | 'tidak_aktif')}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aktif">Aktif</SelectItem>
                      <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Member Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <UserPlus className="mr-2" size={20} />
              Medical Team Member - {selectedMember?.nama}
            </DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="info">Information</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="certifications">Certifications</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Personal Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Full Name:</strong> {selectedMember.nama}</p>
                      <p><strong>Specialization:</strong> {selectedMember.spesialisasi}</p>
                      <p><strong>License No:</strong> {selectedMember.no_lisensi}</p>
                      <p><strong>Phone:</strong> {selectedMember.no_telepon}</p>
                      <p><strong>Address:</strong> {selectedMember.alamat}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Current Status</h4>
                    <div className="space-y-2 text-sm">
                      {(() => {
                        const availability = getMemberAvailability(selectedMember.id);
                        return availability ? (
                          <>
                            <Badge variant={getStatusColor(availability.status)}>
                              {availability.status}
                            </Badge>
                            {availability.currentLocation && (
                              <p><strong>Location:</strong> {availability.currentLocation}</p>
                            )}
                            {availability.responseTime && (
                              <p><strong>Response Time:</strong> {availability.responseTime} minutes</p>
                            )}
                          </>
                        ) : (
                          <p className="text-muted-foreground">No availability data</p>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="performance" className="space-y-4">
                {(() => {
                  const performance = getMemberPerformance(selectedMember.id);
                  return performance ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Performance Metrics</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Patient Satisfaction</span>
                              <span className={getPerformanceColor(performance.patientSatisfactionScore)}>
                                {performance.patientSatisfactionScore}%
                              </span>
                            </div>
                            <Progress value={performance.patientSatisfactionScore} className="h-2" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-muted-foreground">Successful Cases</p>
                              <p className="text-2xl font-bold">{performance.successfulCases}</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-muted-foreground">Avg Response</p>
                              <p className="text-2xl font-bold">{performance.averageResponseTime}m</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-muted-foreground">Monthly Hours</p>
                              <p className="text-2xl font-bold">{performance.monthlyHours}h</p>
                            </div>
                            <div className="bg-muted p-3 rounded-lg">
                              <p className="text-muted-foreground">Last Review</p>
                              <p className="text-sm font-medium">
                                {performance.lastPerformanceReview.toLocaleDateString('id-ID')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Current Assignment</h4>
                        {performance.currentAssignment ? (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-800">{performance.currentAssignment}</p>
                            <p className="text-sm text-blue-600">Active case in progress</p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">No current assignment</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No performance data available</p>
                  );
                })()}
              </TabsContent>
              
              <TabsContent value="schedule" className="space-y-4">
                <h4 className="font-medium">Shift Schedule</h4>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current Schedule: {selectedMember.jadwal_piket}</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm">Next shift: Tomorrow 07:00 - 15:00</p>
                    <p className="text-xs text-muted-foreground">Emergency Medicine Department</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="certifications" className="space-y-4">
                <h4 className="font-medium">Certifications & Skills</h4>
                {(() => {
                  const performance = getMemberPerformance(selectedMember.id);
                  return performance && performance.certifications ? (
                    <div className="space-y-3">
                      <div>
                        <h5 className="text-sm font-medium mb-2">Active Certifications</h5>
                        <div className="flex flex-wrap gap-2">
                          {performance.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline" className="flex items-center">
                              <Award size={12} className="mr-1" />
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">Specializations</h5>
                        <div className="flex flex-wrap gap-2">
                          {performance.specializations.map((spec, index) => (
                            <Badge key={index} variant="default">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No certification data available</p>
                  );
                })()}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedMedicalTeam;