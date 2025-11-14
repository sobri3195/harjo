-- Create ambulance_tracking table for real-time GPS tracking
CREATE TABLE public.ambulance_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_id TEXT NOT NULL UNIQUE,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  accuracy NUMERIC,
  speed NUMERIC,
  heading NUMERIC,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ambulance_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies for ambulance tracking
CREATE POLICY "Ambulance tracking viewable by everyone" 
ON public.ambulance_tracking 
FOR SELECT 
USING (true);

CREATE POLICY "Ambulance tracking insertable by everyone" 
ON public.ambulance_tracking 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Ambulance tracking updatable by everyone" 
ON public.ambulance_tracking 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ambulance_tracking_updated_at
BEFORE UPDATE ON public.ambulance_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();