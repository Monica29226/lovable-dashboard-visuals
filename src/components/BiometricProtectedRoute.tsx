/**
 * =========================================================
 * BIOMETRIC PROTECTED ROUTE COMPONENT
 * =========================================================
 * 
 * Higher-order component that adds biometric verification
 * on top of Supabase authentication.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/components/BiometricProtectedRoute.tsx
 * 2. Replace ProtectedRoute usage with BiometricProtectedRoute
 * =========================================================
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useBiometric } from '@/contexts/BiometricContext';
import { BiometricLockScreen } from '@/components/BiometricLockScreen';
import { Loader2 } from 'lucide-react';

interface BiometricProtectedRouteProps {
  children: React.ReactNode;
  /** Whether to require biometric on this specific route */
  requireBiometric?: boolean;
}

export const BiometricProtectedRoute: React.FC<BiometricProtectedRouteProps> = ({ 
  children,
  requireBiometric = true,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { requiresVerification, markVerified } = useBiometric();

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect handled by parent ProtectedRoute, but double-check
  if (!user) {
    return null;
  }

  // Check if biometric verification is needed
  if (requireBiometric && requiresVerification) {
    return (
      <BiometricLockScreen
        onUnlock={() => markVerified()}
        showPasswordFallback={true}
      />
    );
  }

  return <>{children}</>;
};

export default BiometricProtectedRoute;
