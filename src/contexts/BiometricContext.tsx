/**
 * =========================================================
 * BIOMETRIC CONTEXT PROVIDER
 * =========================================================
 * 
 * React context to share biometric state across the app.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/contexts/BiometricContext.tsx
 * 2. Copy src/hooks/useBiometricLock.ts
 * 3. Copy src/config/biometricConfig.ts
 * 4. Wrap your app with <BiometricProvider>
 * =========================================================
 */

import React, { createContext, useContext, useEffect, useCallback } from 'react';
import { useBiometricLock, UseBiometricLockReturn } from '@/hooks/useBiometricLock';
import { biometricConfig } from '@/config/biometricConfig';
import { useAuth } from './AuthContext';

interface BiometricContextType extends UseBiometricLockReturn {
  /**
   * Whether biometric verification is required before proceeding
   * (based on config, user preference, and current state)
   */
  requiresVerification: boolean;
  
  /**
   * Whether the biometric lock feature should be shown in settings
   */
  showBiometricSettings: boolean;
}

const BiometricContext = createContext<BiometricContextType | undefined>(undefined);

interface BiometricProviderProps {
  children: React.ReactNode;
}

export const BiometricProvider: React.FC<BiometricProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const biometric = useBiometricLock(biometricConfig);
  
  // Clear verification when user logs out
  useEffect(() => {
    if (!user) {
      biometric.clearVerification();
    }
  }, [user]);

  // Handle app visibility changes (background/foreground)
  useEffect(() => {
    if (!biometricConfig.enabled) return;

    let backgroundTime: number | null = null;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // App went to background
        backgroundTime = Date.now();
      } else {
        // App came to foreground
        if (backgroundTime && biometricConfig.backgroundLockTimeout > 0) {
          const elapsed = Date.now() - backgroundTime;
          if (elapsed > biometricConfig.backgroundLockTimeout) {
            // Timeout exceeded, require re-verification
            biometric.clearVerification();
          }
        }
        backgroundTime = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [biometric.clearVerification]);

  // Calculate if verification is required
  const requiresVerification = useCallback((): boolean => {
    // Global kill switch
    if (!biometricConfig.enabled) return false;
    
    // User must be logged in
    if (!user) return false;
    
    // User must have enabled biometrics
    if (!biometric.isEnabled) return false;
    
    // Already verified this session
    if (biometric.isVerified) return false;
    
    // Biometrics must be available (or we're in web mode for testing)
    // In web mode, we skip verification since biometrics aren't available
    if (!biometric.isNativePlatform) return false;
    
    return true;
  }, [user, biometric.isEnabled, biometric.isVerified, biometric.isNativePlatform]);

  // Show settings if biometrics are available OR if we're in native platform
  const showBiometricSettings = biometric.isNativePlatform && biometric.isAvailable;

  const value: BiometricContextType = {
    ...biometric,
    requiresVerification: requiresVerification(),
    showBiometricSettings,
  };

  return (
    <BiometricContext.Provider value={value}>
      {children}
    </BiometricContext.Provider>
  );
};

export const useBiometric = (): BiometricContextType => {
  const context = useContext(BiometricContext);
  if (context === undefined) {
    throw new Error('useBiometric must be used within a BiometricProvider');
  }
  return context;
};

export default BiometricContext;
