import type { CapacitorConfig } from '@capacitor/cli';

/**
 * =========================================================
 * CAPACITOR CONFIGURATION FILE
 * =========================================================
 * 
 * This file configures Capacitor for native iOS/Android builds.
 * 
 * TO COPY THIS TO ANOTHER PROJECT:
 * 1. Copy this file to the root of your new project
 * 2. Update appId with your unique app identifier
 * 3. Update appName with your app's display name
 * 4. Update the server.url to your project's preview URL
 * =========================================================
 */

const config: CapacitorConfig = {
  appId: 'app.lovable.12f71efd1f70462cbb07db795e0bb262',
  appName: 'lovable-dashboard-visuals',
  webDir: 'dist',
  server: {
    // For development: enables hot-reload from Lovable sandbox
    url: 'https://12f71efd-1f70-462c-bb07-db795e0bb262.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    // Biometric authentication plugin configuration
    BiometricAuth: {
      // Allow device credential (PIN/Pattern) as fallback
      allowDeviceCredential: true
    }
  }
};

export default config;
