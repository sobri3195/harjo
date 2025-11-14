import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLocationSharing } from '@/hooks/useLocationSharing';
import { useRealtimeAmbulanceTracking } from '@/hooks/useRealtimeAmbulanceTracking';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Users, 
  Truck, 
  Clock, 
  Navigation, 
  Wifi, 
  WifiOff,
  TestTube2,
  AlertCircle
} from 'lucide-react';

const TrackingTestPage: React.FC = () => {
  const [testRole, setTestRole] = useState<'user' | 'ambulance' | 'admin'>('user');
  const [testName, setTestName] = useState('Test User');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Location sharing hook
  const {
    allLocations,
    myLocation,
    isSharing,
    error: locationError,
    startSharing,
    stopSharing,
    getNearestLocation,
    getDistanceTo
  } = useLocationSharing({
    role: testRole,
    userName: testName,
    enabled: true,
    updateInterval: 3000 // Update every 3 seconds for testing
  });

  // Ambulance tracking hook
  const {
    ambulances,
    dispatches,
    isConnected: ambulanceConnected,
    getAmbulancesByProximity,
    dispatchNearestAmbulance,
    getActiveDispatches
  } = useRealtimeAmbulanceTracking();

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Test functions
  const simulateEmergencyDispatch = async () => {
    if (!myLocation) {
      toast({
        title: "No Location Available",
        description: "Please start sharing your location first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a test emergency report
      const { data: emergencyReport } = await supabase
        .from('emergency_reports')
        .insert({
          type: 'TEST_EMERGENCY',
          reporter_name: testName,
          reporter_rank: 'Test',
          reporter_phone: '000-000-0000',
          patient_name: 'Test Patient',
          location: 'Test Location',
          description: 'Test emergency for tracking verification',
          severity: 'medium',
          latitude: myLocation.lat,
          longitude: myLocation.lng,
          status: 'pending'
        })
        .select()
        .single();

      if (emergencyReport) {
        // Try to dispatch nearest ambulance
        await dispatchNearestAmbulance(
          emergencyReport.id,
          myLocation.lat,
          myLocation.lng
        );

        toast({
          title: "Test Dispatch Created",
          description: "Check if ambulance dispatch appears in real-time",
        });
      }
    } catch (error) {
      console.error('Test dispatch error:', error);
      toast({
        title: "Test Failed",
        description: "Could not create test dispatch",
        variant: "destructive"
      });
    }
  };

  const addTestAmbulanceLocation = async () => {
    if (!myLocation) {
      toast({
        title: "No Location Available",
        description: "Please start sharing your location first",
        variant: "destructive"
      });
      return;
    }

    try {
      // Add a test ambulance location near current position
      const testLat = myLocation.lat + (Math.random() - 0.5) * 0.01; // ~500m radius
      const testLng = myLocation.lng + (Math.random() - 0.5) * 0.01;

      await supabase
        .from('ambulance_tracking')
        .insert({
          ambulance_id: `TEST-AMB-${Date.now()}`,
          latitude: testLat,
          longitude: testLng,
          accuracy: 10,
          speed: Math.random() * 60,
          heading: Math.random() * 360,
          timestamp: new Date().toISOString()
        });

      toast({
        title: "Test Ambulance Added",
        description: "Check if it appears on all connected apps",
      });
    } catch (error) {
      console.error('Test ambulance error:', error);
      toast({
        title: "Test Failed",
        description: "Could not add test ambulance",
        variant: "destructive"
      });
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return `${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'user': return 'default';
      case 'ambulance': return 'destructive';
      case 'admin': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground mb-4">
              You need to be logged in to test location tracking.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'} 
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube2 className="h-5 w-5" />
              Cross-Application Tracking Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Test Role:</label>
                <div className="flex gap-2 mt-1">
                  {(['user', 'ambulance', 'admin'] as const).map((role) => (
                    <Button
                      key={role}
                      size="sm"
                      variant={testRole === role ? 'default' : 'outline'}
                      onClick={() => setTestRole(role)}
                    >
                      {role}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Test Name:</label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={isSharing ? stopSharing : startSharing}
                  variant={isSharing ? 'destructive' : 'default'}
                  className="w-full"
                >
                  {isSharing ? 'Stop' : 'Start'} Location Sharing
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {isSharing ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Location Sharing</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isSharing ? 'Active' : 'Inactive'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {ambulanceConnected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">Ambulance Tracking</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {ambulanceConnected ? 'Connected' : 'Disconnected'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Active Users</span>
              </div>
              <p className="text-lg font-bold">{allLocations.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">Ambulances</span>
              </div>
              <p className="text-lg font-bold">{ambulances.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Test Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button onClick={addTestAmbulanceLocation} variant="outline">
                <Truck className="h-4 w-4 mr-2" />
                Add Test Ambulance
              </Button>
              <Button onClick={simulateEmergencyDispatch} variant="outline">
                <AlertCircle className="h-4 w-4 mr-2" />
                Simulate Emergency Dispatch
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              These actions will create test data that should appear in real-time across all connected applications.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                My Location ({testRole})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myLocation ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Coordinates:</span>
                    <span className="text-sm font-mono">
                      {myLocation.lat.toFixed(6)}, {myLocation.lng.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Last Updated:</span>
                    <span className="text-sm">{formatTimeAgo(myLocation.last_seen)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Role:</span>
                    <Badge variant={getRoleBadgeColor(myLocation.role)}>
                      {myLocation.role}
                    </Badge>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No location data available</p>
              )}
              {locationError && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  Error: {locationError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All Shared Locations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                All Shared Locations ({allLocations.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {allLocations.map((location) => (
                  <div key={location.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(location.last_seen)}
                        </div>
                      </div>
                      <Badge variant={getRoleBadgeColor(location.role)}>
                        {location.role}
                      </Badge>
                    </div>
                    {myLocation && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Distance: {getDistanceTo(location.lat, location.lng)?.toFixed(2) || 'N/A'} km
                      </div>
                    )}
                  </div>
                ))}
                {allLocations.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No other users sharing location
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ambulance Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Ambulance Tracking ({ambulances.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {ambulances.map((ambulance) => (
                  <div key={ambulance.ambulance_id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{ambulance.ambulance_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(ambulance.timestamp)}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {ambulance.speed ? `${ambulance.speed.toFixed(0)} km/h` : 'Stationary'}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Coordinates: {ambulance.latitude.toFixed(6)}, {ambulance.longitude.toFixed(6)}
                    </div>
                  </div>
                ))}
                {ambulances.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No ambulances currently tracked
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Dispatches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Navigation className="h-5 w-5" />
                Active Dispatches ({getActiveDispatches().length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {getActiveDispatches().map((dispatch) => (
                  <div key={dispatch.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{dispatch.ambulance_id}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatTimeAgo(dispatch.dispatch_time)}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {dispatch.status}
                      </Badge>
                    </div>
                    {dispatch.eta_minutes && (
                      <div className="text-xs text-muted-foreground mt-1">
                        ETA: {dispatch.eta_minutes} minutes
                      </div>
                    )}
                  </div>
                ))}
                {getActiveDispatches().length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    No active dispatches
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold">1. Cross-Application Testing:</h4>
              <p className="text-sm text-muted-foreground">
                Open this test page in multiple browser tabs/windows with different roles (user, ambulance, admin). 
                Start location sharing and verify that locations appear in real-time across all instances.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold">2. Mobile App Testing:</h4>
              <p className="text-sm text-muted-foreground">
                Install the apps on different devices and verify that location updates appear across all platforms.
                Test with one device as ambulance and another as user/admin.
              </p>
            </div>
            <Separator />
            <div>
              <h4 className="font-semibold">3. Dispatch Testing:</h4>
              <p className="text-sm text-muted-foreground">
                Use "Simulate Emergency Dispatch" to test if ambulance dispatch works in real-time. 
                The nearest ambulance should be automatically assigned and status should update across all apps.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrackingTestPage;