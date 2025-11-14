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
import { Fingerprint, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BiometricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnableBiometric: (enabled: boolean) => void;
}

export const BiometricDialog = ({ open, onOpenChange, onEnableBiometric }: BiometricDialogProps) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    setIsAuthenticating(true);

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn tidak didukung di browser ini');
      }

      // Simulate biometric authentication
      // In a real app, you would use WebAuthn API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful authentication
      const success = Math.random() > 0.2; // 80% success rate for demo
      
      if (success) {
        localStorage.setItem('biometric-enabled', 'true');
        onEnableBiometric(true);
        toast({
          title: "Verifikasi Berhasil",
          description: "Sidik jari telah didaftarkan untuk autentikasi cepat.",
        });
        onOpenChange(false);
      } else {
        throw new Error('Verifikasi sidik jari gagal');
      }
    } catch (error) {
      toast({
        title: "Verifikasi Gagal",
        description: error instanceof Error ? error.message : "Gagal memverifikasi sidik jari",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleDisableBiometric = () => {
    localStorage.removeItem('biometric-enabled');
    onEnableBiometric(false);
    toast({
      title: "Autentikasi Biometrik Dinonaktifkan",
      description: "Sidik jari tidak akan digunakan untuk autentikasi.",
    });
    onOpenChange(false);
  };

  const isBiometricEnabled = localStorage.getItem('biometric-enabled') === 'true';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Verifikasi Sidik Jari
          </DialogTitle>
          <DialogDescription>
            {isBiometricEnabled 
              ? 'Autentikasi biometrik sudah aktif. Anda dapat menonaktifkannya di bawah.'
              : 'Gunakan sidik jari untuk akses cepat ke fitur keamanan.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          {!isBiometricEnabled ? (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <Fingerprint className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Letakkan jari Anda pada sensor sidik jari untuk mendaftar
                </p>
                {isAuthenticating && (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Memverifikasi sidik jari...</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Fingerprint className="h-8 w-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-green-600">Sidik Jari Terdaftar</p>
                <p className="text-sm text-muted-foreground">
                  Autentikasi biometrik telah aktif untuk akun Anda
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">Catatan Keamanan:</p>
                <p>Pastikan hanya sidik jari Anda yang didaftarkan pada perangkat ini.</p>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
          {!isBiometricEnabled ? (
            <Button 
              onClick={handleBiometricAuth}
              disabled={isAuthenticating}
              className="gap-2"
            >
              <Fingerprint className="h-4 w-4" />
              Verifikasi Sidik Jari
            </Button>
          ) : (
            <Button 
              variant="destructive" 
              onClick={handleDisableBiometric}
            >
              Nonaktifkan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};