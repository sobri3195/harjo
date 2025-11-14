import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

interface SecurityPinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SecurityPinDialog = ({ open, onOpenChange }: SecurityPinDialogProps) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'current' | 'new'>('current');

  const handleCurrentPinSubmit = () => {
    // In a real app, verify against stored PIN
    const storedPin = localStorage.getItem('security-pin') || '1234';
    
    if (currentPin === storedPin) {
      setStep('new');
    } else {
      toast({
        title: "PIN Salah",
        description: "PIN keamanan yang dimasukkan salah.",
        variant: "destructive",
      });
    }
  };

  const handleNewPinSubmit = () => {
    if (newPin.length < 4) {
      toast({
        title: "PIN Terlalu Pendek",
        description: "PIN harus minimal 4 digit.",
        variant: "destructive",
      });
      return;
    }

    if (newPin !== confirmPin) {
      toast({
        title: "PIN Tidak Cocok",
        description: "PIN baru dan konfirmasi PIN tidak sama.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('security-pin', newPin);
    toast({
      title: "PIN Berhasil Diubah",
      description: "PIN keamanan Anda telah diperbarui.",
    });
    
    // Reset form
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setStep('current');
    onOpenChange(false);
  };

  const handleClose = () => {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setStep('current');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ubah PIN Keamanan</DialogTitle>
          <DialogDescription>
            {step === 'current' 
              ? 'Masukkan PIN keamanan saat ini'
              : 'Masukkan PIN keamanan baru'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {step === 'current' ? (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current-pin" className="text-right">
                PIN Saat Ini
              </Label>
              <Input
                id="current-pin"
                type="password"
                placeholder="Masukkan PIN"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                className="col-span-3"
                maxLength={6}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-pin" className="text-right">
                  PIN Baru
                </Label>
                <Input
                  id="new-pin"
                  type="password"
                  placeholder="PIN baru (min 4 digit)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="col-span-3"
                  maxLength={6}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="confirm-pin" className="text-right">
                  Konfirmasi PIN
                </Label>
                <Input
                  id="confirm-pin"
                  type="password"
                  placeholder="Ulangi PIN baru"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="col-span-3"
                  maxLength={6}
                />
              </div>
            </>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button 
            onClick={step === 'current' ? handleCurrentPinSubmit : handleNewPinSubmit}
            disabled={step === 'current' ? !currentPin : !newPin || !confirmPin}
          >
            {step === 'current' ? 'Lanjutkan' : 'Simpan PIN'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};