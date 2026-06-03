/**
 * =========================================================
 * BIOMETRIC LOCK SCREEN COMPONENT
 * =========================================================
 * 
 * Full-screen overlay that prompts for biometric authentication.
 * Shows loading state and handles errors gracefully.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/components/BiometricLockScreen.tsx
 * 2. Ensure you have the BiometricContext and useBiometricLock hook
 * =========================================================
 */

import React, { useEffect, useState } from 'react';
import { useBiometric } from '@/contexts/BiometricContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Fingerprint, ScanFace, ShieldCheck, LogOut, AlertCircle } from 'lucide-react';
import { biometricConfig } from '@/config/biometricConfig';

interface BiometricLockScreenProps {
  /** Called when user successfully authenticates or bypasses */
  onUnlock?: () => void;
  /** Whether to show a fallback "Use Password" option */
  showPasswordFallback?: boolean;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({
  onUnlock,
  showPasswordFallback = true,
}) => {
  const { signOut } = useAuth();
  const {
    isAuthenticating,
    error,
    authenticate,
    getBiometryDisplayName,
    biometryType,
    markVerified,
    disableBiometric,
  } = useBiometric();

  const [attemptCount, setAttemptCount] = useState(0);
  const [showFallbackOptions, setShowFallbackOptions] = useState(false);

  // Auto-trigger authentication on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleAuthenticate();
    }, 500); // Small delay for better UX
    
    return () => clearTimeout(timer);
  }, []);

  const handleAuthenticate = async () => {
    setAttemptCount(prev => prev + 1);
    
    const result = await authenticate(biometricConfig.promptSubtitle);
    
    if (result.success) {
      onUnlock?.();
    } else if (attemptCount >= 2) {
      // After 3 failed attempts, show fallback options
      setShowFallbackOptions(true);
    }
  };

  const handleSkipBiometric = () => {
    // User chose to skip biometric for this session
    markVerified();
    onUnlock?.();
  };

  const handleDisableAndContinue = () => {
    // User wants to disable biometric lock entirely
    disableBiometric();
    markVerified();
    onUnlock?.();
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Get icon based on biometry type
  const BiometricIcon = biometryType?.includes('face') ? ScanFace : Fingerprint;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-[#1a2847] to-[#2d4875] p-4"
    >
      <Card className="w-full max-w-md bg-white/95 backdrop-blur-sm border-2 border-white/20 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="text-2xl font-bold text-[#1a2847]">ACL Costa Rica</div>
          </div>
          
          {/* Title */}
          <CardTitle className="text-2xl font-bold text-[#1a2847]">
            {biometricConfig.promptTitle}
          </CardTitle>
          
          <CardDescription className="text-[#2d4875]">
            {biometricConfig.promptSubtitle}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Biometric Button */}
          <div className="flex flex-col items-center space-y-4">
            {isAuthenticating ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
                <p className="text-sm text-muted-foreground">Verificando...</p>
              </div>
            ) : (
              <Button
                onClick={handleAuthenticate}
                size="lg"
                className="w-full h-16 text-lg bg-[#1a2847] hover:bg-[#2d4875] transition-all duration-300"
              >
                <BiometricIcon className="w-6 h-6 mr-3" />
                Usar {getBiometryDisplayName()}
              </Button>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Retry Button (after error) */}
            {error && !isAuthenticating && (
              <Button
                onClick={handleAuthenticate}
                variant="outline"
                className="w-full"
              >
                Intentar de nuevo
              </Button>
            )}
          </div>

          {/* Fallback Options */}
          {(showFallbackOptions || showPasswordFallback) && (
            <div className="border-t pt-4 space-y-3">
              <p className="text-xs text-center text-muted-foreground">
                ¿Problemas con {getBiometryDisplayName()}?
              </p>
              
              <Button
                onClick={handleSkipBiometric}
                variant="ghost"
                className="w-full text-sm"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Continuar sin biometría (esta vez)
              </Button>

              {showFallbackOptions && (
                <Button
                  onClick={handleDisableAndContinue}
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground"
                >
                  Desactivar bloqueo biométrico
                </Button>
              )}

              <Button
                onClick={handleLogout}
                variant="ghost"
                className="w-full text-sm text-destructive hover:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BiometricLockScreen;
