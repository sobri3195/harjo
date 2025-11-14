import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.06b2c6b4f4814e1388eeb92fc829524e',
  appName: 'efram-mobile-alert-system',
  webDir: 'dist',
  // Remove server config for production APK builds
  // server: {
  //   url: 'https://06b2c6b4-f481-4e13-88ee-b92fc829524e.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    Geolocation: {
      permissions: ['location', 'coarseLocation']
    },
    Filesystem: {
      directory: 'DOCUMENTS'
    },
    Storage: {},
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    Network: {},
    Haptics: {}
  }
};

export default config;