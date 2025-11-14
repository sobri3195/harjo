import React, { useState } from 'react';
import { Download, Wifi, WifiOff, HardDrive, Trash2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOfflineMapCache } from '@/hooks/useOfflineMapCache';

export const OfflineMapManager = () => {
  const {
    isOnline,
    cacheStats,
    isLoading,
    downloadAreaForOfflineUse,
    clearExpiredCache,
    clearAllCache,
    loadCacheStats
  } = useOfflineMapCache();

  const [downloadBounds, setDownloadBounds] = useState({
    north: -6.2,
    south: -6.3,
    east: 106.9,
    west: 106.8
  });
  const [maxZoom, setMaxZoom] = useState(15);

  const handleDownloadArea = async () => {
    await downloadAreaForOfflineUse(downloadBounds, maxZoom);
  };

  const formatFileSize = (mb: number) => {
    if (mb < 1) return `${(mb * 1024).toFixed(0)} KB`;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive size={20} />
          Offline Maps Manager
          <Badge className={`ml-auto ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isOnline ? (
              <>
                <Wifi size={12} className="mr-1" />
                Online
              </>
            ) : (
              <>
                <WifiOff size={12} className="mr-1" />
                Offline
              </>
            )}
          </Badge>
        </CardTitle>
        <CardDescription>
          Download map tiles for offline emergency navigation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Cache Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <HardDrive size={16} />
            Cache Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-700">Total Tiles</p>
              <p className="text-2xl font-bold text-blue-600">{cacheStats.totalTiles.toLocaleString()}</p>
            </div>
            <div>
              <p className="font-medium text-gray-700">Cache Size</p>
              <p className="text-2xl font-bold text-green-600">{formatFileSize(cacheStats.cacheSize)}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={loadCacheStats}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button
              onClick={clearExpiredCache}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Trash2 size={14} />
              Clear Expired
            </Button>
            <Button
              onClick={clearAllCache}
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <Trash2 size={14} />
              Clear All
            </Button>
          </div>
        </div>

        {/* Download Area Settings */}
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Download size={16} />
            Download Map Area
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="north">North (Latitude)</Label>
              <Input
                id="north"
                type="number"
                step="0.001"
                value={downloadBounds.north}
                onChange={(e) => setDownloadBounds(prev => ({ ...prev, north: parseFloat(e.target.value) }))}
                disabled={!isOnline || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="south">South (Latitude)</Label>
              <Input
                id="south"
                type="number"
                step="0.001"
                value={downloadBounds.south}
                onChange={(e) => setDownloadBounds(prev => ({ ...prev, south: parseFloat(e.target.value) }))}
                disabled={!isOnline || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="east">East (Longitude)</Label>
              <Input
                id="east"
                type="number"
                step="0.001"
                value={downloadBounds.east}
                onChange={(e) => setDownloadBounds(prev => ({ ...prev, east: parseFloat(e.target.value) }))}
                disabled={!isOnline || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="west">West (Longitude)</Label>
              <Input
                id="west"
                type="number"
                step="0.001"
                value={downloadBounds.west}
                onChange={(e) => setDownloadBounds(prev => ({ ...prev, west: parseFloat(e.target.value) }))}
                disabled={!isOnline || isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="maxZoom">Maximum Zoom Level (10-18)</Label>
            <Input
              id="maxZoom"
              type="number"
              min="10"
              max="18"
              value={maxZoom}
              onChange={(e) => setMaxZoom(parseInt(e.target.value))}
              disabled={!isOnline || isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Higher zoom = more detail but larger download size
            </p>
          </div>
        </div>

        {/* Download Progress */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Downloading map tiles...</span>
              <span>Please wait</span>
            </div>
            <Progress value={undefined} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadArea}
            disabled={!isOnline || isLoading}
            className="flex-1 flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download Area
              </>
            )}
          </Button>
        </div>

        {/* Preset Areas */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Quick Download Presets</h4>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => setDownloadBounds({
                north: -6.2465,
                south: -6.2865,
                east: 106.9101,
                west: 106.8701
              })}
              variant="outline"
              size="sm"
              disabled={!isOnline || isLoading}
            >
              📍 RSPAU Area (Halim)
            </Button>
            <Button
              onClick={() => setDownloadBounds({
                north: -6.1644,
                south: -6.2044,
                east: 106.8672,
                west: 106.8272
              })}
              variant="outline"
              size="sm"
              disabled={!isOnline || isLoading}
            >
              🏥 Jakarta Central Hospitals
            </Button>
          </div>
        </div>

        {/* Offline Notice */}
        {!isOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-orange-800 mb-2">
              <WifiOff size={16} />
              <span className="font-medium">Offline Mode</span>
            </div>
            <p className="text-sm text-orange-700">
              You're currently offline. Map downloads are not available, but you can still use cached tiles.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📱 Offline Navigation</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Download areas before going to remote locations</li>
            <li>• Cached tiles work without internet connection</li>
            <li>• Emergency routes will use offline maps when available</li>
            <li>• Tiles expire after 7 days and need re-downloading</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};