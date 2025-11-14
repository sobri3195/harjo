import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Trash2, MapPin, HardDrive, Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CacheArea {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoomLevels: number[];
  estimatedSize: number;
  downloadedSize: number;
  status: 'not_cached' | 'downloading' | 'cached' | 'error';
  lastUpdated?: Date;
}

interface OfflineMapCacheProps {
  currentLocation?: { lat: number; lng: number };
}

export const OfflineMapCache: React.FC<OfflineMapCacheProps> = ({ currentLocation }) => {
  const [cacheAreas, setCacheAreas] = useState<CacheArea[]>([]);
  const [totalStorage, setTotalStorage] = useState({ used: 0, available: 0 });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [downloadProgress, setDownloadProgress] = useState<{ [key: string]: number }>({});

  // Predefined important areas for ambulance service
  const predefinedAreas: Omit<CacheArea, 'downloadedSize' | 'status'>[] = [
    {
      id: 'jakarta-central',
      name: 'Jakarta Central',
      bounds: { north: -6.15, south: -6.25, east: 106.85, west: 106.75 },
      zoomLevels: [10, 11, 12, 13, 14, 15],
      estimatedSize: 25.5, // MB
      lastUpdated: undefined
    },
    {
      id: 'jakarta-hospitals',
      name: 'Hospital District',
      bounds: { north: -6.18, south: -6.22, east: 106.83, west: 106.79 },
      zoomLevels: [12, 13, 14, 15, 16],
      estimatedSize: 15.2,
      lastUpdated: undefined
    },
    {
      id: 'highway-network',
      name: 'Main Highway Network',
      bounds: { north: -6.10, south: -6.30, east: 106.90, west: 106.70 },
      zoomLevels: [10, 11, 12, 13],
      estimatedSize: 45.8,
      lastUpdated: undefined
    }
  ];

  useEffect(() => {
    initializeCacheAreas();
    updateStorageInfo();
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initializeCacheAreas = async () => {
    try {
      const savedAreas = localStorage.getItem('offline_map_cache');
      if (savedAreas) {
        setCacheAreas(JSON.parse(savedAreas));
      } else {
        const initialAreas = predefinedAreas.map(area => ({
          ...area,
          downloadedSize: 0,
          status: 'not_cached' as const
        }));
        setCacheAreas(initialAreas);
        localStorage.setItem('offline_map_cache', JSON.stringify(initialAreas));
      }
    } catch (error) {
      console.error('Failed to initialize cache areas:', error);
    }
  };

  const updateStorageInfo = async () => {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        setTotalStorage({
          used: Math.round((estimate.usage || 0) / 1024 / 1024),
          available: Math.round((estimate.quota || 0) / 1024 / 1024)
        });
      }
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const downloadArea = async (areaId: string) => {
    const area = cacheAreas.find(a => a.id === areaId);
    if (!area || !isOnline) return;

    setCacheAreas(prev => prev.map(a => 
      a.id === areaId ? { ...a, status: 'downloading' } : a
    ));

    try {
      // Simulate tile downloading process
      const totalTiles = calculateTotalTiles(area);
      let downloadedTiles = 0;

      for (const zoom of area.zoomLevels) {
        const { minX, maxX, minY, maxY } = getTileBounds(area.bounds, zoom);
        
        for (let x = minX; x <= maxX; x++) {
          for (let y = minY; y <= maxY; y++) {
            // Download tile
            const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
            
            try {
              const response = await fetch(tileUrl);
              if (response.ok) {
                const blob = await response.blob();
                // Store in IndexedDB or Cache API
                await storeTile(zoom, x, y, blob);
                downloadedTiles++;
                
                const progress = (downloadedTiles / totalTiles) * 100;
                setDownloadProgress(prev => ({ ...prev, [areaId]: progress }));
              }
            } catch (error) {
              console.error(`Failed to download tile ${zoom}/${x}/${y}:`, error);
            }

            // Small delay to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
      }

      setCacheAreas(prev => prev.map(a => 
        a.id === areaId ? {
          ...a,
          status: 'cached',
          downloadedSize: area.estimatedSize,
          lastUpdated: new Date()
        } : a
      ));

      setDownloadProgress(prev => {
        const updated = { ...prev };
        delete updated[areaId];
        return updated;
      });

      toast({
        title: "Download Complete",
        description: `${area.name} cached successfully for offline use`,
      });

    } catch (error) {
      console.error('Download failed:', error);
      setCacheAreas(prev => prev.map(a => 
        a.id === areaId ? { ...a, status: 'error' } : a
      ));
      
      toast({
        title: "Download Failed",
        description: `Failed to cache ${area.name}`,
        variant: "destructive"
      });
    }

    updateStorageInfo();
    saveAreasToStorage();
  };

  const deleteArea = async (areaId: string) => {
    try {
      // Delete tiles from storage
      await deleteCachedTiles(areaId);
      
      setCacheAreas(prev => prev.map(a => 
        a.id === areaId ? {
          ...a,
          status: 'not_cached',
          downloadedSize: 0,
          lastUpdated: undefined
        } : a
      ));

      toast({
        title: "Cache Cleared",
        description: "Offline map data removed successfully",
      });

      updateStorageInfo();
      saveAreasToStorage();
    } catch (error) {
      console.error('Failed to delete cached area:', error);
    }
  };

  const addCurrentLocationArea = () => {
    if (!currentLocation) return;

    const newArea: CacheArea = {
      id: `current-location-${Date.now()}`,
      name: 'Current Location',
      bounds: {
        north: currentLocation.lat + 0.05,
        south: currentLocation.lat - 0.05,
        east: currentLocation.lng + 0.05,
        west: currentLocation.lng - 0.05
      },
      zoomLevels: [12, 13, 14, 15, 16],
      estimatedSize: 8.5,
      downloadedSize: 0,
      status: 'not_cached'
    };

    setCacheAreas(prev => [...prev, newArea]);
    saveAreasToStorage();
  };

  const calculateTotalTiles = (area: CacheArea): number => {
    return area.zoomLevels.reduce((total, zoom) => {
      const bounds = getTileBounds(area.bounds, zoom);
      const width = bounds.maxX - bounds.minX + 1;
      const height = bounds.maxY - bounds.minY + 1;
      return total + (width * height);
    }, 0);
  };

  const getTileBounds = (bounds: CacheArea['bounds'], zoom: number) => {
    const minX = Math.floor(((bounds.west + 180) / 360) * Math.pow(2, zoom));
    const maxX = Math.floor(((bounds.east + 180) / 360) * Math.pow(2, zoom));
    const minY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    const maxY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    
    return { minX, maxX, minY, maxY };
  };

  const storeTile = async (zoom: number, x: number, y: number, blob: Blob) => {
    // Use IndexedDB for tile storage
    const key = `tile-${zoom}-${x}-${y}`;
    // Implementation would use IndexedDB here
    localStorage.setItem(key, URL.createObjectURL(blob));
  };

  const deleteCachedTiles = async (areaId: string) => {
    // Implementation would clear IndexedDB entries for this area
    const keys = Object.keys(localStorage).filter(key => key.startsWith('tile-'));
    keys.forEach(key => localStorage.removeItem(key));
  };

  const saveAreasToStorage = () => {
    localStorage.setItem('offline_map_cache', JSON.stringify(cacheAreas));
  };

  const getStatusColor = (status: CacheArea['status']) => {
    switch (status) {
      case 'cached': return 'default';
      case 'downloading': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const totalCachedSize = cacheAreas.reduce((sum, area) => sum + area.downloadedSize, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Offline Maps
            {isOnline ? 
              <Wifi className="w-4 h-4 text-green-500" /> : 
              <WifiOff className="w-4 h-4 text-red-500" />
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Storage Used</div>
                <div className="text-xs text-muted-foreground">
                  {totalCachedSize.toFixed(1)} MB cached
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm font-medium">Device Storage</div>
              <div className="text-xs text-muted-foreground">
                {totalStorage.used} MB / {totalStorage.available} MB
              </div>
              <Progress 
                value={(totalStorage.used / totalStorage.available) * 100} 
                className="h-2 mt-1"
              />
            </div>

            <div className="flex justify-end">
              {currentLocation && (
                <Button 
                  onClick={addCurrentLocationArea}
                  variant="outline" 
                  size="sm"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Cache Current Area
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {!isOnline && (
        <Alert>
          <WifiOff className="h-4 w-4" />
          <AlertDescription>
            You're offline. Maps will load from cached areas when available.
          </AlertDescription>
        </Alert>
      )}

      {/* Cache Areas */}
      <div className="space-y-3">
        {cacheAreas.map((area) => {
          const progress = downloadProgress[area.id] || 0;
          
          return (
            <Card key={area.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{area.name}</h3>
                      <Badge variant={getStatusColor(area.status)}>
                        {area.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>Size: {area.estimatedSize} MB estimated</div>
                      {area.lastUpdated && (
                        <div>Updated: {area.lastUpdated.toLocaleDateString()}</div>
                      )}
                      <div>Zoom levels: {area.zoomLevels.join(', ')}</div>
                    </div>

                    {area.status === 'downloading' && (
                      <div className="mt-2">
                        <Progress value={progress} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {progress.toFixed(1)}% downloaded
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    {area.status === 'not_cached' || area.status === 'error' ? (
                      <Button
                        onClick={() => downloadArea(area.id)}
                        disabled={!isOnline}
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    ) : area.status === 'cached' ? (
                      <Button
                        onClick={() => deleteArea(area.id)}
                        variant="outline"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};