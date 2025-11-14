# 🔧 Dokumentasi Teknis - Sistem Tanggap Darurat Militer

## 🏗️ Arsitektur Sistem

### Overview Arsitektur
```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Tailwind CSS + Vite                   │
│                                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Auth      │ │   Maps      │ │  Emergency  │ │   Admin   │ │
│  │  Context    │ │ Components  │ │   System    │ │ Dashboard │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE BACKEND                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ PostgreSQL   │ │  Real-time  │ │    Auth     │ │  Storage  │ │
│  │   Database   │ │ Websockets  │ │   System    │ │   Files   │ │
│  └──────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                 │
│  ┌──────────────┐ ┌─────────────┐ ┌─────────────┐               │
│  │ Edge         │ │   RLS       │ │   Triggers  │               │
│  │ Functions    │ │  Policies   │ │  Functions  │               │
│  └──────────────┘ └─────────────┘ └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  Maps API │ Voice API │ SMS Gateway │ Push Notifications        │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack Detail

#### Frontend Stack
- **React 18.3.1**: UI framework dengan concurrent features
- **TypeScript**: Type safety dan developer experience
- **Vite**: Build tool super cepat dengan HMR
- **Tailwind CSS 3.x**: Utility-first CSS framework
- **Shadcn/ui**: Accessible component library
- **React Router DOM 6.x**: Client-side routing
- **React Query**: Server state management
- **Leaflet**: Open-source mapping library

#### Backend Stack
- **Supabase**: Backend-as-a-Service platform
- **PostgreSQL 15**: Primary database
- **PostgREST**: Auto-generated REST API
- **Realtime**: WebSocket connections
- **Row Level Security**: Database-level security
- **Edge Functions**: Serverless Deno functions

---

## 🗄️ Database Schema

### Core Tables

#### 1. emergency_reports
```sql
CREATE TABLE public.emergency_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    type VARCHAR(50) NOT NULL, -- 'trauma', 'heart', 'stroke', etc.
    severity VARCHAR(20) NOT NULL, -- 'ringan', 'sedang', 'berat', 'kritis'
    description TEXT,
    location TEXT NOT NULL,
    coordinates POINT, -- PostGIS geometry
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'dispatched', 'en_route', 'on_scene', 'completed'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB -- Additional flexible data
);

-- Indexes for performance
CREATE INDEX idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX idx_emergency_reports_type ON emergency_reports(type);
CREATE INDEX idx_emergency_reports_created_at ON emergency_reports(created_at);
CREATE INDEX idx_emergency_reports_coordinates ON emergency_reports USING GIST(coordinates);
```

#### 2. ambulance_tracking
```sql
CREATE TABLE public.ambulance_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ambulance_id VARCHAR(20) NOT NULL,
    driver_id UUID REFERENCES auth.users(id),
    current_location POINT NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'available', 'dispatched', 'en_route', 'on_scene', 'returning'
    speed DECIMAL(5,2), -- km/h
    heading INTEGER, -- 0-359 degrees
    equipment_status JSONB, -- Equipment checklist
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time tracking index
CREATE INDEX idx_ambulance_tracking_ambulance_id ON ambulance_tracking(ambulance_id);
CREATE INDEX idx_ambulance_tracking_status ON ambulance_tracking(status);
CREATE INDEX idx_ambulance_tracking_location ON ambulance_tracking USING GIST(current_location);
```

#### 3. emergency_dispatches
```sql
CREATE TABLE public.emergency_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_report_id UUID REFERENCES emergency_reports(id),
    ambulance_id VARCHAR(20) NOT NULL,
    dispatch_time TIMESTAMPTZ DEFAULT NOW(),
    estimated_arrival TIMESTAMPTZ,
    actual_arrival TIMESTAMPTZ,
    completion_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL, -- 'dispatched', 'en_route', 'arrived', 'completed', 'cancelled'
    distance_km DECIMAL(8,2),
    response_time_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. locations
```sql
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(100),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(6,2), -- GPS accuracy in meters
    altitude DECIMAL(8,2), -- meters above sea level
    is_sharing BOOLEAN DEFAULT false,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Geospatial index for proximity queries
CREATE INDEX idx_locations_coordinates ON locations(latitude, longitude);
CREATE INDEX idx_locations_user_sharing ON locations(user_id, is_sharing);
```

#### 5. medical_team
```sql
CREATE TABLE public.medical_team (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    full_name VARCHAR(100) NOT NULL,
    rank VARCHAR(50),
    specialization VARCHAR(100),
    certifications TEXT[],
    contact_info JSONB,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'on_duty', 'off_duty', 'emergency'
    current_location POINT,
    shift_start TIME,
    shift_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6. patient_monitoring
```sql
CREATE TABLE public.patient_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_report_id UUID REFERENCES emergency_reports(id),
    patient_name VARCHAR(100),
    age INTEGER,
    gender VARCHAR(10),
    vital_signs JSONB, -- Blood pressure, heart rate, etc.
    medical_history TEXT,
    current_condition TEXT,
    treatment_notes TEXT,
    medications_given JSONB,
    monitored_by UUID REFERENCES auth.users(id),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 7. team_chat
```sql
CREATE TABLE public.team_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emergency_report_id UUID REFERENCES emergency_reports(id),
    sender_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'location', 'status'
    metadata JSONB,
    is_urgent BOOLEAN DEFAULT false,
    read_by UUID[], -- Array of user IDs who read the message
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Database Functions

#### 1. Distance Calculation
```sql
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) 
RETURNS DECIMAL AS $$
DECLARE
    distance DECIMAL;
BEGIN
    -- Haversine formula implementation
    distance := 2 * 6371 * ASIN(SQRT(
        POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
        COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
        POWER(SIN(RADIANS(lon2 - lon1) / 2), 2)
    ));
    
    RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
```

#### 2. Auto-update Timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_emergency_reports_updated_at
    BEFORE UPDATE ON emergency_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔐 Security Implementation

### Row Level Security (RLS) Policies

#### emergency_reports Policies
```sql
-- Enable RLS
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

-- Users can view reports they created or are assigned to
CREATE POLICY "Users can view their emergency reports"
ON emergency_reports FOR SELECT
USING (
    auth.uid() = user_id OR 
    auth.uid() IN (
        SELECT user_id FROM medical_team WHERE status = 'on_duty'
    )
);

-- Users can create emergency reports
CREATE POLICY "Users can create emergency reports"
ON emergency_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only medical team can update reports
CREATE POLICY "Medical team can update reports"
ON emergency_reports FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM medical_team WHERE status IN ('on_duty', 'available')
    )
);
```

#### ambulance_tracking Policies
```sql
ALTER TABLE ambulance_tracking ENABLE ROW LEVEL SECURITY;

-- Ambulance drivers can update their own tracking
CREATE POLICY "Ambulance drivers can update own tracking"
ON ambulance_tracking FOR ALL
USING (auth.uid() = driver_id);

-- Medical team and admin can view all tracking
CREATE POLICY "Medical team can view ambulance tracking"
ON ambulance_tracking FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM medical_team
        UNION
        SELECT user_id FROM profiles WHERE role = 'admin'
    )
);
```

### Authentication Flow

#### Emergency Auto-Login
```typescript
// src/hooks/useEmergencyAuth.ts
export const useEmergencyAuth = () => {
  const signInAnonymouslyForEmergency = async () => {
    try {
      // Create anonymous session for emergency access
      const { data, error } = await supabase.auth.signInAnonymously({
        options: {
          data: {
            emergency_access: true,
            session_type: 'emergency',
            created_at: new Date().toISOString()
          }
        }
      });

      if (error) throw error;
      
      // Enable location sharing immediately
      await enableLocationSharingForEmergency(data.user.id);
      
      return { user: data.user, session: data.session };
    } catch (error) {
      console.error('Emergency auth failed:', error);
      throw error;
    }
  };
};
```

---

## 🔄 Real-time Features

### Supabase Subscriptions

#### Location Tracking
```typescript
// Real-time location updates
useEffect(() => {
  const subscription = supabase
    .channel('location_changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'locations',
        filter: 'is_sharing=eq.true'
      }, 
      (payload) => {
        handleLocationUpdate(payload);
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

#### Emergency Report Updates
```typescript
// Real-time emergency updates
useEffect(() => {
  const subscription = supabase
    .channel('emergency_updates')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'emergency_reports'
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          handleNewEmergency(payload.new);
          showEmergencyNotification(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          handleEmergencyUpdate(payload.new);
        }
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
}, []);
```

### Ambulance Dispatching Logic

#### Auto-dispatch Algorithm
```typescript
export const dispatchNearestAmbulance = async (
  emergencyLat: number,
  emergencyLng: number,
  emergencyId: string
) => {
  try {
    // 1. Get all available ambulances with their locations
    const { data: ambulances } = await supabase
      .from('ambulance_tracking')
      .select('*')
      .eq('status', 'available')
      .order('last_updated', { ascending: false });

    if (!ambulances || ambulances.length === 0) {
      throw new Error('No ambulances available');
    }

    // 2. Calculate distances and find nearest
    const ambulancesWithDistance = ambulances.map(ambulance => {
      const distance = calculateDistance(
        emergencyLat, emergencyLng,
        ambulance.current_location.x, 
        ambulance.current_location.y
      );
      return { ...ambulance, distance };
    });

    const nearestAmbulance = ambulancesWithDistance
      .sort((a, b) => a.distance - b.distance)[0];

    // 3. Create dispatch record
    const { data: dispatch, error } = await supabase
      .from('emergency_dispatches')
      .insert({
        emergency_report_id: emergencyId,
        ambulance_id: nearestAmbulance.ambulance_id,
        distance_km: nearestAmbulance.distance,
        estimated_arrival: calculateETA(nearestAmbulance.distance),
        status: 'dispatched'
      })
      .select()
      .single();

    // 4. Update ambulance status
    await supabase
      .from('ambulance_tracking')
      .update({ status: 'dispatched' })
      .eq('ambulance_id', nearestAmbulance.ambulance_id);

    // 5. Update emergency report status  
    await supabase
      .from('emergency_reports')
      .update({ status: 'dispatched' })
      .eq('id', emergencyId);

    return dispatch;
  } catch (error) {
    console.error('Dispatch failed:', error);
    throw error;
  }
};
```

---

## 🗺️ Maps & Geolocation

### Leaflet Integration

#### Map Configuration
```typescript
// src/components/maps/LeafletMap.tsx
const mapConfig = {
  center: [-6.2088, 106.8456] as LatLngTuple, // Jakarta
  zoom: 13,
  minZoom: 8,
  maxZoom: 18,
  zoomControl: false,
  attributionControl: false
};

const tileLayerConfig = {
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
};
```

#### Custom Markers
```typescript
// Emergency location marker
const emergencyIcon = new Icon({
  iconUrl: '/emergency-marker.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Ambulance marker with rotation
const createAmbulanceIcon = (rotation: number) => {
  return new DivIcon({
    html: `
      <div style="transform: rotate(${rotation}deg)">
        🚑
      </div>
    `,
    className: 'ambulance-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};
```

#### Route Calculation
```typescript
// Using Leaflet Routing Machine
const routingControl = L.Routing.control({
  waypoints: [
    L.latLng(ambulanceLat, ambulanceLng),
    L.latLng(emergencyLat, emergencyLng)
  ],
  routeWhileDragging: false,
  addWaypoints: false,
  createMarker: () => null, // Don't create default markers
  lineOptions: {
    styles: [{ color: '#ff0000', weight: 4, opacity: 0.8 }]
  }
});
```

### Geolocation Services

#### High-Accuracy GPS
```typescript
const watchLocationWithHighAccuracy = () => {
  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 30000 // 30 seconds
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy, altitude } = position.coords;
      
      updateLocationInDatabase({
        latitude,
        longitude, 
        accuracy,
        altitude,
        timestamp: new Date().toISOString()
      });
    },
    (error) => {
      handleGeolocationError(error);
    },
    options
  );
};
```

---

## 📊 Performance Optimization

### Database Optimization

#### Indexing Strategy
```sql
-- Composite indexes for common queries
CREATE INDEX idx_emergency_reports_status_created 
ON emergency_reports(status, created_at);

CREATE INDEX idx_ambulance_tracking_status_location 
ON ambulance_tracking(status) 
INCLUDE (current_location, last_updated);

-- Partial indexes for active data
CREATE INDEX idx_active_emergencies 
ON emergency_reports(created_at) 
WHERE status IN ('pending', 'dispatched', 'en_route');

-- GiST index for geospatial queries
CREATE INDEX idx_locations_gist 
ON locations USING GIST(
  ll_to_earth(latitude, longitude)
);
```

#### Query Optimization
```sql
-- Optimized query for nearby ambulances
SELECT 
    a.*,
    earth_distance(
        ll_to_earth(a.latitude, a.longitude),
        ll_to_earth($1, $2)
    ) as distance_meters
FROM ambulance_tracking a
WHERE 
    a.status = 'available' 
    AND earth_distance(
        ll_to_earth(a.latitude, a.longitude),
        ll_to_earth($1, $2)
    ) < 10000 -- 10km radius
ORDER BY distance_meters
LIMIT 5;
```

### Frontend Performance

#### Component Lazy Loading
```typescript
// Lazy load heavy components
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AmbulancePage = lazy(() => import('./pages/AmbulancePage'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <AdminDashboard />
</Suspense>
```

#### React Query Optimization
```typescript
// Optimized emergency reports query
export const useEmergencyReports = () => {
  return useQuery({
    queryKey: ['emergency-reports'],
    queryFn: fetchEmergencyReports,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchInterval: 60 * 1000, // 1 minute
  });
};
```

#### Memory Management
```typescript
// Proper cleanup for real-time subscriptions
useEffect(() => {
  const subscription = supabase
    .channel('emergency_channel')
    .on('postgres_changes', { /* config */ }, handleUpdate)
    .subscribe();

  // Cleanup on unmount
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Emergency dispatch logic test
describe('Emergency Dispatching', () => {
  test('should dispatch nearest available ambulance', async () => {
    const mockAmbulances = [
      { id: 'AMB-001', lat: -6.2088, lng: 106.8456, status: 'available' },
      { id: 'AMB-002', lat: -6.2100, lng: 106.8500, status: 'available' }
    ];

    const emergencyLocation = { lat: -6.2090, lng: 106.8460 };
    
    const result = await dispatchNearestAmbulance(
      emergencyLocation.lat, 
      emergencyLocation.lng,
      'emergency-123'
    );

    expect(result.ambulance_id).toBe('AMB-001'); // Nearest one
    expect(result.status).toBe('dispatched');
  });
});
```

### Integration Tests
```typescript
// Real-time updates test
describe('Real-time Emergency Updates', () => {
  test('should receive location updates in real-time', (done) => {
    const subscription = supabase
      .channel('test_channel')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'locations' 
      }, (payload) => {
        expect(payload.new.latitude).toBeDefined();
        expect(payload.new.longitude).toBeDefined();
        done();
      })
      .subscribe();

    // Trigger update
    updateLocationInDatabase({
      latitude: -6.2088,
      longitude: 106.8456
    });
  });
});
```

---

## 📈 Monitoring & Analytics

### Performance Metrics
```typescript
// Performance monitoring
const trackPerformanceMetric = (metricName: string, value: number) => {
  // Send to analytics service
  analytics.track('performance_metric', {
    metric: metricName,
    value,
    timestamp: Date.now(),
    user_agent: navigator.userAgent,
    connection: (navigator as any).connection?.effectiveType
  });
};

// Response time tracking
const trackResponseTime = (emergencyId: string, dispatchTime: number, arrivalTime: number) => {
  const responseTime = arrivalTime - dispatchTime;
  
  trackPerformanceMetric('emergency_response_time', responseTime);
  
  // Store in database for analysis
  supabase
    .from('emergency_dispatches')
    .update({ response_time_minutes: responseTime / (1000 * 60) })
    .eq('emergency_report_id', emergencyId);
};
```

### Error Tracking
```typescript
// Global error handler
window.addEventListener('error', (event) => {
  const errorInfo = {
    message: event.error?.message,
    stack: event.error?.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: new Date().toISOString(),
    user_id: getCurrentUser()?.id
  };

  // Send to error tracking service
  reportError(errorInfo);
});

// React Error Boundary
class EmergencyErrorBoundary extends Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportError({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## 🚀 Deployment & DevOps

### Supabase Edge Functions

#### Voice-to-Text Function
```typescript
// supabase/functions/voice-to-text/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { audioData, language = 'id-ID' } = await req.json();
    
    // Process audio with speech recognition API
    const transcription = await processVoiceToText(audioData, language);
    
    // Extract emergency keywords and classify
    const emergencyInfo = await classifyEmergency(transcription);
    
    return new Response(
      JSON.stringify({ 
        transcription, 
        emergencyInfo,
        success: true 
      }),
      { 
        headers: { "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    );
  }
});
```

### Environment Configuration
```typescript
// Environment variables (stored in Supabase)
export const CONFIG = {
  SUPABASE_URL: 'https://ptjycinvxpzifplxpmwp.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  
  // Feature flags
  FEATURES: {
    VOICE_REPORTING: true,
    REAL_TIME_TRACKING: true,
    OFFLINE_MODE: false,
    ADVANCED_ANALYTICS: true
  },
  
  // Performance settings
  PERFORMANCE: {
    LOCATION_UPDATE_INTERVAL: 5000, // 5 seconds
    MAP_REFRESH_INTERVAL: 10000,    // 10 seconds
    CHAT_POLL_INTERVAL: 2000        // 2 seconds
  }
};
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Emergency System

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build application
        run: npm run build
        
      - name: Deploy to Supabase
        run: npx supabase deploy
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

---

## 🔍 Debug & Troubleshooting

### Common Issues

#### 1. Real-time Connection Issues
```typescript
// Debug real-time connectivity
const debugRealtime = () => {
  const channel = supabase.channel('debug');
  
  channel.on('system', {}, (payload) => {
    console.log('Realtime status:', payload);
  });
  
  channel.subscribe((status) => {
    console.log('Subscription status:', status);
  });
};
```

#### 2. GPS Accuracy Problems
```typescript
// Enhanced GPS with fallback
const getLocationWithFallback = async () => {
  try {
    // Try high accuracy first
    const position = await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    return position;
  } catch (error) {
    console.warn('High accuracy failed, trying standard GPS');
    
    // Fallback to standard accuracy
    return await getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 15000
    });
  }
};
```

#### 3. Database Connection Monitoring
```typescript
// Monitor database connection health
const monitorDatabaseHealth = () => {
  setInterval(async () => {
    try {
      const { data, error } = await supabase
        .from('emergency_reports')
        .select('count')
        .limit(1);
        
      if (error) {
        console.error('Database health check failed:', error);
        showConnectionWarning();
      } else {
        hideConnectionWarning();
      }
    } catch (error) {
      console.error('Database connection lost:', error);
      handleConnectionLoss();
    }
  }, 30000); // Every 30 seconds
};
```

---

## 🔧 Development Guidelines

### Code Style
```typescript
// Use consistent naming conventions
interface EmergencyReport {
  id: string;
  userId: string;
  reportType: EmergencyType;
  severity: SeverityLevel;
  location: LocationCoordinates;
  timestamp: Date;
}

// Prefer explicit types over any
type EmergencyType = 'trauma' | 'cardiac' | 'stroke' | 'burn' | 'general';
type SeverityLevel = 'ringan' | 'sedang' | 'berat' | 'kritis';

// Use proper error handling
const handleEmergencyReport = async (report: EmergencyReport): Promise<DispatchResult> => {
  try {
    const validation = validateEmergencyReport(report);
    if (!validation.isValid) {
      throw new EmergencyValidationError(validation.errors);
    }
    
    const dispatch = await dispatchEmergency(report);
    return { success: true, dispatch };
  } catch (error) {
    console.error('Emergency dispatch failed:', error);
    
    if (error instanceof EmergencyValidationError) {
      return { success: false, error: 'Invalid emergency data' };
    }
    
    return { success: false, error: 'Dispatch system unavailable' };
  }
};
```

### Component Architecture
```typescript
// Separate concerns with custom hooks
const useEmergencySystem = () => {
  const { reports, loading, error } = useEmergencyReports();
  const { dispatch } = useEmergencyDispatch();
  const { location } = useUserLocation();
  
  const handleEmergency = useCallback(async (type: EmergencyType) => {
    if (!location) {
      throw new Error('Location required for emergency reporting');
    }
    
    return await dispatch({
      type,
      location,
      timestamp: new Date()
    });
  }, [dispatch, location]);
  
  return {
    reports,
    loading,
    error,
    handleEmergency
  };
};

// Use the hook in components
const EmergencyDashboard: React.FC = () => {
  const { reports, handleEmergency } = useEmergencySystem();
  
  return (
    <div>
      <EmergencyButtons onEmergency={handleEmergency} />
      <EmergencyList reports={reports} />
    </div>
  );
};
```

---

**📚 Dokumentasi ini akan terus diperbarui seiring dengan pengembangan sistem. Untuk pertanyaan teknis lebih lanjut, hubungi tim development.**