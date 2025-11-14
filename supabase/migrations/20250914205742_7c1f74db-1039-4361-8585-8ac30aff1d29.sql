-- Enable real-time updates for ambulance-related tables
ALTER TABLE public.ambulance_status REPLICA IDENTITY FULL;
ALTER TABLE public.ambulance_drivers REPLICA IDENTITY FULL;
ALTER TABLE public.equipment_tracking REPLICA IDENTITY FULL;

-- Add tables to realtime publication (only if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'ambulance_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'ambulance_drivers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ambulance_drivers;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'equipment_tracking'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.equipment_tracking;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ambulance_status_ambulance_id ON public.ambulance_status(ambulance_id);
CREATE INDEX IF NOT EXISTS idx_ambulance_drivers_unit_ambulans ON public.ambulance_drivers(unit_ambulans);
CREATE INDEX IF NOT EXISTS idx_ambulance_drivers_status ON public.ambulance_drivers(status);
CREATE INDEX IF NOT EXISTS idx_equipment_tracking_ambulance_id ON public.equipment_tracking(ambulance_id);

-- Insert sample data with valid status values
INSERT INTO public.ambulance_status (ambulance_id, status, fuel_level, crew_count, position)
SELECT 'AMB-001', 'siap_operasi', 85, 3, 'RS Sardjito'
WHERE NOT EXISTS (SELECT 1 FROM public.ambulance_status WHERE ambulance_id = 'AMB-001');

INSERT INTO public.ambulance_status (ambulance_id, status, fuel_level, crew_count, position)
SELECT 'AMB-002', 'dispatched', 70, 2, 'Jalan Malioboro'
WHERE NOT EXISTS (SELECT 1 FROM public.ambulance_status WHERE ambulance_id = 'AMB-002');

INSERT INTO public.ambulance_status (ambulance_id, status, fuel_level, crew_count, position)
SELECT 'AMB-003', 'maintenance', 45, 0, 'Workshop'
WHERE NOT EXISTS (SELECT 1 FROM public.ambulance_status WHERE ambulance_id = 'AMB-003');

-- Insert sample drivers with valid status values (off-duty, on-call, active)
INSERT INTO public.ambulance_drivers (nama, nrp, no_telepon, unit_ambulans, shift, status)
SELECT 'Budi Santoso', '12345678', '081234567890', 'AMB-001', 'Pagi (08:00-16:00)', 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.ambulance_drivers WHERE nrp = '12345678');

INSERT INTO public.ambulance_drivers (nama, nrp, no_telepon, unit_ambulans, shift, status)
SELECT 'Siti Rahayu', '87654321', '081987654321', 'AMB-002', 'Siang (16:00-24:00)', 'on-call'
WHERE NOT EXISTS (SELECT 1 FROM public.ambulance_drivers WHERE nrp = '87654321');

INSERT INTO public.ambulance_drivers (nama, nrp, no_telepon, unit_ambulans, shift, status)
SELECT 'Ahmad Wijaya', '11223344', '081122334455', 'AMB-003', 'Malam (00:00-08:00)', 'off-duty'
WHERE NOT EXISTS (SELECT 1 FROM public.ambulance_drivers WHERE nrp = '11223344');

-- Insert sample equipment tracking data
INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'fuel', 'Solar', 35.5, 50, 'liter', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'Solar');

INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'medical', 'Oksigen Medis', 80, 100, 'persen', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'Oksigen Medis');

INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'medical', 'AED Philips', 100, 100, 'persen', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'AED Philips');

INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'medical', 'Defibrilator', 1, 1, 'unit', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'Defibrilator');

INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'medical', 'Oksigen', 85, 100, 'bar', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'Oksigen');

INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'equipment', 'Tandu', 1, 1, 'unit', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'Tandu');

INSERT INTO public.equipment_tracking (ambulance_id, equipment_type, equipment_name, current_level, max_capacity, unit, status, last_checked_by)
SELECT 'AMB-001', 'medical', 'Obat-obatan', 1, 1, 'set', 'operational', 'System'
WHERE NOT EXISTS (SELECT 1 FROM public.equipment_tracking WHERE ambulance_id = 'AMB-001' AND equipment_name = 'Obat-obatan');