-- Create analytics tables for response time and performance tracking
CREATE TABLE IF NOT EXISTS public.response_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_report_id uuid REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  call_received_at timestamp with time zone NOT NULL,
  first_response_at timestamp with time zone,
  ambulance_dispatched_at timestamp with time zone,
  ambulance_arrived_at timestamp with time zone,
  patient_transported_at timestamp with time zone,
  case_closed_at timestamp with time zone,
  response_time_minutes integer, -- Time from call to first response
  dispatch_time_minutes integer, -- Time from call to ambulance dispatch
  arrival_time_minutes integer, -- Time from dispatch to arrival
  total_duration_minutes integer, -- Total case duration
  distance_km numeric,
  ambulance_id text,
  crew_size integer,
  priority_level text, -- 'low', 'medium', 'high', 'critical'
  outcome text, -- 'transported', 'treated_on_site', 'refused_transport', 'deceased'
  hospital_destination text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for response analytics
ALTER TABLE public.response_analytics ENABLE ROW LEVEL SECURITY;

-- Create policy for response analytics
CREATE POLICY "Response analytics viewable by everyone"
ON public.response_analytics
FOR ALL
USING (true)
WITH CHECK (true);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date date NOT NULL,
  metric_type text NOT NULL, -- 'daily', 'weekly', 'monthly'
  total_calls integer DEFAULT 0,
  critical_calls integer DEFAULT 0,
  average_response_time_minutes numeric DEFAULT 0,
  average_dispatch_time_minutes numeric DEFAULT 0,
  average_arrival_time_minutes numeric DEFAULT 0,
  successful_transports integer DEFAULT 0,
  on_site_treatments integer DEFAULT 0,
  system_uptime_percentage numeric DEFAULT 100,
  gps_accuracy_percentage numeric DEFAULT 0,
  offline_incidents integer DEFAULT 0,
  ambulance_utilization_percentage numeric DEFAULT 0,
  hospital_capacity_utilization numeric DEFAULT 0,
  user_satisfaction_score numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(metric_date, metric_type)
);

-- Enable RLS for performance metrics
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for performance metrics
CREATE POLICY "Performance metrics viewable by everyone"
ON public.performance_metrics
FOR ALL
USING (true)
WITH CHECK (true);

-- Create custom reports table
CREATE TABLE IF NOT EXISTS public.custom_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_name text NOT NULL,
  report_type text NOT NULL, -- 'response_time', 'performance', 'utilization', 'custom'
  filters jsonb DEFAULT '{}',
  date_range_start date,
  date_range_end date,
  generated_by text,
  report_data jsonb DEFAULT '{}',
  file_url text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for custom reports
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;

-- Create policy for custom reports
CREATE POLICY "Custom reports manageable by everyone"
ON public.custom_reports
FOR ALL
USING (true)
WITH CHECK (true);

-- Create system events table for mobile optimization tracking
CREATE TABLE IF NOT EXISTS public.system_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL, -- 'gps_permission', 'battery_status', 'network_change', 'app_state', 'sync_event'
  event_data jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info jsonb DEFAULT '{}', -- Device type, OS version, app version
  battery_level integer,
  network_type text, -- 'wifi', 'cellular', 'offline'
  gps_accuracy numeric,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for system events
ALTER TABLE public.system_events ENABLE ROW LEVEL SECURITY;

-- Create policy for system events
CREATE POLICY "Users can manage their own system events"
ON public.system_events
FOR ALL
USING (auth.uid() = user_id OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Create background sync queue for offline operations
CREATE TABLE IF NOT EXISTS public.sync_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- 'emergency_report', 'location_update', 'status_update'
  payload jsonb NOT NULL,
  priority integer DEFAULT 1, -- 1 = highest, 5 = lowest
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count integer DEFAULT 0,
  max_retries integer DEFAULT 3,
  scheduled_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for sync queue
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

-- Create policy for sync queue
CREATE POLICY "Users can manage their own sync queue"
ON public.sync_queue
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add realtime capabilities
ALTER TABLE public.response_analytics REPLICA IDENTITY FULL;
ALTER TABLE public.performance_metrics REPLICA IDENTITY FULL;
ALTER TABLE public.custom_reports REPLICA IDENTITY FULL;
ALTER TABLE public.system_events REPLICA IDENTITY FULL;
ALTER TABLE public.sync_queue REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.response_analytics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sync_queue;

-- Add triggers for updated_at
CREATE TRIGGER update_response_analytics_updated_at
    BEFORE UPDATE ON public.response_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_metrics_updated_at
    BEFORE UPDATE ON public.performance_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_reports_updated_at
    BEFORE UPDATE ON public.custom_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_queue_updated_at
    BEFORE UPDATE ON public.sync_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample analytics data
INSERT INTO public.performance_metrics (metric_date, metric_type, total_calls, critical_calls, average_response_time_minutes, average_dispatch_time_minutes, average_arrival_time_minutes, successful_transports, ambulance_utilization_percentage) VALUES
(CURRENT_DATE - INTERVAL '1 day', 'daily', 12, 3, 4.2, 2.1, 8.5, 11, 75.5),
(CURRENT_DATE - INTERVAL '2 days', 'daily', 8, 1, 3.8, 1.9, 7.2, 8, 65.2),
(CURRENT_DATE - INTERVAL '3 days', 'daily', 15, 5, 5.1, 2.8, 9.8, 14, 85.3);

-- Create function to calculate response analytics
CREATE OR REPLACE FUNCTION public.calculate_response_analytics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update or insert response analytics when emergency report status changes
  IF NEW.status = 'selesai' AND OLD.status != 'selesai' THEN
    INSERT INTO public.response_analytics (
      emergency_report_id,
      call_received_at,
      case_closed_at,
      priority_level,
      total_duration_minutes
    ) VALUES (
      NEW.id,
      NEW.created_at,
      NOW(),
      CASE 
        WHEN NEW.severity = 'berat' THEN 'critical'
        WHEN NEW.severity = 'sedang' THEN 'high'
        ELSE 'medium'
      END,
      EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60
    )
    ON CONFLICT (emergency_report_id) DO UPDATE SET
      case_closed_at = NOW(),
      total_duration_minutes = EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic analytics calculation
DROP TRIGGER IF EXISTS trigger_calculate_response_analytics ON public.emergency_reports;
CREATE TRIGGER trigger_calculate_response_analytics
  AFTER UPDATE ON public.emergency_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_response_analytics();