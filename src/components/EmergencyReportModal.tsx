import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Clock, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useEmergencyReports } from '@/hooks/useEmergencyReports';
import { useGeolocation } from '@/hooks/useGeolocation';
import { usePersonnelContext } from '@/contexts/PersonnelContext';
import { useAuth } from '@/contexts/AuthContext';

interface EmergencyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'trauma' | 'heart';
  prefilledData?: {
    description?: string;
    patientName?: string;
    location?: string;
  };
}

const EmergencyReportModal: React.FC<EmergencyReportModalProps> = ({ 
  isOpen, 
  onClose, 
  type, 
  prefilledData 
}) => {
  const { createReport } = useEmergencyReports();
  const { latitude, longitude, error: locationError, loading: locationLoading, getCurrentLocation } = useGeolocation();
  const { personnel } = usePersonnelContext();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState(() => {
    // Initialize with empty form
    const initialData = {
      reporterName: '',
      reporterRank: '',
      reporterPhone: '',
      patientName: '',
      patientRank: '',
      location: '',
      description: '',
      severity: 'sedang' as 'ringan' | 'sedang' | 'berat',
    };

    return initialData;
  });

  // Load saved draft when modal opens
  useEffect(() => {
    if (isOpen) {
      const draftKey = `emergency_report_draft_${type}`;
      const savedData = sessionStorage.getItem(draftKey);
      
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          // Only restore if draft is less than 1 hour old
          const hourAgo = Date.now() - (60 * 60 * 1000);
          
          if (parsed.timestamp && parsed.timestamp > hourAgo && parsed.type === type) {
            setFormData({
              reporterName: parsed.reporterName || '',
              reporterRank: parsed.reporterRank || '',
              reporterPhone: parsed.reporterPhone || '',
              patientName: parsed.patientName || '',
              patientRank: parsed.patientRank || '',
              location: parsed.location || '',
              description: parsed.description || '',
              severity: parsed.severity || 'sedang',
            });
          } else {
            // Remove old draft
            sessionStorage.removeItem(draftKey);
          }
        } catch (e) {
          console.error('Error parsing saved draft:', e);
          sessionStorage.removeItem(draftKey);
        }
      }
    }
  }, [isOpen, type]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addressFromGPS, setAddressFromGPS] = useState<string>('');

  // Auto-save form data to prevent loss during refresh - only save meaningful data
  useEffect(() => {
    if (isOpen && (formData.reporterName || formData.patientName || formData.description || formData.location)) {
      const draftKey = `emergency_report_draft_${type}`;
      const draftData = {
        ...formData,
        timestamp: Date.now(),
        type: type
      };
      sessionStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [formData, isOpen, type]);

  // Auto-populate reporter data from saved personnel
  useEffect(() => {
    if (user && personnel.length > 0) {
      const userPersonnel = personnel.find(p => p.user_id === user.id);
      if (userPersonnel) {
        setFormData(prev => ({
          ...prev,
          reporterName: userPersonnel.nama,
          reporterRank: userPersonnel.pangkat,
          reporterPhone: userPersonnel.no_telepon,
        }));
      }
    }
  }, [user, personnel]);

  // Handle prefilled data
  useEffect(() => {
    if (prefilledData && isOpen) {
      setFormData(prev => ({
        ...prev,
        ...(prefilledData.description && { description: prefilledData.description }),
        ...(prefilledData.patientName && { patientName: prefilledData.patientName }),
        ...(prefilledData.location && { location: prefilledData.location }),
      }));
    }
  }, [prefilledData, isOpen]);

  // Auto-populate location from GPS coordinates
  useEffect(() => {
    if (latitude && longitude) {
      const gpsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      // Try to get readable address from coordinates
      const getAddressFromCoordinates = async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=id`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            const readableAddress = data.display_name.split(',').slice(0, 3).join(', ');
            setAddressFromGPS(readableAddress);
            
            // Auto-fill if location field is empty
            if (!formData.location) {
              setFormData(prev => ({
                ...prev,
                location: readableAddress
              }));
            }
          }
        } catch (error) {
          console.log('Could not get address from coordinates');
          // Fallback to GPS coordinates
          if (!formData.location) {
            setFormData(prev => ({
              ...prev,
              location: `GPS: ${gpsString}`
            }));
          }
        }
      };
      
      getAddressFromCoordinates();
    }
  }, [latitude, longitude, formData.location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await createReport({
        type,
        reporter_name: formData.reporterName,
        reporter_rank: formData.reporterRank,
        reporter_phone: formData.reporterPhone,
        patient_name: formData.patientName,
        patient_rank: formData.patientRank,
        location: formData.location,
        description: formData.description,
        severity: formData.severity,
        latitude: latitude,
        longitude: longitude,
        status: 'pending',
      });
      
      // Reset form and clear draft
      setFormData({
        reporterName: '',
        reporterRank: '',
        reporterPhone: '',
        patientName: '',
        patientRank: '',
        location: '',
        description: '',
        severity: 'sedang',
      });
      
      // Clear draft from sessionStorage
      const draftKey = `emergency_report_draft_${type}`;
      sessionStorage.removeItem(draftKey);
      
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle background click to prevent scroll issues
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const isTrauma = type === 'trauma';
  const bgColor = isTrauma ? 'bg-emergency-red-600' : 'bg-heart-red-500';
  const title = isTrauma ? '🚨 LAPORAN TRAUMA' : '❤️ LAPORAN JANTUNG';

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[9999] flex items-end"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 9999
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white w-full max-h-[90vh] rounded-t-3xl animate-fade-in shadow-2xl relative flex flex-col"
        style={{ 
          maxHeight: '90vh',
          zIndex: 10000
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed */}
        <div className={`${bgColor} text-white p-4 rounded-t-3xl flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              style={{ zIndex: 10001 }}
              disabled={isSubmitting}
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form - Fixed scrolling issues */}
        <div 
          className="flex-1 overflow-y-auto bg-white"
          style={{ 
            maxHeight: 'calc(90vh - 120px)', // More space for content
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            position: 'relative',
            // Fix iOS scrolling
            transform: 'translateZ(0)',
            overscrollBehavior: 'contain'
          }}
        >
          <form onSubmit={handleSubmit} className="p-6 space-y-4 pb-24"> {/* Extra bottom padding for mobile */}
          {/* GPS Location Status */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Navigation size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Status GPS</span>
            </div>
            {locationLoading ? (
              <p className="text-sm text-blue-600 mt-1">📍 Mendapatkan lokasi...</p>
            ) : locationError ? (
              <div>
                <p className="text-sm text-red-600 mt-1">❌ {locationError}</p>
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="text-sm text-blue-600 underline mt-1"
                >
                  Coba lagi
                </button>
              </div>
            ) : latitude && longitude ? (
              <p className="text-sm text-green-600 mt-1">✅ Lokasi terdeteksi: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
            ) : null}
          </div>

          {/* Reporter Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <User size={18} className="mr-2" />
              Data Pelapor
            </h3>
            <Input
              placeholder="Nama Lengkap"
              value={formData.reporterName}
              onChange={(e) => handleChange('reporterName', e.target.value)}
              required
              className="text-base"
              disabled={isSubmitting}
            />
            <Input
              placeholder="Pangkat/Jabatan"
              value={formData.reporterRank}
              onChange={(e) => handleChange('reporterRank', e.target.value)}
              required
              className="text-base"
              disabled={isSubmitting}
            />
            <Input
              placeholder="Nomor Telepon"
              type="tel"
              value={formData.reporterPhone}
              onChange={(e) => handleChange('reporterPhone', e.target.value)}
              required
              className="text-base"
              disabled={isSubmitting}
            />
          </div>

          {/* Patient Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <User size={18} className="mr-2" />
              Data Pasien
            </h3>
            <Input
              placeholder="Nama Pasien"
              value={formData.patientName}
              onChange={(e) => handleChange('patientName', e.target.value)}
              required
              className="text-base"
              disabled={isSubmitting}
            />
            <Input
              placeholder="Pangkat/Jabatan Pasien"
              value={formData.patientRank}
              onChange={(e) => handleChange('patientRank', e.target.value)}
              className="text-base"
              disabled={isSubmitting}
            />
          </div>

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <MapPin size={18} className="mr-2" />
              Lokasi Kejadian
            </h3>
            <Input
              placeholder="Lokasi detail (gedung, ruangan, area)"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              required
              className="text-base"
              disabled={isSubmitting}
            />
            <div className="text-xs text-gray-500 space-y-1">
              <p>GPS otomatis digunakan untuk panduan ambulans</p>
              {addressFromGPS && (
                <p className="text-green-600">
                  ✅ Alamat terdeteksi: {addressFromGPS}
                </p>
              )}
              {latitude && longitude && (
                <p className="text-blue-600">
                  📍 Koordinat: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              )}
            </div>
          </div>

          {/* Severity */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 flex items-center">
              <Clock size={18} className="mr-2" />
              Tingkat Keparahan
            </h3>
            <select
              value={formData.severity}
              onChange={(e) => handleChange('severity', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-base bg-white focus:border-primary focus:ring-2 focus:ring-primary/20"
              disabled={isSubmitting}
            >
              <option value="ringan">🟢 Ringan - Tidak Mengancam Jiwa</option>
              <option value="sedang">🟡 Sedang - Perlu Penanganan Cepat</option>
              <option value="berat">🔴 Berat - Kritis/Mengancam Jiwa</option>
            </select>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800">
              Deskripsi {isTrauma ? 'Trauma/Cedera' : 'Keluhan Jantung'}
            </h3>
            <Textarea
              placeholder={
                isTrauma
                  ? "Jelaskan detail cedera, bagian tubuh yang terluka, penyebab trauma..."
                  : "Jelaskan gejala yang dialami: nyeri dada, sesak napas, pusing, dll..."
              }
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
              className="text-base min-h-[100px] bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* Submit Button - Better mobile handling */}
          <div className="pt-4 mt-6">
            <Button
              type="submit"
              className={`w-full ${bgColor} hover:opacity-90 text-white py-4 text-lg font-semibold rounded-xl shadow-lg`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "🔄 MENGIRIM..." : "🚨 KIRIM LAPORAN DARURAT"}
            </Button>
          </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmergencyReportModal;