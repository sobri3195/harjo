-- Add latitude and longitude columns to emergency_reports table
ALTER TABLE public.emergency_reports 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN public.emergency_reports.latitude IS 'GPS latitude coordinate for emergency location';
COMMENT ON COLUMN public.emergency_reports.longitude IS 'GPS longitude coordinate for emergency location';