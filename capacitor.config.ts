import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.phiksniyar.app',
  appName: 'PhiksNiyar',
  webDir: 'public',
  server: {
    // In production APK/AAB, points to live secure backend or local bundled assets
    url: process.env.CAPACITOR_SERVER_URL || 'https://phiksniyar.com',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#102F78',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#102F78',
      overlaysWebView: false,
    },
    App: {
      // Hardware back navigation configuration
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
