import React, { useState, useEffect, useRef } from 'react';
import { Wifi, WifiOff, Database, AlertCircle, RefreshCw, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkSupabaseConnection = async (showIndicator = false) => {
    if (showIndicator) {
      setIsChecking(true);
    }
    
    try {
      // Test with a simple lightweight query
      const { data, error } = await supabase
        .from('personnel')
        .select('id')
        .limit(1)
        .single();
        
      const isConnected = !error;
      setSupabaseConnected(isConnected);
      
      if (isConnected) {
        setRetryCount(0);
        // Clear any pending reconnection attempts
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      } else {
        // Retry connection with exponential backoff
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkSupabaseConnection();
        }, retryDelay);
      }
      
    } catch (error) {
      console.error('Supabase connection check failed:', error);
      setSupabaseConnected(false);
      
      // Only retry if online
      if (isOnline && retryCount < 5) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 30000);
        reconnectTimeoutRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          checkSupabaseConnection();
        }, retryDelay);
      }
    } finally {
      if (showIndicator) {
        setIsChecking(false);
      }
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setRetryCount(0);
      setIsDismissed(false); // Show again when connection is restored
      // Immediately check Supabase when coming back online
      checkSupabaseConnection();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setSupabaseConnected(false);
      setIsDismissed(false); // Show when offline
      // Clear retry attempts when offline
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connection check
    checkSupabaseConnection();
    
    // Show status initially or when connectivity changes
    setIsVisible(true);
    const visibilityTimer = setTimeout(() => setIsVisible(false), 4000);

    // Periodic connection health check (every 30 seconds)
    const healthCheckInterval = setInterval(() => {
      if (isOnline) {
        checkSupabaseConnection();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(visibilityTimer);
      clearInterval(healthCheckInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  // Show status when there are connection issues or user manually checks
  useEffect(() => {
    if (!isDismissed && (!isOnline || !supabaseConnected)) {
      setIsVisible(true);
    }
  }, [isOnline, supabaseConnected, isDismissed]);

  // Auto-hide after some time unless there are ongoing issues
  useEffect(() => {
    if (isVisible && isOnline && supabaseConnected && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, isOnline, supabaseConnected, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
  };

  // Don't show if dismissed or if everything is working fine
  if (!isVisible || (isDismissed && isOnline && supabaseConnected)) return null;

  return (
    <div className="fixed top-20 right-4 z-40 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg border p-3 min-w-56">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Status Koneksi</span>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => checkSupabaseConnection(true)}
              disabled={isChecking}
              className="h-6 w-6 p-0"
            >
              <RefreshCw 
                size={12} 
                className={`${isChecking ? 'animate-spin' : ''} text-gray-500`} 
              />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-6 w-6 p-0"
            >
              <X size={12} className="text-gray-500" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          {/* Internet Status */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi size={16} className="text-green-600" />
            ) : (
              <WifiOff size={16} className="text-red-600" />
            )}
            <span className="text-xs">Internet:</span>
            <Badge 
              variant={isOnline ? "default" : "destructive"}
              className="text-xs"
            >
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
          
          {/* Supabase Status */}
          <div className="flex items-center gap-2">
            {supabaseConnected ? (
              <Database size={16} className="text-green-600" />
            ) : isChecking ? (
              <RefreshCw size={16} className="text-blue-600 animate-spin" />
            ) : (
              <AlertCircle size={16} className="text-yellow-600" />
            )}
            <span className="text-xs">Database:</span>
            <Badge 
              variant={supabaseConnected ? "default" : "secondary"}
              className="text-xs"
            >
              {isChecking ? 'Checking...' : supabaseConnected ? 'Terhubung' : 'Lokal'}
            </Badge>
          </div>
        </div>
        
        {!supabaseConnected && !isChecking && (
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">
              Data disimpan lokal, akan sinkron saat koneksi kembali
            </p>
            {retryCount > 0 && (
              <p className="text-xs text-blue-600">
                Mencoba reconnect... (attempt {retryCount}/5)
              </p>
            )}
          </div>
        )}
        
        {!isOnline && (
          <div className="mt-2">
            <p className="text-xs text-red-600">
              ⚠️ Mode offline - fitur terbatas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionStatus;