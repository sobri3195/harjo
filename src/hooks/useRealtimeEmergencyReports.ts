import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from './use-toast';

export interface EmergencyReport {
  id: string;
  type: 'trauma' | 'heart';
  reporter_name: string;
  reporter_rank: string;
  reporter_phone: string;
  patient_name: string;
  patient_rank?: string;
  location: string;
  description: string;
  severity: 'ringan' | 'sedang' | 'berat';
  status: 'pending' | 'dalam_penanganan' | 'selesai';
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export const useRealtimeEmergencyReports = () => {
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch initial data
  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports((data as EmergencyReport[]) || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: "Error",
        description: "Failed to load emergency reports",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    fetchReports();

    const channel = supabase
      .channel('emergency_reports_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'emergency_reports'
        },
        (payload) => {
          console.log('Emergency report change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newReport = payload.new as EmergencyReport;
            setReports(prev => [newReport, ...prev]);
            
            // Show notification for new emergency
            toast({
              title: `🚨 New ${newReport.type.toUpperCase()} Emergency`,
              description: `${newReport.patient_name} at ${newReport.location}`,
              variant: newReport.severity === 'berat' ? 'destructive' : 'default'
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedReport = payload.new as EmergencyReport;
            setReports(prev => 
              prev.map(report => 
                report.id === updatedReport.id ? updatedReport : report
              )
            );
            
            // Show status update notification
            if (payload.old?.status !== updatedReport.status) {
              toast({
                title: "📊 Status Update",
                description: `${updatedReport.patient_name}: ${updatedReport.status}`,
              });
            }
          } else if (payload.eventType === 'DELETE') {
            setReports(prev => 
              prev.filter(report => report.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Create new report
  const createReport = async (reportData: Omit<EmergencyReport, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "🚨 Emergency Report Sent",
        description: `Report for ${reportData.patient_name} has been submitted successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: "Error",
        description: "Failed to submit emergency report",
        variant: "destructive"
      });
      throw error;
    }
  };

  // Update report status
  const updateReportStatus = async (id: string, status: EmergencyReport['status']) => {
    try {
      const { error } = await supabase
        .from('emergency_reports')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    reports,
    loading,
    createReport,
    updateReportStatus,
    refetch: fetchReports
  };
};