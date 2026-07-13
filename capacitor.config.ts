import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  // TODO: must match the Bundle ID you register in App Store Connect
  appId: 'com.khorshidmohammad.phvd',
  appName: 'PHVD',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
    limitsNavigationsToAppBoundDomains: true,
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
