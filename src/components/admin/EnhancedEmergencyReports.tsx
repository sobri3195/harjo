import React, { useState, useRef } from 'react';
import { FileText, Camera, Upload, MessageSquare, Clock, CheckCircle, AlertTriangle, Filter, Search, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { useToast } from '@/hooks/use-toast';

interface ReportAttachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  filename: string;
  uploadedAt: Date;
}

interface FollowUpAction {
  id: string;
  action: string;
  timestamp: Date;
  assignedTo: string;
  status: 'pending' | 'completed';
  notes?: string;
}

interface EnhancedReport {
  id: string;
  type: string;
  reporter_name: string;
  location: string;
  description: string;
  severity: string;
  status: string;
  created_at: string;
  attachments?: ReportAttachment[];
  followUpActions?: FollowUpAction[];
  responseTime?: number;
  assignedTeam?: string;
  estimatedArrival?: string;
  actualArrival?: string;
  completionNotes?: string;
}

const EnhancedEmergencyReports = () => {
  const { reports, updateReportStatus } = useEmergencyReports();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newFollowUp, setNewFollowUp] = useState('');
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  // Enhanced filtering
  const filteredReports = reports.filter(report => {
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || report.severity === filterSeverity;
    const matchesSearch = searchTerm === '' || 
      report.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesSeverity && matchesSearch;
  });

  const handleFileUpload = (reportId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Simulate file upload
      const attachment: ReportAttachment = {
        id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' : 'document',
        url: URL.createObjectURL(file),
        filename: file.name,
        uploadedAt: new Date()
      };

      toast({
        title: "📎 File Uploaded",
        description: `${file.name} berhasil ditambahkan ke laporan`,
      });
    });
  };

  const addFollowUpAction = (reportId: string) => {
    if (!newFollowUp.trim()) return;

    const action: FollowUpAction = {
      id: `action-${Date.now()}`,
      action: newFollowUp,
      timestamp: new Date(),
      assignedTo: 'Tim Medis A',
      status: 'pending',
    };

    toast({
      title: "✅ Follow-up Added",
      description: "Tindak lanjut baru telah ditambahkan",
    });

    setNewFollowUp('');
  };

  const updateFollowUpStatus = (actionId: string, status: 'pending' | 'completed') => {
    toast({
      title: "📋 Follow-up Updated",
      description: `Status tindak lanjut diubah menjadi ${status}`,
    });
  };

  const exportReports = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Type,Reporter,Location,Severity,Status,Created\n" +
      filteredReports.map(r => 
        `${r.id},${r.type},${r.reporter_name},${r.location},${r.severity},${r.status},${r.created_at}`
      ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `emergency_reports_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'dalam_penanganan': return 'default';
      case 'selesai': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'berat': return 'destructive';
      case 'sedang': return 'default';
      case 'ringan': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="mr-2" size={20} />
              Enhanced Emergency Reports Management
            </div>
            <Button onClick={exportReports} variant="outline" size="sm">
              <Download className="mr-2" size={16} />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="dalam_penanganan">In Progress</SelectItem>
                <SelectItem value="selesai">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterSeverity} onValueChange={setFilterSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Filter Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="berat">Critical</SelectItem>
                <SelectItem value="sedang">Medium</SelectItem>
                <SelectItem value="ringan">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground flex items-center">
              <Filter className="mr-2" size={16} />
              {filteredReports.length} of {reports.length} reports
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {report.type === 'trauma' ? '🚨 TRAUMA' : '❤️ CARDIAC'} - {report.patient_name}
                    </h3>
                    <Badge variant={getStatusColor(report.status)}>
                      {report.status}
                    </Badge>
                    <Badge variant={getSeverityColor(report.severity)}>
                      {report.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    📍 {report.location} • Reported by: {report.reporter_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    🕐 {new Date(report.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                
                <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedReport(report as EnhancedReport)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>

              <div className="mb-4">
                <p className="text-sm">{report.description}</p>
              </div>

              {/* Enhanced Status Actions */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {report.status === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => updateReportStatus(report.id, 'dalam_penanganan')}
                    >
                      <Clock className="mr-2" size={16} />
                      Start Response
                    </Button>
                  )}
                  {report.status === 'dalam_penanganan' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateReportStatus(report.id, 'selesai')}
                    >
                      <CheckCircle className="mr-2" size={16} />
                      Mark Complete
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={(e) => handleFileUpload(report.id, e)}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2" size={16} />
                    Attach
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Report Detail Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FileText className="mr-2" size={20} />
              Report Details - {selectedReport?.reporter_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReport && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Report Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {selectedReport.type}</p>
                    <p><strong>Severity:</strong> {selectedReport.severity}</p>
                    <p><strong>Status:</strong> {selectedReport.status}</p>
                    <p><strong>Location:</strong> {selectedReport.location}</p>
                    <p><strong>Reporter:</strong> {selectedReport.reporter_name}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Timeline</h4>
                  <div className="space-y-2 text-sm">
                    <p><strong>Reported:</strong> {new Date(selectedReport.created_at).toLocaleString('id-ID')}</p>
                    <p><strong>Response Time:</strong> {selectedReport.responseTime || 'N/A'} minutes</p>
                    <p><strong>Assigned Team:</strong> {selectedReport.assignedTeam || 'Tim Medis A'}</p>
                    <p><strong>ETA:</strong> {selectedReport.estimatedArrival || 'Calculating...'}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Description</h4>
                <p className="text-sm bg-muted p-3 rounded-lg">{selectedReport.description}</p>
              </div>

              {/* Attachments */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <Camera className="mr-2" size={16} />
                  Attachments ({selectedReport.attachments?.length || 0})
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {/* Simulated attachments */}
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <Camera size={24} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs">scene_photo_1.jpg</p>
                  </div>
                  <div className="bg-muted p-3 rounded-lg text-center">
                    <FileText size={24} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs">medical_report.pdf</p>
                  </div>
                </div>
              </div>

              {/* Follow-up Actions */}
              <div>
                <h4 className="font-medium mb-2 flex items-center">
                  <MessageSquare className="mr-2" size={16} />
                  Follow-up Actions
                </h4>
                <div className="space-y-2 mb-4">
                  {/* Simulated follow-up actions */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Medical team dispatched</p>
                      <p className="text-xs text-muted-foreground">Assigned to: Tim Medis A • 10 minutes ago</p>
                    </div>
                    <Badge variant="default">Completed</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Patient transported to hospital</p>
                      <p className="text-xs text-muted-foreground">Assigned to: Ambulans 01 • 5 minutes ago</p>
                    </div>
                    <Badge variant="secondary">Pending</Badge>
                  </div>
                </div>

                {/* Add New Follow-up */}
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Add follow-up action..."
                    value={newFollowUp}
                    onChange={(e) => setNewFollowUp(e.target.value)}
                    rows={2}
                  />
                  <Button 
                    onClick={() => addFollowUpAction(selectedReport.id)}
                    disabled={!newFollowUp.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedEmergencyReports;