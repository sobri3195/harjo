-- Enable realtime for existing tables (skip if already enabled)
DO $$
BEGIN
  -- Enable REPLICA IDENTITY FULL for tables that don't have it
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c 
    JOIN pg_namespace n ON n.oid = c.relnamespace 
    WHERE n.nspname = 'public' AND c.relname = 'emergency_reports' AND c.relreplident = 'f'
  ) THEN
    ALTER TABLE public.emergency_reports REPLICA IDENTITY FULL;
  END IF;
END $$;

-- Create push notification subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS for push subscriptions
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for push subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'push_subscriptions' AND policyname = 'Users can manage their own push subscriptions'
  ) THEN
    CREATE POLICY "Users can manage their own push subscriptions"
    ON public.push_subscriptions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create notification queue table
CREATE TABLE IF NOT EXISTS public.notification_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb DEFAULT '{}',
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role text, -- 'admin', 'ambulance', 'user', 'all'
  priority text NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for notification queue
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'notification_queue' AND policyname = 'Admins can manage all notifications'
  ) THEN
    CREATE POLICY "Admins can manage all notifications"
    ON public.notification_queue
    FOR ALL
    USING (true);
  END IF;
END $$;

-- Create maps cache table for offline functionality
CREATE TABLE IF NOT EXISTS public.maps_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tile_url text NOT NULL UNIQUE,
  tile_data bytea NOT NULL,
  zoom_level integer NOT NULL,
  x_coordinate integer NOT NULL,
  y_coordinate integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days')
);

-- Enable RLS for maps cache
ALTER TABLE public.maps_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for maps cache
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maps_cache' AND policyname = 'Maps cache readable by everyone'
  ) THEN
    CREATE POLICY "Maps cache readable by everyone"
    ON public.maps_cache
    FOR SELECT
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'maps_cache' AND policyname = 'Maps cache writable by authenticated users'
  ) THEN
    CREATE POLICY "Maps cache writable by authenticated users"
    ON public.maps_cache
    FOR INSERT
    TO authenticated
    WITH CHECK (true);
  END IF;
END $$;

-- Create hospital capacity table
CREATE TABLE IF NOT EXISTS public.hospital_capacity (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hospital_name text NOT NULL,
  hospital_address text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  emergency_beds_total integer NOT NULL DEFAULT 0,
  emergency_beds_available integer NOT NULL DEFAULT 0,
  icu_beds_total integer NOT NULL DEFAULT 0,
  icu_beds_available integer NOT NULL DEFAULT 0,
  trauma_capacity boolean NOT NULL DEFAULT true,
  cardiac_capacity boolean NOT NULL DEFAULT true,
  stroke_capacity boolean NOT NULL DEFAULT false,
  pediatric_capacity boolean NOT NULL DEFAULT false,
  last_updated timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for hospital capacity
ALTER TABLE public.hospital_capacity ENABLE ROW LEVEL SECURITY;

-- Create policies for hospital capacity
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hospital_capacity' AND policyname = 'Hospital capacity readable by everyone'
  ) THEN
    CREATE POLICY "Hospital capacity readable by everyone"
    ON public.hospital_capacity
    FOR SELECT
    USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hospital_capacity' AND policyname = 'Hospital capacity writable by authenticated users'
  ) THEN
    CREATE POLICY "Hospital capacity writable by authenticated users"
    ON public.hospital_capacity
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Insert sample hospital data (if not exists)
INSERT INTO public.hospital_capacity (hospital_name, hospital_address, latitude, longitude, emergency_beds_total, emergency_beds_available, icu_beds_total, icu_beds_available, trauma_capacity, cardiac_capacity, stroke_capacity, pediatric_capacity) 
SELECT * FROM (VALUES
  ('RSPAU dr. Suhardi Harjolukito', 'Jl. Protokol Halim Perdanakusuma, Jakarta Timur', -6.2665, 106.8901, 50, 12, 20, 5, true, true, true, false),
  ('RSPAD Gatot Soebroto', 'Jl. Abdul Rahman Saleh No.24, Jakarta Pusat', -6.1844, 106.8472, 75, 8, 25, 3, true, true, true, true),
  ('RSUP Dr. Kariadi', 'Jl. Dr. Sutomo No.16, Semarang', -6.9735, 110.4084, 60, 15, 18, 7, true, true, false, true)
) AS v(hospital_name, hospital_address, latitude, longitude, emergency_beds_total, emergency_beds_available, icu_beds_total, icu_beds_available, trauma_capacity, cardiac_capacity, stroke_capacity, pediatric_capacity)
WHERE NOT EXISTS (
  SELECT 1 FROM public.hospital_capacity WHERE hospital_name = v.hospital_name
);

-- Add triggers for updated_at if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_push_subscriptions_updated_at') THEN
    CREATE TRIGGER update_push_subscriptions_updated_at
        BEFORE UPDATE ON public.push_subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_queue_updated_at') THEN
    CREATE TRIGGER update_notification_queue_updated_at
        BEFORE UPDATE ON public.notification_queue
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_hospital_capacity_updated_at') THEN
    CREATE TRIGGER update_hospital_capacity_updated_at
        BEFORE UPDATE ON public.hospital_capacity
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;