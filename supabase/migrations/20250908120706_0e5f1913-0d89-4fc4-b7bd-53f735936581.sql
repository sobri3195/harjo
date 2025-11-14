-- Create table for real-time location updates for efficient navigation
CREATE TABLE IF NOT EXISTS public.navigation_routes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emergency_report_id uuid REFERENCES public.emergency_reports(id) ON DELETE CASCADE,
  ambulance_id text NOT NULL,
  start_location jsonb NOT NULL, -- {lat, lng, address}
  end_location jsonb NOT NULL,   -- {lat, lng, address}  
  route_data jsonb,              -- Google Maps route response
  estimated_duration_minutes integer,
  estimated_distance_km numeric,
  traffic_conditions text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.navigation_routes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Navigation routes viewable by everyone" 
ON public.navigation_routes 
FOR SELECT 
USING (true);

CREATE POLICY "Navigation routes manageable by everyone" 
ON public.navigation_routes 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create updated_at trigger
CREATE TRIGGER update_navigation_routes_updated_at
BEFORE UPDATE ON public.navigation_routes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_navigation_routes_ambulance_id ON public.navigation_routes(ambulance_id);
CREATE INDEX idx_navigation_routes_emergency_id ON public.navigation_routes(emergency_report_id);
CREATE INDEX idx_navigation_routes_status ON public.navigation_routes(status);