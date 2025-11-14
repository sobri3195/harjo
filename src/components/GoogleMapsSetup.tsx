
import React from 'react';
import { AlertTriangle } from 'lucide-react';

const GoogleMapsSetup = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 m-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="space-y-2">
          <h3 className="font-semibold text-amber-800">Konfigurasi Google Maps Diperlukan</h3>
          <div className="text-sm text-amber-700 space-y-1">
            <p>Untuk menggunakan fitur navigasi ambulans dengan Google Maps:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Dapatkan Google Maps API Key dari <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></li>
              <li>Aktifkan Maps JavaScript API dan Directions API</li>
              <li>Ganti <code className="bg-amber-100 px-1 rounded">YOUR_GOOGLE_MAPS_API_KEY</code> di file GoogleMapsRoute.tsx</li>
              <li>Atau gunakan Supabase Edge Functions untuk menyimpan API key secara aman</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapsSetup;
