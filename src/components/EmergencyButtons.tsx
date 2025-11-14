
import React from 'react';
import { Truck, AlertTriangle, ArrowRight, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EmergencyButtonsProps {
  onTraumaReport?: () => void;
  onHeartReport?: () => void;
  onEmergencyClick?: (type: 'trauma' | 'heart') => void;
}

const EmergencyButtons: React.FC<EmergencyButtonsProps> = ({ 
  onTraumaReport, 
  onHeartReport,
  onEmergencyClick
}) => {
  const navigate = useNavigate();

  const handleTrauma = () => {
    console.log('🚨 TRAUMA Emergency Button Clicked');
    if (onTraumaReport) {
      onTraumaReport();
    } else if (onEmergencyClick) {
      onEmergencyClick('trauma');
    } else {
      console.log('Navigating to /ambulance?type=trauma#emergency');
      navigate('/ambulance?type=trauma#emergency');
    }
  };

  const handleHeart = () => {
    console.log('🚑 HEART Emergency Button Clicked');
    if (onHeartReport) {
      onHeartReport();
    } else if (onEmergencyClick) {
      onEmergencyClick('heart');
    } else {
      console.log('Navigating to /ambulance?type=heart#emergency');
      navigate('/ambulance?type=heart#emergency');
    }
  };
  return (
    <div className="flex flex-col space-y-6 px-6 py-8">
      {/* Trauma Emergency Button */}
      <button
        onClick={handleTrauma}
        className="emergency-pulse bg-emergency-red-600 hover:bg-emergency-red-700 text-white rounded-2xl p-6 shadow-xl transition-all duration-200 active:scale-95"
      >
        <div className="flex items-center justify-center space-x-4">
          <AlertTriangle size={40} className="text-white" />
          <div className="text-left">
            <h2 className="text-2xl font-bold">🚨 LAPOR TRAUMA</h2>
            <p className="text-sm opacity-90">Kecelakaan & Cedera Fisik</p>
          </div>
        </div>
      </button>

      {/* Heart Emergency Button */}
      <button
        onClick={handleHeart}
        className="bg-heart-red-500 hover:bg-heart-red-600 text-white rounded-2xl p-6 shadow-xl transition-all duration-200 active:scale-95"
      >
        <div className="flex items-center justify-center space-x-4">
          <Truck size={40} className="text-white" />
          <div className="text-left">
            <h2 className="text-2xl font-bold">🚑 LAPOR JANTUNG</h2>
            <p className="text-sm opacity-90">Serangan Jantung & Gangguan Kardiak</p>
          </div>
        </div>
      </button>

    </div>
  );
};

export default EmergencyButtons;
