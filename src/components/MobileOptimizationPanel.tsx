import React, { useState } from 'react';
import { Battery, Wifi, WifiOff, Smartphone, RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';

export const MobileOptimizationPanel = () => {
  const {
    isOnline,
    batteryInfo,
    networkInfo,
    syncQueue,
    backgroundSyncEnabled,
    processSyncQueue,
    getOptimizationRecommendations,
    loadSyncQueue
  } = useMobileOptimization();

  const [isProcessing, setIsProcessing] = useState(false);
  const recommendations = getOptimizationRecommendations();

  const handleProcessSync = async () => {
    setIsProcessing(true);
    await processSyncQueue();
    await loadSyncQueue();
    setIsProcessing(false);
  };

  const getBatteryColor = (level: number) => {
    if (level > 50) return 'text-green-600';
    if (level > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getNetworkBadge = () => {
    if (!isOnline) {
      return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
        <WifiOff size={12} />
        Offline
      </Badge>;
    }

    const type = networkInfo?.type || 'unknown';
    const color = type === 'wifi' ? 'bg-green-100 text-green-800' : 
                  type === '4g' || type === '5g' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800';

    return <Badge className={`${color} flex items-center gap-1`}>
      <Wifi size={12} />
      {type.toUpperCase()}
    </Badge>;
  };

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <CheckCircle size={12} />
          Completed
        </Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <AlertTriangle size={12} />
          Failed
        </Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
          <RefreshCw size={12} className="animate-spin" />
          Processing
        </Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 flex items-center gap-1">
          <Clock size={12} />
          Pending
        </Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📱 Mobile Optimization</h2>
        <p className="text-gray-600">Monitor device status and optimize for emergency response</p>
      </div>

      {/* Optimization Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <Alert key={index} className={`${
              rec.severity === 'high' ? 'border-red-200 bg-red-50' :
              rec.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
              'border-blue-200 bg-blue-50'
            }`}>
              <AlertTriangle className={`h-4 w-4 ${
                rec.severity === 'high' ? 'text-red-600' :
                rec.severity === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`} />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">{rec.message}</p>
                  <p className="text-sm opacity-75">{rec.action}</p>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Device Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Network Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                Network Status
              </span>
              {getNetworkBadge()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Connection:</span>
                <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              {networkInfo && (
                <>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className="font-medium">{networkInfo.type || 'Unknown'}</span>
                  </div>
                  {networkInfo.downlink && (
                    <div className="flex justify-between">
                      <span>Speed:</span>
                      <span className="font-medium">{networkInfo.downlink} Mbps</span>
                    </div>
                  )}
                  {networkInfo.rtt && (
                    <div className="flex justify-between">
                      <span>Latency:</span>
                      <span className="font-medium">{networkInfo.rtt}ms</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Battery Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <Battery size={16} />
                Battery Status
              </span>
              {batteryInfo && (
                <Badge className={`${
                  batteryInfo.level > 50 ? 'bg-green-100 text-green-800' :
                  batteryInfo.level > 20 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {batteryInfo.level}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {batteryInfo ? (
              <>
                <Progress 
                  value={batteryInfo.level} 
                  className={`h-2 ${
                    batteryInfo.level > 50 ? 'bg-green-100' :
                    batteryInfo.level > 20 ? 'bg-yellow-100' :
                    'bg-red-100'
                  }`}
                />
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Level:</span>
                    <span className={`font-medium ${getBatteryColor(batteryInfo.level)}`}>
                      {batteryInfo.level}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Charging:</span>
                    <span className="font-medium">
                      {batteryInfo.charging ? '🔌 Yes' : '🔋 No'}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">
                Battery information not available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Background Sync */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <RefreshCw size={16} />
                Background Sync
              </span>
              <Badge className={`${
                backgroundSyncEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {backgroundSyncEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Queue Items:</span>
                <span className="font-medium">{syncQueue.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-medium">
                  {backgroundSyncEnabled ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {syncQueue.length > 0 && (
              <Button
                onClick={handleProcessSync}
                disabled={!isOnline || isProcessing}
                size="sm"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={14} className="mr-2" />
                    Process Queue
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Queue Details */}
      {syncQueue.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock size={20} />
              Sync Queue ({syncQueue.length} items)
            </CardTitle>
            <CardDescription>
              Items waiting to be synchronized when connection is available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {syncQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {item.action_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      {getSyncStatusBadge(item.status)}
                    </div>
                    <div className="text-xs text-gray-600">
                      Priority: {item.priority} | Retries: {item.retry_count}/{item.max_retries}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {new Date(item.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                  
                  {item.error_message && (
                    <div className="text-xs text-red-600 max-w-32 truncate" title={item.error_message}>
                      Error: {item.error_message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone size={20} />
            Mobile Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">🔋 Battery Optimization</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Enable battery saver when level drops below 20%</li>
                <li>• Reduce GPS update frequency on low battery</li>
                <li>• Close unused background apps</li>
                <li>• Lower screen brightness</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">📶 Network Optimization</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Use WiFi when available for data-heavy operations</li>
                <li>• Enable data compression on slow connections</li>
                <li>• Queue emergency reports when offline</li>
                <li>• Prioritize critical communications</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};