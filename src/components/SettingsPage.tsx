
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Settings, Bell, Info, Phone, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/hooks/useSettings';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { settings, updateSetting, sendTestNotification } = useSettings();
  
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Settings size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Pengaturan</h2>
        <p className="text-muted-foreground">Kelola preferensi aplikasi</p>
      </div>

      <div className="space-y-6">
        {/* Notification Settings */}
        <div className="bg-card rounded-xl shadow-md border p-4">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center">
            <Bell size={18} className="mr-2" />
            Notifikasi & Android
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-card-foreground font-medium">Push Notification</span>
                <p className="text-xs text-muted-foreground">Untuk aplikasi Android native</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-card-foreground font-medium">Suara Notifikasi</span>
                <p className="text-xs text-muted-foreground">Alarm suara untuk emergency</p>
              </div>
              <Switch
                checked={settings.soundNotifications}
                onCheckedChange={(checked) => updateSetting('soundNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-card-foreground font-medium">Vibration Alert</span>
                <p className="text-xs text-muted-foreground">Getaran untuk darurat (Android)</p>
              </div>
              <Switch
                checked={settings.vibrationAlert || false}
                onCheckedChange={(checked) => updateSetting('vibrationAlert', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <span className="text-card-foreground font-medium">Background Sync</span>
                <p className="text-xs text-muted-foreground">Sinkronisasi otomatis di background</p>
              </div>
              <Switch
                checked={settings.backgroundSync || true}
                onCheckedChange={(checked) => updateSetting('backgroundSync', checked)}
              />
            </div>
            
            <div className="border-t border-border pt-3 space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={sendTestNotification}
                className="w-full gap-2"
              >
                <Volume2 size={16} />
                Test Notifikasi Push
              </Button>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-800 mb-1">📱 Persiapan Android App</h4>
                <p className="text-xs text-blue-700">
                  Settings ini akan aktif otomatis saat aplikasi di-build sebagai Android APK. 
                  Push notification akan menggunakan Firebase Cloud Messaging (FCM).
                </p>
              </div>
            </div>
          </div>
        </div>



        {/* Emergency Contacts */}
        <div className="bg-card rounded-xl shadow-md border p-4">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center">
            <Phone size={18} className="mr-2" />
            Kontak Darurat
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-2 hover:bg-accent rounded-lg transition-colors">
              <span className="text-muted-foreground">IGD RSAU:</span>
              <a 
                href="tel:115" 
                className="text-primary font-medium hover:underline flex items-center gap-2"
              >
                115
                <Phone size={14} />
              </a>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-accent rounded-lg transition-colors">
              <span className="text-muted-foreground">Komandan Jaga:</span>
              <a 
                href="tel:119" 
                className="text-primary font-medium hover:underline flex items-center gap-2"
              >
                119
                <Phone size={14} />
              </a>
            </div>
            <div className="flex justify-between items-center p-2 hover:bg-accent rounded-lg transition-colors">
              <span className="text-muted-foreground">Security:</span>
              <a 
                href="tel:112" 
                className="text-primary font-medium hover:underline flex items-center gap-2"
              >
                112
                <Phone size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-card rounded-xl shadow-md border p-4">
          <h3 className="font-semibold text-card-foreground mb-4 flex items-center">
            <Info size={18} className="mr-2" />
            Tentang Aplikasi
          </h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-card-foreground">Emergency Button Diskesau (EBD)</strong></p>
            <p>Versi 1.0.0</p>
            <p>RSPAU dr. Suhardi Harjolukito</p>
            <p>Sistem Darurat Militer</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
