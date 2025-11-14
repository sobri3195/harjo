import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from './use-toast';

interface MapTile {
  id: string;
  tile_url: string;
  tile_data: string; // base64 encoded
  zoom_level: number;
  x_coordinate: number;
  y_coordinate: number;
  created_at: string;
  expires_at: string;
}

interface CacheStats {
  totalTiles: number;
  cacheSize: number; // in MB
  lastUpdated: string;
}

export const useOfflineMapCache = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    totalTiles: 0,
    cacheSize: 0,
    lastUpdated: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cache statistics
  const loadCacheStats = async () => {
    try {
      const { data, error } = await supabase
        .from('maps_cache')
        .select('tile_url, created_at')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;

      setCacheStats({
        totalTiles: data?.length || 0,
        cacheSize: (data?.length || 0) * 0.1, // Estimate 100KB per tile
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  // Download map tiles for offline use
  const downloadAreaForOfflineUse = async (
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    maxZoom: number = 15
  ) => {
    if (!isOnline) {
      toast({
        title: "Offline Mode",
        description: "Cannot download maps while offline",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    let downloadedTiles = 0;
    const totalTiles = calculateTileCount(bounds, maxZoom);

    try {
      toast({
        title: "🗺️ Downloading Maps",
        description: `Downloading ${totalTiles} tiles for offline use...`,
      });

      for (let zoom = 10; zoom <= maxZoom; zoom++) {
        const tiles = getTileRange(bounds, zoom);
        
        for (let x = tiles.minX; x <= tiles.maxX; x++) {
          for (let y = tiles.minY; y <= tiles.maxY; y++) {
            await downloadTile(x, y, zoom);
            downloadedTiles++;
            
            // Update progress every 50 tiles
            if (downloadedTiles % 50 === 0) {
              toast({
                title: "📥 Download Progress",
                description: `Downloaded ${downloadedTiles}/${totalTiles} tiles`,
              });
            }
          }
        }
      }

      await loadCacheStats();
      
      toast({
        title: "✅ Download Complete",
        description: `Successfully cached ${downloadedTiles} map tiles`,
      });

    } catch (error) {
      console.error('Failed to download tiles:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download some map tiles",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Download a single tile
  const downloadTile = async (x: number, y: number, zoom: number) => {
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    
    try {
      // Check if tile already exists and is not expired
      const { data: existing } = await supabase
        .from('maps_cache')
        .select('id')
        .eq('tile_url', tileUrl)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (existing) return; // Tile already cached

      // Download tile
      const response = await fetch(tileUrl);
      if (!response.ok) throw new Error('Failed to fetch tile');

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Store in database
      const { error } = await supabase
        .from('maps_cache')
        .upsert({
          tile_url: tileUrl,
          tile_data: base64Data,
          zoom_level: zoom,
          x_coordinate: x,
          y_coordinate: y,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });

      if (error) throw error;
    } catch (error) {
      console.error(`Failed to download tile ${x}/${y}/${zoom}:`, error);
    }
  };

  // Get cached tile
  const getCachedTile = async (x: number, y: number, zoom: number): Promise<string | null> => {
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    
    try {
      const { data } = await supabase
        .from('maps_cache')
        .select('tile_data')
        .eq('tile_url', tileUrl)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (data) {
        return `data:image/png;base64,${data.tile_data}`;
      }
    } catch (error) {
      console.log('Tile not found in cache:', tileUrl);
    }
    
    return null;
  };

  // Clear expired cache
  const clearExpiredCache = async () => {
    try {
      const { error } = await supabase
        .from('maps_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) throw error;

      await loadCacheStats();
      
      toast({
        title: "🧹 Cache Cleaned",
        description: "Expired map tiles have been removed",
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear expired cache",
        variant: "destructive"
      });
    }
  };

  // Clear all cache
  const clearAllCache = async () => {
    try {
      const { error } = await supabase
        .from('maps_cache')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) throw error;

      await loadCacheStats();
      
      toast({
        title: "🗑️ Cache Cleared",
        description: "All cached map tiles have been removed",
      });
    } catch (error) {
      console.error('Failed to clear all cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache",
        variant: "destructive"
      });
    }
  };

  return {
    isOnline,
    cacheStats,
    isLoading,
    downloadAreaForOfflineUse,
    getCachedTile,
    clearExpiredCache,
    clearAllCache,
    loadCacheStats
  };
};

// Helper functions
function getTileRange(bounds: any, zoom: number) {
  const minX = Math.floor(((bounds.west + 180) / 360) * Math.pow(2, zoom));
  const maxX = Math.floor(((bounds.east + 180) / 360) * Math.pow(2, zoom));
  const minY = Math.floor((1 - Math.log(Math.tan(bounds.north * Math.PI / 180) + 1 / Math.cos(bounds.north * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
  const maxY = Math.floor((1 - Math.log(Math.tan(bounds.south * Math.PI / 180) + 1 / Math.cos(bounds.south * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));

  return { minX, maxX, minY, maxY };
}

function calculateTileCount(bounds: any, maxZoom: number): number {
  let total = 0;
  for (let zoom = 10; zoom <= maxZoom; zoom++) {
    const range = getTileRange(bounds, zoom);
    total += (range.maxX - range.minX + 1) * (range.maxY - range.minY + 1);
  }
  return total;
}