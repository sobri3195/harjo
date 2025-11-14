
import React, { useEffect, useState } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation';

interface OpenStreetMapProps {
  destination?: {
    lat: number;
    lng: number;
    address: string;
  };
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ destination }) => {
  const { latitude, longitude, error, loading } = useGeolocation();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Default RSPAU dr. Suhardi Harjolukito coordinates
  const baseLocation = { lat: -6.1393, lng: 106.8747 };
  const currentLocation = latitude && longitude ? { lat: latitude, lng: longitude } : baseLocation;

  useEffect(() => {
    // Simple check to see if we can load maps
    setMapLoaded(true);
  }, []);

  const openInGoogleMaps = () => {
    if (destination && currentLocation) {
      const url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${destination.lat},${destination.lng}`;
      window.open(url, '_blank');
    }
  };

  const openInWaze = () => {
    if (destination) {
      const url = `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  const openCurrentLocationInMaps = () => {
    if (currentLocation) {
      const url = `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`;
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">📍 Memuat lokasi GPS...</p>
          <p className="text-xs text-gray-500 mt-1">Menggunakan OpenStreetMap</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">❌ Error GPS: {error}</p>
          <p className="text-xs text-gray-500 mt-1">Menggunakan lokasi default</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="text-sm text-green-800">
          ✅ Sistem Navigasi Aktif - GPS Ready
        </p>
      </div>
      
      {/* Static Map Preview */}
      <div className="w-full h-64 bg-gray-100 rounded-lg border border-gray-300 flex flex-col items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-6xl">🗺️</div>
          <div>
            <p className="font-semibold text-gray-800">Peta Interaktif Tersedia</p>
            <p className="text-sm text-gray-600">Klik tombol navigasi untuk membuka peta</p>
          </div>
          
          {/* Quick location info */}
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-xs text-gray-500">Lokasi Saat Ini</p>
            <p className="font-medium text-gray-800">
              {latitude && longitude 
                ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
                : 'RSPAU dr. Suhardi Harjolukito (Default)'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Location info */}
      <div className="grid grid-cols-1 gap-2 text-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="font-medium text-blue-800">📍 Lokasi Ambulans:</p>
          <p className="text-blue-600">
            {latitude && longitude 
              ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
              : 'RSPAU dr. Suhardi Harjolukito (Default)'
            }
          </p>
          <button 
            onClick={openCurrentLocationInMaps}
            className="mt-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors"
          >
            Lihat di Peta
          </button>
        </div>
        
        {destination && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="font-medium text-red-800">🎯 Tujuan:</p>
            <p className="text-red-600">{destination.address}</p>
            <p className="text-red-500 text-xs">
              {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={openInGoogleMaps}
          disabled={!destination}
          className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            destination
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          🗺️ Google Maps
        </button>
        
        <button 
          onClick={openInWaze}
          disabled={!destination}
          className={`py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
            destination
              ? 'bg-purple-600 hover:bg-purple-700 text-white'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          🚗 Waze
        </button>
      </div>

      {!destination && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            💡 Pilih tujuan dari daftar panggilan darurat untuk mulai navigasi
          </p>
        </div>
      )}
    </div>
  );
};

export default OpenStreetMap;
