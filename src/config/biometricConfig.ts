/**
 * =========================================================
 * BIOMETRIC LOCK CONFIGURATION
 * =========================================================
 * 
 * This file controls the biometric authentication behavior.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/config/biometricConfig.ts
 * 2. Adjust the settings below for your needs
 * =========================================================
 */

export interface BiometricConfig {
  /**
   * Master switch to enable/disable biometric lock globally.
   * When false, biometrics will never be prompted.
   */
  enabled: boolean;

  /**
   * When to trigger the biometric lock:
   * - 'app_start': Prompt when the app opens (after splash/load)
   * - 'after_login': Prompt after successful Supabase login
   * - 'route_access': Prompt when accessing specific protected routes
   */
  triggerPoint: 'app_start' | 'after_login' | 'route_access';

  /**
   * Routes that require biometric authentication.
   * Only used when triggerPoint is 'route_access'.
   * Uses path matching (supports wildcards like '/admin/*')
   */
  protectedRoutes: string[];

  /**
   * Routes that should NEVER trigger biometric (even if triggerPoint is 'app_start')
   */
  excludedRoutes: string[];

  /**
   * Allow device credentials (PIN/Pattern/Password) as fallback
   * if biometrics fail or are not available.
   */
  allowDeviceCredentialFallback: boolean;

  /**
   * Title shown on the biometric prompt dialog
   */
  promptTitle: string;

  /**
   * Subtitle/description shown on the biometric prompt
   */
  promptSubtitle: string;

  /**
   * Text for the cancel button on the biometric prompt
   */
  cancelButtonText: string;

  /**
   * Key used for storing user's biometric preference in localStorage
   */
  storageKey: string;

  /**
   * Key used for storing if biometric has been verified this session
   */
  sessionVerifiedKey: string;

  /**
   * Time in milliseconds before requiring re-authentication
   * after the app goes to background. Set to 0 to always require.
   */
  backgroundLockTimeout: number;
}

/**
 * Default biometric configuration.
 * Modify these values to customize behavior.
 */
export const biometricConfig: BiometricConfig = {
  enabled: true,
  triggerPoint: 'after_login',
  protectedRoutes: [
    '/',
    '/quickbooks',
    '/quickbooks/*',
    '/budget-2026',
    '/presupuesto-2026',
    '/user-management',
  ],
  excludedRoutes: [
    '/auth',
    '/auth/quickbooks/callback',
  ],
  allowDeviceCredentialFallback: true,
  promptTitle: 'Verificación de Identidad',
  promptSubtitle: 'Usa Face ID o Touch ID para acceder',
  cancelButtonText: 'Cancelar',
  storageKey: 'biometric_enabled',
  sessionVerifiedKey: 'biometric_session_verified',
  backgroundLockTimeout: 5 * 60 * 1000, // 5 minutes
};

/**
 * Check if a route should trigger biometric authentication
 */
export const isRouteProtectedByBiometric = (
  path: string,
  config: BiometricConfig = biometricConfig
): boolean => {
  // Check if route is excluded
  for (const excluded of config.excludedRoutes) {
    if (matchRoute(path, excluded)) {
      return false;
    }
  }

  // For route_access mode, check if route matches protected list
  if (config.triggerPoint === 'route_access') {
    for (const protected_ of config.protectedRoutes) {
      if (matchRoute(path, protected_)) {
        return true;
      }
    }
    return false;
  }

  // For app_start and after_login, all non-excluded routes are "protected"
  return true;
};

/**
 * Simple route matching with wildcard support
 */
const matchRoute = (path: string, pattern: string): boolean => {
  if (pattern.endsWith('/*')) {
    const base = pattern.slice(0, -2);
    return path === base || path.startsWith(base + '/');
  }
  return path === pattern;
};
