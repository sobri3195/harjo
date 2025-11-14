-- Create ambulance_status table for tracking ambulance operational status
CREATE TABLE public.ambulance_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'siap_operasi',
  shift_start TIME NOT NULL DEFAULT '08:00',
  shift_end TIME NOT NULL DEFAULT '20:00',
  fuel_level INTEGER NOT NULL DEFAULT 100,
  crew_count INTEGER NOT NULL DEFAULT 0,
  position TEXT NOT NULL DEFAULT 'Base',
  position_lat NUMERIC NULL,
  position_lng NUMERIC NULL,
  last_updated_by TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ambulance_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Ambulance status viewable by everyone" 
ON public.ambulance_status 
FOR SELECT 
USING (true);

CREATE POLICY "Ambulance status manageable by authenticated users" 
ON public.ambulance_status 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_ambulance_status_updated_at
BEFORE UPDATE ON public.ambulance_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ambulance status
INSERT INTO public.ambulance_status (ambulance_id, status, shift_start, shift_end, fuel_level, crew_count, position)
VALUES 
  ('AMB-001', 'siap_operasi', '08:00', '20:00', 85, 0, 'Base'),
  ('AMB-002', 'siap_operasi', '08:00', '20:00', 92, 3, 'Base'),
  ('AMB-003', 'maintenance', '08:00', '20:00', 75, 0, 'Workshop');

-- Insert sample equipment data for ambulances using correct equipment types
INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, unit, status, current_level, max_capacity, last_checked_by, notes)
VALUES
  ('AMB-001', 'defibrillator', 'Defibrilator', 'unit', 'operational', 1, 1, 'System', 'Berfungsi normal'),
  ('AMB-001', 'oxygen', 'Oksigen', 'bar', 'operational', 85, 100, 'System', 'Level normal'),
  ('AMB-001', 'defibrillator', 'Tandu', 'unit', 'operational', 1, 1, 'System', 'Kondisi baik'),
  ('AMB-001', 'oxygen', 'Obat-obatan', 'set', 'operational', 1, 1, 'System', 'Lengkap'),
  ('AMB-002', 'defibrillator', 'Defibrilator', 'unit', 'operational', 1, 1, 'System', 'Berfungsi normal'),
  ('AMB-002', 'oxygen', 'Oksigen', 'bar', 'operational', 90, 100, 'System', 'Level normal'),
  ('AMB-002', 'defibrillator', 'Tandu', 'unit', 'operational', 1, 1, 'System', 'Kondisi baik'),
  ('AMB-002', 'oxygen', 'Obat-obatan', 'set', 'operational', 1, 1, 'System', 'Lengkap');