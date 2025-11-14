import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, CheckCircle, Clock, Navigation } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { EmergencyCall } from '@/hooks/useEmergencyCallSystem';

interface ArrivalConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  call: EmergencyCall | null;
  onConfirm: (notes: string, location?: {lat: number, lng: number}) => void;
}

export const ArrivalConfirmationDialog: React.FC<ArrivalConfirmationDialogProps> = ({
  open,
  onOpenChange,
  call,
  onConfirm
}) => {
  const [notes, setNotes] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const { latitude, longitude } = useGeolocation();

  const handleConfirm = () => {
    setIsValidating(true);
    
    try {
      if (latitude && longitude) {
        onConfirm(notes, {
          lat: latitude,
          lng: longitude
        });
      } else {
        onConfirm(notes);
      }
      
      setNotes('');
      onOpenChange(false);
    } catch (error) {
      console.error('Location validation failed:', error);
      onConfirm(notes);
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg mx-auto rounded-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <MapPin className="text-primary" size={18} />
            </div>
            Konfirmasi Kedatangan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {call && (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-4 border border-primary/20">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Navigation className="text-primary" size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary mb-1">
                    📍 {call.location.address}
                  </p>
                  <p className="text-sm text-gray-600">
                    Priority: <span className="font-medium text-orange-600 uppercase">{call.priority}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* GPS Status */}
          <div className={`rounded-lg p-3 border ${
            latitude && longitude 
              ? 'bg-green-50 border-green-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-start gap-2">
              <CheckCircle size={16} className={`mt-0.5 flex-shrink-0 ${
                latitude && longitude ? 'text-green-600' : 'text-orange-600'
              }`} />
              <div className="flex-1">
                <p className={`text-sm font-medium mb-1 ${
                  latitude && longitude ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {latitude && longitude ? '✅ GPS Terdeteksi' : '⚠️ GPS Tidak Tersedia'}
                </p>
                <p className={`text-xs ${
                  latitude && longitude ? 'text-green-700' : 'text-orange-700'
                }`}>
                  {latitude && longitude 
                    ? 'Lokasi akan divalidasi otomatis'
                    : 'Konfirmasi manual tanpa validasi GPS'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              <Clock size={14} className="inline mr-1" />
              Catatan Kedatangan
            </label>
            <Textarea
              placeholder="Tim medis telah tiba di lokasi, pasien dalam kondisi stabil..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none text-sm"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isValidating}
            >
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isValidating}
              className="flex-1 gap-2"
            >
              {isValidating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Konfirmasi
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};