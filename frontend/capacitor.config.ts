import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.socialsaver.app',
  appName: 'SocialSaver',
  webDir: 'dist/frontend/browser',
  server: {
    androidScheme: 'https',
    cleartext: true
  },
  plugins: {
    Filesystem: {}
  }
};

export default config;
