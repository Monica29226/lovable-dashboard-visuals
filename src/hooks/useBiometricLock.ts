/**
 * =========================================================
 * USE BIOMETRIC LOCK HOOK
 * =========================================================
 * 
 * Reusable hook for biometric authentication using Capacitor.
 * Works with Face ID (iOS), Touch ID (iOS), and Android biometrics.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/hooks/useBiometricLock.ts
 * 2. Copy src/config/biometricConfig.ts
 * 3. Install: @aparajita/capacitor-biometric-auth @capacitor/core
 * =========================================================
 */

import { useState, useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { biometricConfig, BiometricConfig } from '@/config/biometricConfig';

// Types from the biometric plugin
interface BiometricAuthResult {
  isAvailable: boolean;
  biometryType?: 'touchId' | 'faceId' | 'fingerprintAuthentication' | 'faceAuthentication' | 'irisAuthentication' | 'none';
  reason?: string;
}

interface AuthenticateResult {
  success: boolean;
  error?: string;
  errorCode?: string;
}

export interface UseBiometricLockReturn {
  /** Whether biometrics are available on this device */
  isAvailable: boolean;
  /** Type of biometric available (faceId, touchId, fingerprint, etc.) */
  biometryType: string | null;
  /** Whether the user has enabled biometric lock */
  isEnabled: boolean;
  /** Whether biometric has been verified this session */
  isVerified: boolean;
  /** Whether a biometric check is currently in progress */
  isAuthenticating: boolean;
  /** Last error message */
  error: string | null;
  /** Whether we're running in a native context (iOS/Android) */
  isNativePlatform: boolean;
  /** Check if biometrics are available */
  checkAvailability: () => Promise<BiometricAuthResult>;
  /** Trigger biometric authentication */
  authenticate: (reason?: string) => Promise<AuthenticateResult>;
  /** Enable biometric lock for this device */
  enableBiometric: () => void;
  /** Disable biometric lock for this device */
  disableBiometric: () => void;
  /** Mark session as verified (after successful auth) */
  markVerified: () => void;
  /** Clear verification (require re-auth) */
  clearVerification: () => void;
  /** Get display name for the biometry type */
  getBiometryDisplayName: () => string;
}

/**
 * Main hook for biometric lock functionality
 */
export const useBiometricLock = (
  config: BiometricConfig = biometricConfig
): UseBiometricLockReturn => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNativePlatform = Capacitor.isNativePlatform();

  // Load saved preferences on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem(config.storageKey);
    const sessionVerified = sessionStorage.getItem(config.sessionVerifiedKey);
    
    if (savedEnabled === 'true') {
      setIsEnabled(true);
    }
    if (sessionVerified === 'true') {
      setIsVerified(true);
    }
  }, [config.storageKey, config.sessionVerifiedKey]);

  // Check availability on mount
  useEffect(() => {
    if (config.enabled && isNativePlatform) {
      checkAvailability();
    }
  }, [config.enabled, isNativePlatform]);

  /**
   * Check if biometrics are available on this device
   */
  const checkAvailability = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isNativePlatform) {
      return { 
        isAvailable: false, 
        reason: 'Not running in native context (web browser)' 
      };
    }

    try {
      // Dynamic import to avoid errors on web
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
      
      const result = await BiometricAuth.checkBiometry();
      
      const available = result.isAvailable;
      const type = result.biometryType;

      setIsAvailable(available);
      setBiometryType(type ? String(type) : null);

      return {
        isAvailable: available,
        biometryType: type ? (String(type) as BiometricAuthResult['biometryType']) : undefined,
        reason: result.reason,
      };
    } catch (err: unknown) {
      console.error('[Biometric] Availability check failed:', err);
      setIsAvailable(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to check biometric availability';
      return {
        isAvailable: false,
        reason: errorMessage,
      };
    }
  }, [isNativePlatform]);

  /**
   * Trigger biometric authentication
   */
  const authenticate = useCallback(async (
    reason?: string
  ): Promise<AuthenticateResult> => {
    if (!isNativePlatform) {
      // In web, just mark as verified (no biometrics available)
      setIsVerified(true);
      sessionStorage.setItem(config.sessionVerifiedKey, 'true');
      return { success: true };
    }

    if (!isAvailable) {
      // Biometrics not available, fall back to success
      setIsVerified(true);
      sessionStorage.setItem(config.sessionVerifiedKey, 'true');
      return { 
        success: true,
        error: 'Biometrics not available, falling back'
      };
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');

      await BiometricAuth.authenticate({
        reason: reason || config.promptSubtitle,
        cancelTitle: config.cancelButtonText,
        allowDeviceCredential: config.allowDeviceCredentialFallback,
        iosFallbackTitle: 'Usar contraseña',
        androidTitle: config.promptTitle,
        androidSubtitle: reason || config.promptSubtitle,
        androidConfirmationRequired: false,
      });

      // If we reach here, authentication succeeded
      setIsVerified(true);
      sessionStorage.setItem(config.sessionVerifiedKey, 'true');
      setIsAuthenticating(false);
      
      return { success: true };
    } catch (err: unknown) {
      console.error('[Biometric] Authentication failed:', err);
      setIsAuthenticating(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      const errorCode = (err as { code?: string })?.code;
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        errorCode: errorCode,
      };
    }
  }, [isNativePlatform, isAvailable, config]);

  /**
   * Enable biometric lock for this device
   */
  const enableBiometric = useCallback(() => {
    localStorage.setItem(config.storageKey, 'true');
    setIsEnabled(true);
  }, [config.storageKey]);

  /**
   * Disable biometric lock for this device
   */
  const disableBiometric = useCallback(() => {
    localStorage.setItem(config.storageKey, 'false');
    setIsEnabled(false);
    // Also clear verification when disabling
    sessionStorage.removeItem(config.sessionVerifiedKey);
    setIsVerified(false);
  }, [config.storageKey, config.sessionVerifiedKey]);

  /**
   * Mark the current session as verified
   */
  const markVerified = useCallback(() => {
    sessionStorage.setItem(config.sessionVerifiedKey, 'true');
    setIsVerified(true);
  }, [config.sessionVerifiedKey]);

  /**
   * Clear verification (require re-authentication)
   */
  const clearVerification = useCallback(() => {
    sessionStorage.removeItem(config.sessionVerifiedKey);
    setIsVerified(false);
  }, [config.sessionVerifiedKey]);

  /**
   * Get user-friendly name for the biometry type
   */
  const getBiometryDisplayName = useCallback((): string => {
    switch (biometryType) {
      case 'faceId':
      case 'faceAuthentication':
        return 'Face ID';
      case 'touchId':
      case 'fingerprintAuthentication':
        return 'Touch ID';
      case 'irisAuthentication':
        return 'Iris';
      default:
        return 'Biometrics';
    }
  }, [biometryType]);

  return {
    isAvailable,
    biometryType,
    isEnabled,
    isVerified,
    isAuthenticating,
    error,
    isNativePlatform,
    checkAvailability,
    authenticate,
    enableBiometric,
    disableBiometric,
    markVerified,
    clearVerification,
    getBiometryDisplayName,
  };
};

export default useBiometricLock;
