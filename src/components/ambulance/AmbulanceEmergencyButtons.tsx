
import React, { useState } from 'react';
import { Navigation, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { useRealtimeEmergencyReports } from '@/hooks/useRealtimeEmergencyReports';
import { useEmergencyCallSystem } from '@/hooks/useEmergencyCallSystem';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrivalConfirmationDialog } from './ArrivalConfirmationDialog';
import { toast } from '@/hooks/use-toast';

const AmbulanceEmergencyButtons = () => {
  const { updateReportStatus } = useEmergencyReports();
  const { reports } = useRealtimeEmergencyReports();
  const { emergencyCalls, activeCall, updateCallStatus, setActiveEmergencyCall } = useEmergencyCallSystem();
  const [showArrivalDialog, setShowArrivalDialog] = useState(false);
  const navigate = useNavigate();
  
  // Get pending emergency calls
  const pendingCalls = reports.filter(report => report.status === 'pending');
  const hasActiveCalls = pendingCalls.length > 0;
  
  const handleAcceptEmergencyCall = async () => {
    if (pendingCalls.length === 0) {
      toast({
        title: "📢 Tidak Ada Panggilan",
        description: "Tidak ada panggilan darurat yang tersedia saat ini.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the most recent emergency call
      const latestCall = pendingCalls[0];
      
      // Update status to indicate ambulance accepted the call
      await updateReportStatus(latestCall.id, 'dalam_penanganan');
      
      toast({
        title: "✅ Panggilan Diterima",
        description: `Panggilan darurat ${latestCall.type} telah diterima. Menuju lokasi: ${latestCall.location}`,
      });

      // Navigate to emergency dashboard
      navigate('#emergency');
      
      // Auto-navigate to Google Maps if coordinates available
      if (latestCall.latitude && latestCall.longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latestCall.latitude},${latestCall.longitude}&travelmode=driving`;
        setTimeout(() => {
          window.open(url, '_blank');
        }, 1000);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: "❌ Error",
        description: "Gagal menerima panggilan darurat. Silakan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const handleNavigateToLocation = () => {
    if (pendingCalls.length === 0) {
      // If no specific emergency, navigate to hospital base
      const hospitalUrl = `https://www.google.com/maps/dir/?api=1&destination=RSPAU+dr.+Suhardi+Harjolukito&travelmode=driving`;
      window.open(hospitalUrl, '_blank');
      toast({
        title: "🏥 Navigasi ke Rumah Sakit",
        description: "Mengarahkan ke RSPAU dr. Suhardi Harjolukito",
      });
      return;
    }

    const latestCall = pendingCalls[0];
    
    // Enhanced navigation with smart address search
    const navigateToEmergency = () => {
      if (latestCall.latitude && latestCall.longitude) {
        // Use exact coordinates if available
        const url = `https://www.google.com/maps/dir/?api=1&destination=${latestCall.latitude},${latestCall.longitude}&travelmode=driving`;
        window.open(url, '_blank');
        toast({
          title: "🗺️ GPS Navigation",
          description: `Menuju koordinat ${latestCall.latitude.toFixed(4)}, ${latestCall.longitude.toFixed(4)}`,
        });
      } else {
        // Smart search with contextual location data
        const searchTerms = [
          latestCall.location,
          'RSPAU dr. Suhardi Harjolukito', // Add hospital context for better search
          'Yogyakarta' // Add city context
        ];
        
        const searchQuery = searchTerms.join(' near ');
        const encodedQuery = encodeURIComponent(searchQuery);
        const searchUrl = `https://www.google.com/maps/search/?api=1&query=${encodedQuery}`;
        
        window.open(searchUrl, '_blank');
        toast({
          title: "🔍 Smart Navigation",
          description: `Mencari: "${latestCall.location}" dengan konteks lokasi yang diperluas`,
        });
      }
    };
    
    navigateToEmergency();
  };

  const handleArrivalConfirmation = (notes: string, location?: {lat: number, lng: number}) => {
    if (activeCall) {
      updateCallStatus(activeCall.id, 'tiba_di_lokasi', notes, location);
    }
  };

  const handleMarkArrived = () => {
    if (pendingCalls.length > 0) {
      const latestCall = pendingCalls[0];
      // Find or create an emergency call for this report
      let emergencyCall = emergencyCalls.find(call => call.reportId === latestCall.id);
      
      if (!emergencyCall) {
        // This will be handled by the emergency call system automatically
        setTimeout(() => {
          const newCall = emergencyCalls.find(call => call.reportId === latestCall.id);
          if (newCall) {
            setActiveEmergencyCall(newCall.id);
            setShowArrivalDialog(true);
          }
        }, 500);
      } else {
        setActiveEmergencyCall(emergencyCall.id);
        setShowArrivalDialog(true);
      }
    }
  };

  return (
    <div className="flex flex-col space-y-4 px-4 md:px-6 py-4">
      {/* Emergency Call Status */}
      {hasActiveCalls && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-xl p-3 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-800 font-semibold text-sm">
                {pendingCalls.length} Panggilan Darurat Menunggu
              </span>
            </div>
            <Badge variant="destructive" className="text-xs">
              URGENT
            </Badge>
          </div>
          <p className="text-xs text-red-700 mt-1">
            Lokasi: {pendingCalls[0].location}
          </p>
        </div>
      )}

      {/* Primary Emergency Button - HIDDEN */}
      {/* Hidden: Terima Panggilan Button
      <button 
        onClick={handleAcceptEmergencyCall}
        className={`emergency-pulse ${
          hasActiveCalls 
            ? 'bg-emergency-red-600 hover:bg-emergency-red-700 animate-pulse' 
            : 'bg-gray-400 hover:bg-gray-500'
        } text-white rounded-2xl p-4 md:p-6 shadow-xl transition-all duration-200 active:scale-95 relative overflow-hidden`}
        disabled={!hasActiveCalls}
      >
        {hasActiveCalls && (
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 animate-pulse"></div>
        )}
        <div className="relative flex items-center justify-center space-x-3 md:space-x-4">
          <AlertTriangle size={28} className="text-white md:w-10 md:h-10" />
          <div className="text-left">
            <h2 className="text-lg md:text-2xl font-bold">
              {hasActiveCalls ? '🚨 TERIMA PANGGILAN' : '⏳ STANDBY'}
            </h2>
            <p className="text-xs md:text-sm opacity-90">
              {hasActiveCalls ? 'Respons cepat darurat' : 'Menunggu panggilan darurat'}
            </p>
            {hasActiveCalls && (
              <p className="text-xs opacity-90 mt-1">
                {pendingCalls[0].type.toUpperCase()} - {pendingCalls[0].patient_name}
              </p>
            )}
          </div>
        </div>
      </button>
      */}

      {/* Secondary Action Buttons */}
      <div className="grid grid-cols-2 gap-3 md:gap-4">
        <button 
          onClick={handleNavigateToLocation}
          className={`${
            hasActiveCalls 
              ? 'bg-navy-blue-600 hover:bg-navy-blue-700' 
              : 'bg-gray-400 hover:bg-gray-500'
          } text-white rounded-xl p-3 md:p-4 shadow-lg transition-all duration-200 active:scale-95`}
          disabled={!hasActiveCalls}
        >
          <div className="flex flex-col items-center space-y-1 md:space-y-2">
            <Navigation size={20} className="md:w-6 md:h-6" />
            <div className="text-center">
              <div className="font-semibold text-xs md:text-sm">Navigasi</div>
              <div className="text-xs opacity-90">Ke Lokasi</div>
            </div>
          </div>
        </button>

        <button 
          onClick={handleContactMedicalTeam}
          className="bg-military-green-600 hover:bg-military-green-700 text-white rounded-xl p-3 md:p-4 shadow-lg transition-all duration-200 active:scale-95"
        >
          <div className="flex flex-col items-center space-y-1 md:space-y-2">
            <Phone size={20} className="md:w-6 md:h-6" />
            <div className="text-center">
              <div className="font-semibold text-xs md:text-sm">Kontak</div>
              <div className="text-xs opacity-90">Tim Medis</div>
            </div>
          </div>
        </button>
      </div>

      {/* Arrival Confirmation Button */}
      {hasActiveCalls && (
        <Button 
          onClick={handleMarkArrived}
          className="bg-green-600 hover:bg-green-700 text-white w-full py-3 text-sm font-semibold"
        >
          📍 Tiba di Lokasi
        </Button>
      )}

      {/* Location Status */}
      <div className="bg-white rounded-xl p-3 md:p-4 shadow-md">
        <div className="flex items-center space-x-3">
          <MapPin size={18} className="text-navy-blue-600 md:w-5 md:h-5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-800 text-sm">Lokasi Saat Ini</div>
            <div className="text-xs md:text-sm text-gray-600 truncate">
              RSPAU dr. Suhardi Harjolukito - Parkir Ambulans
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="text-xs text-gray-500">GPS Aktif</div>
            <div className="w-2 h-2 bg-green-500 rounded-full ml-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      {hasActiveCalls && (
        <div className="text-center">
          {/* Hidden: Lihat Detail Emergency Dashboard 
          <Button 
            onClick={() => navigate('#emergency')}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            Lihat Detail Emergency Dashboard →
          </Button>
          */}
        </div>
      )}

      <ArrivalConfirmationDialog
        open={showArrivalDialog}
        onOpenChange={setShowArrivalDialog}
        call={activeCall}
        onConfirm={handleArrivalConfirmation}
      />
    </div>
  );
};

const handleContactMedicalTeam = () => {
  // Contact medical team functionality
  toast({
    title: "📞 Tim Medis",
    description: "Menampilkan kontak tim medis yang tersedia.",
  });
};

export default AmbulanceEmergencyButtons;
