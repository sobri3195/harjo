-- Enable real-time for locations table
ALTER TABLE public.locations REPLICA IDENTITY FULL;

-- Add locations table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;

-- Enable real-time for ambulance_tracking table if not already enabled
ALTER TABLE public.ambulance_tracking REPLICA IDENTITY FULL;

-- Add ambulance_tracking table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_tracking;