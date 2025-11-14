import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Thermometer, Activity, Droplets, Plus, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';

interface VitalSigns {
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  pulse_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  respiratory_rate: number | null;
  blood_glucose: number | null;
  notes: string;
  recorded_by: string;
}

interface PatientMonitoringRecord {
  id: string;
  report_id: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  pulse_rate: number | null;
  temperature: number | null;
  oxygen_saturation: number | null;
  respiratory_rate: number | null;
  blood_glucose: number | null;
  notes: string;
  recorded_by: string;
  recorded_at: string;
}

const PatientMonitoring: React.FC = () => {
  const [selectedReportId, setSelectedReportId] = useState<string>('');
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    blood_pressure_systolic: null,
    blood_pressure_diastolic: null,
    pulse_rate: null,
    temperature: null,
    oxygen_saturation: null,
    respiratory_rate: null,
    blood_glucose: null,
    notes: '',
    recorded_by: 'Paramedis Tim',
  });
  const [monitoringHistory, setMonitoringHistory] = useState<PatientMonitoringRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { reports } = useEmergencyReports();
  const { toast } = useToast();

  const activeReports = reports.filter(report => report.status === 'pending');

  useEffect(() => {
    if (selectedReportId) {
      fetchMonitoringHistory();
    }
  }, [selectedReportId]);

  const fetchMonitoringHistory = async () => {
    if (!selectedReportId) return;

    try {
      const { data, error } = await supabase
        .from('patient_monitoring')
        .select('*')
        .eq('report_id', selectedReportId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setMonitoringHistory(data || []);
    } catch (error) {
      console.error('Error fetching monitoring history:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) {
      toast({
        title: "Error",
        description: "Pilih pasien/laporan terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('patient_monitoring')
        .insert([{
          report_id: selectedReportId,
          ...vitalSigns,
        }]);

      if (error) throw error;

      // Reset form
      setVitalSigns({
        blood_pressure_systolic: null,
        blood_pressure_diastolic: null,
        pulse_rate: null,
        temperature: null,
        oxygen_saturation: null,
        respiratory_rate: null,
        blood_glucose: null,
        notes: '',
        recorded_by: 'Paramedis Tim',
      });

      // Refresh history
      await fetchMonitoringHistory();

      toast({
        title: "✅ Vital Signs Recorded",
        description: "Data vital signs pasien berhasil disimpan",
      });

    } catch (error) {
      console.error('Error saving vital signs:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data vital signs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getVitalStatus = (type: string, value: number | null) => {
    if (value === null) return 'normal';
    
    switch (type) {
      case 'pulse':
        if (value < 60 || value > 100) return 'abnormal';
        break;
      case 'temp':
        if (value < 36.1 || value > 37.2) return 'abnormal';
        break;
      case 'oxygen':
        if (value < 95) return 'abnormal';
        break;
      case 'systolic':
        if (value < 90 || value > 140) return 'abnormal';
        break;
      case 'diastolic':
        if (value < 60 || value > 90) return 'abnormal';
        break;
    }
    return 'normal';
  };

  return (
    <div className="space-y-6">
      {/* Patient Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Patient Monitoring</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="patient-select">Pilih Pasien</Label>
              <Select value={selectedReportId} onValueChange={setSelectedReportId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pasien untuk monitoring..." />
                </SelectTrigger>
                <SelectContent>
                  {activeReports.map((report) => (
                    <SelectItem key={report.id} value={report.id}>
                      {report.patient_name} - {report.type} ({report.location})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vital Signs Input Form */}
      {selectedReportId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Input Vital Signs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Blood Pressure */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="systolic">Tekanan Darah Sistol (mmHg)</Label>
                  <Input
                    id="systolic"
                    type="number"
                    value={vitalSigns.blood_pressure_systolic || ''}
                    onChange={(e) => setVitalSigns({
                      ...vitalSigns,
                      blood_pressure_systolic: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="120"
                    className={getVitalStatus('systolic', vitalSigns.blood_pressure_systolic) === 'abnormal' ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="diastolic">Tekanan Darah Diastol (mmHg)</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    value={vitalSigns.blood_pressure_diastolic || ''}
                    onChange={(e) => setVitalSigns({
                      ...vitalSigns,
                      blood_pressure_diastolic: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="80"
                    className={getVitalStatus('diastolic', vitalSigns.blood_pressure_diastolic) === 'abnormal' ? 'border-red-500' : ''}
                  />
                </div>
              </div>

              {/* Pulse and Temperature */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="pulse">Nadi (bpm)</Label>
                  <Input
                    id="pulse"
                    type="number"
                    value={vitalSigns.pulse_rate || ''}
                    onChange={(e) => setVitalSigns({
                      ...vitalSigns,
                      pulse_rate: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="80"
                    className={getVitalStatus('pulse', vitalSigns.pulse_rate) === 'abnormal' ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="temperature">Suhu (°C)</Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={vitalSigns.temperature || ''}
                    onChange={(e) => setVitalSigns({
                      ...vitalSigns,
                      temperature: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    placeholder="36.5"
                    className={getVitalStatus('temp', vitalSigns.temperature) === 'abnormal' ? 'border-red-500' : ''}
                  />
                </div>
              </div>

              {/* Oxygen Saturation and Respiratory Rate */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="oxygen">Saturasi Oksigen (%)</Label>
                  <Input
                    id="oxygen"
                    type="number"
                    value={vitalSigns.oxygen_saturation || ''}
                    onChange={(e) => setVitalSigns({
                      ...vitalSigns,
                      oxygen_saturation: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="98"
                    className={getVitalStatus('oxygen', vitalSigns.oxygen_saturation) === 'abnormal' ? 'border-red-500' : ''}
                  />
                </div>
                <div>
                  <Label htmlFor="respiratory">Pernapasan (per menit)</Label>
                  <Input
                    id="respiratory"
                    type="number"
                    value={vitalSigns.respiratory_rate || ''}
                    onChange={(e) => setVitalSigns({
                      ...vitalSigns,
                      respiratory_rate: e.target.value ? parseInt(e.target.value) : null
                    })}
                    placeholder="16"
                  />
                </div>
              </div>

              {/* Blood Glucose */}
              <div>
                <Label htmlFor="glucose">Gula Darah (mg/dL)</Label>
                <Input
                  id="glucose"
                  type="number"
                  value={vitalSigns.blood_glucose || ''}
                  onChange={(e) => setVitalSigns({
                    ...vitalSigns,
                    blood_glucose: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="100"
                />
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Catatan</Label>
                <Textarea
                  id="notes"
                  value={vitalSigns.notes}
                  onChange={(e) => setVitalSigns({
                    ...vitalSigns,
                    notes: e.target.value
                  })}
                  placeholder="Catatan kondisi pasien..."
                  className="min-h-[80px]"
                />
              </div>

              {/* Recorded By */}
              <div>
                <Label htmlFor="recorded-by">Dicatat Oleh</Label>
                <Input
                  id="recorded-by"
                  value={vitalSigns.recorded_by}
                  onChange={(e) => setVitalSigns({
                    ...vitalSigns,
                    recorded_by: e.target.value
                  })}
                  placeholder="Nama petugas"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Menyimpan...' : 'Simpan Vital Signs'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Monitoring History */}
      {selectedReportId && monitoringHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Riwayat Monitoring</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monitoringHistory.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {new Date(record.recorded_at).toLocaleString('id-ID')}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {record.recorded_by}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    {record.blood_pressure_systolic && record.blood_pressure_diastolic && (
                      <div>
                        <span className="font-medium">TD:</span> {record.blood_pressure_systolic}/{record.blood_pressure_diastolic}
                      </div>
                    )}
                    {record.pulse_rate && (
                      <div>
                        <span className="font-medium">Nadi:</span> {record.pulse_rate} bpm
                      </div>
                    )}
                    {record.temperature && (
                      <div>
                        <span className="font-medium">Suhu:</span> {record.temperature}°C
                      </div>
                    )}
                    {record.oxygen_saturation && (
                      <div>
                        <span className="font-medium">SpO2:</span> {record.oxygen_saturation}%
                      </div>
                    )}
                  </div>
                  
                  {record.notes && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Catatan:</span> {record.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PatientMonitoring;