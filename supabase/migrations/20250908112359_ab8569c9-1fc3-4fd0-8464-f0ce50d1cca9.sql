-- Create ambulance_drivers table for driver management
CREATE TABLE public.ambulance_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nrp TEXT NOT NULL UNIQUE,
  no_telepon TEXT NOT NULL,
  unit_ambulans TEXT NOT NULL,
  shift TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'off-duty' CHECK (status IN ('active', 'off-duty', 'on-call')),
  lokasi_terakhir TEXT,
  terakhir_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.ambulance_drivers ENABLE ROW LEVEL SECURITY;

-- Create policies for ambulance drivers
CREATE POLICY "Ambulance drivers viewable by everyone" 
ON public.ambulance_drivers 
FOR SELECT 
USING (true);

CREATE POLICY "Ambulance drivers insertable by authenticated users" 
ON public.ambulance_drivers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Ambulance drivers updatable by authenticated users" 
ON public.ambulance_drivers 
FOR UPDATE 
USING (true);

CREATE POLICY "Ambulance drivers deletable by authenticated users" 
ON public.ambulance_drivers 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_ambulance_drivers_updated_at
BEFORE UPDATE ON public.ambulance_drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data
INSERT INTO public.ambulance_drivers (nama, nrp, no_telepon, unit_ambulans, shift, status, lokasi_terakhir) VALUES
('Serda Budi Santoso', '31120456789', '0812-3456-7890', 'AMB-01', '08:00 - 20:00', 'active', 'RSPAU Base'),
('Kopda Ahmad Wijaya', '31120456790', '0812-3456-7891', 'AMB-02', '20:00 - 08:00', 'off-duty', 'Home'),
('Sertu Maria Sari', '31120456791', '0812-3456-7892', 'AMB-03', '12:00 - 24:00', 'on-call', 'Standby Area');