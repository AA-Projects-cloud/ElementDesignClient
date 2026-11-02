import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // Change the app id before publishing to the Play Store / App Store (it must be unique worldwide)
  appId: 'com.elementdesign.app',
  appName: 'Element Design',
  webDir: 'dist',
  backgroundColor: '#F5F0E9',
  server: {
    // Serve the app over https inside the phone so sign-in and secure storage behave like the website
    androidScheme: 'https',
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#F5F0E9',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F5F0E9',
      overlaysWebView: false,
    },
  },
};

export default config;
