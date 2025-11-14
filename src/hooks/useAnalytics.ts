import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface ResponseAnalytics {
  id: string;
  emergency_report_id: string;
  call_received_at: string;
  first_response_at?: string;
  ambulance_dispatched_at?: string;
  ambulance_arrived_at?: string;
  patient_transported_at?: string;
  case_closed_at?: string;
  response_time_minutes?: number;
  dispatch_time_minutes?: number;
  arrival_time_minutes?: number;
  total_duration_minutes?: number;
  distance_km?: number;
  ambulance_id?: string;
  crew_size?: number;
  priority_level?: string;
  outcome?: string;
  hospital_destination?: string;
  created_at: string;
  updated_at: string;
}

interface PerformanceMetrics {
  id: string;
  metric_date: string;
  metric_type: 'daily' | 'weekly' | 'monthly';
  total_calls: number;
  critical_calls: number;
  average_response_time_minutes: number;
  average_dispatch_time_minutes: number;
  average_arrival_time_minutes: number;
  successful_transports: number;
  on_site_treatments: number;
  system_uptime_percentage: number;
  gps_accuracy_percentage: number;
  offline_incidents: number;
  ambulance_utilization_percentage: number;
  hospital_capacity_utilization: number;
  user_satisfaction_score: number;
  created_at: string;
  updated_at: string;
}

interface AnalyticsFilters {
  dateRange: {
    start: string;
    end: string;
  };
  priority?: string[];
  ambulance?: string[];
  outcome?: string[];
}

export const useAnalytics = () => {
  const [responseAnalytics, setResponseAnalytics] = useState<ResponseAnalytics[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch response analytics
  const fetchResponseAnalytics = async (filters?: AnalyticsFilters) => {
    try {
      let query = supabase
        .from('response_analytics')
        .select('*')
        .order('call_received_at', { ascending: false });

      if (filters?.dateRange) {
        query = query
          .gte('call_received_at', filters.dateRange.start)
          .lte('call_received_at', filters.dateRange.end);
      }

      if (filters?.priority && filters.priority.length > 0) {
        query = query.in('priority_level', filters.priority);
      }

      if (filters?.ambulance && filters.ambulance.length > 0) {
        query = query.in('ambulance_id', filters.ambulance);
      }

      if (filters?.outcome && filters.outcome.length > 0) {
        query = query.in('outcome', filters.outcome);
      }

      const { data, error } = await query;

      if (error) throw error;
      setResponseAnalytics(data || []);
    } catch (error) {
      console.error('Error fetching response analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load response analytics",
        variant: "destructive"
      });
    }
  };

  // Fetch performance metrics
  const fetchPerformanceMetrics = async (metricType: 'daily' | 'weekly' | 'monthly' = 'daily', limit = 30) => {
    try {
      const { data, error } = await supabase
        .from('performance_metrics')
        .select('*')
        .eq('metric_type', metricType)
        .order('metric_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setPerformanceMetrics((data as PerformanceMetrics[]) || []);
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load performance metrics",
        variant: "destructive"
      });
    }
  };

  // Calculate response time statistics
  const getResponseTimeStats = () => {
    if (responseAnalytics.length === 0) return null;

    const responseTimes = responseAnalytics
      .filter(r => r.response_time_minutes !== null)
      .map(r => r.response_time_minutes!);

    if (responseTimes.length === 0) return null;

    const avg = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const min = Math.min(...responseTimes);
    const max = Math.max(...responseTimes);
    
    // Calculate median
    const sorted = responseTimes.sort((a, b) => a - b);
    const median = sorted.length % 2 === 0
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];

    return { avg, min, max, median, total: responseTimes.length };
  };

  // Get performance trends
  const getPerformanceTrends = () => {
    if (performanceMetrics.length < 2) return null;

    const latest = performanceMetrics[0];
    const previous = performanceMetrics[1];

    return {
      responseTime: {
        current: latest.average_response_time_minutes,
        change: latest.average_response_time_minutes - previous.average_response_time_minutes,
        percentage: ((latest.average_response_time_minutes - previous.average_response_time_minutes) / previous.average_response_time_minutes) * 100
      },
      totalCalls: {
        current: latest.total_calls,
        change: latest.total_calls - previous.total_calls,
        percentage: ((latest.total_calls - previous.total_calls) / previous.total_calls) * 100
      },
      utilization: {
        current: latest.ambulance_utilization_percentage,
        change: latest.ambulance_utilization_percentage - previous.ambulance_utilization_percentage,
        percentage: ((latest.ambulance_utilization_percentage - previous.ambulance_utilization_percentage) / previous.ambulance_utilization_percentage) * 100
      }
    };
  };

  // Export analytics data
  const exportAnalytics = async (filters?: AnalyticsFilters, format: 'csv' | 'json' = 'csv') => {
    try {
      await fetchResponseAnalytics(filters);
      
      if (format === 'csv') {
        const csv = convertToCSV(responseAnalytics);
        downloadFile(csv, 'response-analytics.csv', 'text/csv');
      } else {
        const json = JSON.stringify(responseAnalytics, null, 2);
        downloadFile(json, 'response-analytics.json', 'application/json');
      }

      toast({
        title: "✅ Export Complete",
        description: `Analytics data exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export analytics data",
        variant: "destructive"
      });
    }
  };

  // Generate custom report
  const generateCustomReport = async (reportName: string, reportType: string, filters?: AnalyticsFilters) => {
    try {
      const { data, error } = await supabase
        .from('custom_reports')
        .insert({
          report_name: reportName,
          report_type: reportType,
          filters: filters || {},
          date_range_start: filters?.dateRange.start || null,
          date_range_end: filters?.dateRange.end || null,
          generated_by: 'system',
          status: 'processing'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "📊 Report Generating",
        description: `Custom report "${reportName}" is being generated`,
      });

      return data;
    } catch (error) {
      console.error('Report generation failed:', error);
      toast({
        title: "Error",
        description: "Failed to generate custom report",
        variant: "destructive"
      });
    }
  };

  // Initialize data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchResponseAnalytics(),
        fetchPerformanceMetrics()
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, []);

  return {
    responseAnalytics,
    performanceMetrics,
    loading,
    fetchResponseAnalytics,
    fetchPerformanceMetrics,
    getResponseTimeStats,
    getPerformanceTrends,
    exportAnalytics,
    generateCustomReport
  };
};

// Helper functions
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

function downloadFile(content: string, filename: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}