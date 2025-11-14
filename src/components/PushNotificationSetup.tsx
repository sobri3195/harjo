import React from 'react';
import { Bell, BellOff, TestTube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const PushNotificationSetup = () => {
  const {
    isSupported,
    permission,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendTestNotification
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <BellOff size={20} />
            Push Notifications Not Supported
          </CardTitle>
          <CardDescription className="text-yellow-700">
            Your browser doesn't support push notifications or you're using HTTP instead of HTTPS.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">Enabled</Badge>;
      case 'denied':
        return <Badge className="bg-red-100 text-red-800">Blocked</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Not Set</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell size={20} />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get instant alerts for emergency situations and status updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notification Status</p>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'You will receive emergency alerts' : 'Enable notifications to receive alerts'}
            </p>
          </div>
          {getPermissionBadge()}
        </div>

        <div className="flex gap-2">
          {!isSubscribed ? (
            <Button onClick={subscribe} className="flex items-center gap-2">
              <Bell size={16} />
              Enable Notifications
            </Button>
          ) : (
            <Button 
              onClick={unsubscribe} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <BellOff size={16} />
              Disable Notifications
            </Button>
          )}

          {isSubscribed && (
            <Button 
              onClick={sendTestNotification}
              variant="secondary"
              className="flex items-center gap-2"
            >
              <TestTube size={16} />
              Test Notification
            </Button>
          )}
        </div>

        {permission === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Notifications Blocked</h4>
            <p className="text-sm text-red-700 mb-3">
              To enable notifications:
            </p>
            <ol className="text-sm text-red-700 list-decimal list-inside space-y-1">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Change notifications from "Block" to "Allow"</li>
              <li>Refresh this page and try again</li>
            </ol>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">🚨 Emergency Alerts</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Critical emergency reports</li>
            <li>• Ambulance dispatch updates</li>
            <li>• System-wide emergency broadcasts</li>
            <li>• Status changes for your reports</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};