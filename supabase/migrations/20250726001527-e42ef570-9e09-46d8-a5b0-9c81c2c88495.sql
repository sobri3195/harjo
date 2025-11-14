-- Create table for emergency contacts
CREATE TABLE public.emergency_contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('hospital', 'police', 'fire_department', 'other')),
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for patient monitoring
CREATE TABLE public.patient_monitoring (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES emergency_reports(id) ON DELETE CASCADE,
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  pulse_rate INTEGER,
  temperature DECIMAL(4,1),
  oxygen_saturation INTEGER,
  respiratory_rate INTEGER,
  blood_glucose INTEGER,
  notes TEXT,
  recorded_by TEXT NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for team communication chat
CREATE TABLE public.team_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES emergency_reports(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('dispatcher', 'paramedic', 'doctor', 'driver', 'admin')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'image', 'audio')),
  attachment_url TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for equipment tracking
CREATE TABLE public.equipment_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ambulance_id TEXT NOT NULL,
  equipment_type TEXT NOT NULL CHECK (equipment_type IN ('fuel', 'oxygen', 'defibrillator', 'stretcher', 'medical_bag', 'other')),
  equipment_name TEXT NOT NULL,
  current_level DECIMAL(5,2),
  max_capacity DECIMAL(5,2),
  unit TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'broken', 'low', 'empty')),
  last_checked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_checked_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for resource inventory
CREATE TABLE public.resource_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('medicine', 'medical_equipment', 'consumables', 'vehicle_parts')),
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  unit TEXT NOT NULL,
  location TEXT,
  expiry_date DATE,
  supplier TEXT,
  cost_per_unit DECIMAL(10,2),
  last_updated_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for maintenance schedules
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type TEXT NOT NULL CHECK (item_type IN ('ambulance', 'equipment', 'facility')),
  item_name TEXT NOT NULL,
  item_identifier TEXT NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('routine', 'preventive', 'repair', 'inspection')),
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  assigned_to TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  description TEXT,
  cost DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for alert broadcasts
CREATE TABLE public.alert_broadcasts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_audience TEXT NOT NULL CHECK (target_audience IN ('all', 'paramedics', 'doctors', 'admin', 'drivers')),
  broadcast_type TEXT NOT NULL CHECK (broadcast_type IN ('emergency', 'maintenance', 'training', 'general')),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_broadcasts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (as this is an emergency system)
CREATE POLICY "Emergency contacts are viewable by everyone" ON public.emergency_contacts FOR SELECT USING (true);
CREATE POLICY "Patient monitoring viewable by everyone" ON public.patient_monitoring FOR ALL USING (true);
CREATE POLICY "Team chat accessible by everyone" ON public.team_chat FOR ALL USING (true);
CREATE POLICY "Equipment tracking accessible by everyone" ON public.equipment_tracking FOR ALL USING (true);
CREATE POLICY "Resource inventory accessible by everyone" ON public.resource_inventory FOR ALL USING (true);
CREATE POLICY "Maintenance schedules accessible by everyone" ON public.maintenance_schedules FOR ALL USING (true);
CREATE POLICY "Alert broadcasts viewable by everyone" ON public.alert_broadcasts FOR ALL USING (true);

-- Create update triggers
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON public.emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_equipment_tracking_updated_at
  BEFORE UPDATE ON public.equipment_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resource_inventory_updated_at
  BEFORE UPDATE ON public.resource_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample emergency contacts
INSERT INTO public.emergency_contacts (name, phone, type, address) VALUES
('RSUD Kota Jakarta', '021-1234567', 'hospital', 'Jl. Sudirman No. 123, Jakarta'),
('RS Cipto Mangunkusumo', '021-3142592', 'hospital', 'Jl. Diponegoro No. 71, Jakarta'),
('Polres Jakarta Pusat', '021-3456789', 'police', 'Jl. Kramat Raya No. 45, Jakarta'),
('Dinas Pemadam Kebakaran', '021-7890123', 'fire_department', 'Jl. Letjen Suprapto No. 12, Jakarta'),
('SAR Jakarta', '021-1500911', 'other', 'Jl. Angkasa Raya No. 34, Jakarta');

-- Insert sample equipment data
INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, last_checked_by) VALUES
('AMB-001', 'fuel', 'Solar', 35.5, 50.0, 'liter', 'Ahmad Syahroni'),
('AMB-001', 'oxygen', 'Oksigen Medis', 80.0, 100.0, 'persen', 'Ahmad Syahroni'),
('AMB-001', 'defibrillator', 'AED Philips', 100.0, 100.0, 'persen', 'Perawat Sari'),
('AMB-002', 'fuel', 'Solar', 28.3, 50.0, 'liter', 'Budi Santoso'),
('AMB-002', 'oxygen', 'Oksigen Medis', 65.0, 100.0, 'persen', 'Budi Santoso');

-- Insert sample resource inventory
INSERT INTO public.resource_inventory (item_name, category, current_stock, minimum_stock, unit, location, last_updated_by) VALUES
('Adrenalin 1mg/ml', 'medicine', 25, 10, 'ampul', 'Gudang Obat A1', 'Apoteker Siti'),
('Morfin 10mg/ml', 'medicine', 15, 5, 'ampul', 'Gudang Obat A1', 'Apoteker Siti'),
('Stetoskop', 'medical_equipment', 8, 3, 'unit', 'Gudang Alkes B2', 'Teknisi Andi'),
('Tensimeter Digital', 'medical_equipment', 5, 2, 'unit', 'Gudang Alkes B2', 'Teknisi Andi'),
('Sarung Tangan Steril', 'consumables', 200, 50, 'pasang', 'Gudang Supply C3', 'Perawat Maya');