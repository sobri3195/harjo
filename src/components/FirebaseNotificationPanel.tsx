import React from 'react';
import { Bell, BellRing, TestTube, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirebaseNotifications } from '@/hooks/useFirebaseNotifications';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FirebaseNotificationPanelProps {
  variant?: 'full' | 'compact';
  showTestButton?: boolean;
}

const FirebaseNotificationPanel: React.FC<FirebaseNotificationPanelProps> = ({ 
  variant = 'full',
  showTestButton = true 
}) => {
  const {
    isSupported,
    isPermissionGranted,
    fcmToken,
    isInitialized,
    requestPermission,
    sendTestNotification
  } = useFirebaseNotifications();

  if (!isInitialized) {
    return (
      <Card className="border-l-4 border-l-gray-400">
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            Initializing notifications...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
        <div className="flex items-center gap-2">
          {isPermissionGranted ? (
            <BellRing className="w-5 h-5 text-green-600 animate-pulse" />
          ) : (
            <Bell className="w-5 h-5 text-gray-500" />
          )}
          <div>
            <div className="font-medium text-sm">
              Firebase Notifications
            </div>
            <div className="text-xs text-gray-600">
              {isPermissionGranted ? 'Active & Ready' : 'Click to enable'}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isPermissionGranted ? (
            <Badge className="bg-green-100 text-green-800 text-xs">
              Enabled
            </Badge>
          ) : (
            <Button size="sm" onClick={requestPermission} className="text-xs">
              Enable
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card className={`border-l-4 ${isPermissionGranted ? 'border-l-green-500' : 'border-l-orange-500'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {isPermissionGranted ? (
              <BellRing className="w-5 h-5 text-green-600" />
            ) : (
              <Bell className="w-5 h-5 text-orange-600" />
            )}
            Firebase Push Notifications
          </div>
          <Badge 
            variant={isPermissionGranted ? "default" : "secondary"}
            className={isPermissionGranted ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
          >
            {isPermissionGranted ? "Active" : "Disabled"}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3">
        {!isPermissionGranted ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Enable push notifications to receive real-time emergency alerts even when the app is in the background.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Push notifications are active. You'll receive emergency alerts instantly.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          {!isPermissionGranted ? (
            <Button 
              onClick={requestPermission}
              className="flex items-center gap-2"
              size="sm"
            >
              <BellRing className="w-4 h-4" />
              Enable Notifications
            </Button>
          ) : (
            <>
              {showTestButton && (
                <Button 
                  onClick={sendTestNotification}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <TestTube className="w-4 h-4" />
                  Test Alert
                </Button>
              )}
              
              <Button 
                onClick={() => {
                  // Reset permission (user will need to manually disable in browser)
                  window.location.reload();
                }}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-gray-600"
              >
                <X className="w-4 h-4" />
                Refresh
              </Button>
            </>
          )}
        </div>

        {/* Status Details */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div className="grid grid-cols-2 gap-2">
            <div>Browser Support: {isSupported ? '✅' : '❌'}</div>
            <div>Permission: {isPermissionGranted ? '✅' : '❌'}</div>
            <div>FCM Token: {fcmToken ? '✅' : '❌'}</div>
            <div>Service Worker: {'serviceWorker' in navigator ? '✅' : '❌'}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FirebaseNotificationPanel;