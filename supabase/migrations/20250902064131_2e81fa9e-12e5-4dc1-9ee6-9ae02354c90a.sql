-- Enable realtime for ambulance_tracking table
ALTER TABLE public.ambulance_tracking REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_tracking;

-- Create indexes for better performance
CREATE INDEX idx_ambulance_tracking_ambulance_id ON public.ambulance_tracking(ambulance_id);
CREATE INDEX idx_ambulance_tracking_timestamp ON public.ambulance_tracking(timestamp DESC);

-- Create emergency_dispatches table for routing
CREATE TABLE public.emergency_dispatches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_report_id UUID,
  ambulance_id TEXT NOT NULL,
  dispatch_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  route_data JSONB,
  status TEXT NOT NULL DEFAULT 'dispatched',
  distance_km NUMERIC,
  eta_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for emergency_dispatches
ALTER TABLE public.emergency_dispatches ENABLE ROW LEVEL SECURITY;

-- Create policies for emergency_dispatches
CREATE POLICY "Emergency dispatches viewable by everyone" 
ON public.emergency_dispatches 
FOR SELECT 
USING (true);

CREATE POLICY "Emergency dispatches manageable by everyone" 
ON public.emergency_dispatches 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for timestamp updates
CREATE TRIGGER update_emergency_dispatches_updated_at
BEFORE UPDATE ON public.emergency_dispatches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for emergency_dispatches
ALTER TABLE public.emergency_dispatches REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_dispatches;