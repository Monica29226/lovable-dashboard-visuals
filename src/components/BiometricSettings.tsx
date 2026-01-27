/**
 * =========================================================
 * BIOMETRIC SETTINGS COMPONENT
 * =========================================================
 * 
 * User-facing settings panel to enable/disable biometric lock.
 * Can be embedded in a settings page or shown as a standalone card.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/components/BiometricSettings.tsx
 * 2. Import and use: <BiometricSettings />
 * =========================================================
 */

import React, { useState } from 'react';
import { useBiometric } from '@/contexts/BiometricContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, ScanFace, Shield, ShieldOff, Smartphone, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface BiometricSettingsProps {
  /** Optional callback when settings change */
  onChange?: (enabled: boolean) => void;
  /** Show as compact inline form */
  compact?: boolean;
}

export const BiometricSettings: React.FC<BiometricSettingsProps> = ({
  onChange,
  compact = false,
}) => {
  const {
    isAvailable,
    isEnabled,
    biometryType,
    isNativePlatform,
    showBiometricSettings,
    enableBiometric,
    disableBiometric,
    authenticate,
    getBiometryDisplayName,
  } = useBiometric();

  const [isVerifying, setIsVerifying] = useState(false);

  // Get icon based on biometry type
  const BiometricIcon = biometryType?.includes('face') ? ScanFace : Fingerprint;

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      // When enabling, verify biometric first
      setIsVerifying(true);
      const result = await authenticate('Verifica tu identidad para activar el bloqueo biométrico');
      setIsVerifying(false);

      if (result.success) {
        enableBiometric();
        toast.success('Bloqueo biométrico activado');
        onChange?.(true);
      } else {
        toast.error('No se pudo verificar la biometría');
      }
    } else {
      disableBiometric();
      toast.info('Bloqueo biométrico desactivado');
      onChange?.(false);
    }
  };

  // Don't render anything if biometrics not available/applicable
  if (!showBiometricSettings) {
    // Show a message for web users during development
    if (!isNativePlatform) {
      return compact ? null : (
        <Card className="border-dashed opacity-60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Bloqueo Biométrico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              El bloqueo biométrico solo está disponible en la app móvil nativa. 
              Abre esta app en tu dispositivo iOS o Android para usar Face ID o Touch ID.
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center justify-between p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-3">
          <BiometricIcon className="w-5 h-5 text-primary" />
          <div>
            <Label htmlFor="biometric-toggle" className="font-medium cursor-pointer">
              {getBiometryDisplayName()}
            </Label>
            <p className="text-xs text-muted-foreground">
              Protege el acceso a la app
            </p>
          </div>
        </div>
        <Switch
          id="biometric-toggle"
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isVerifying}
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {isEnabled ? (
              <Shield className="w-5 h-5 text-primary" />
            ) : (
              <ShieldOff className="w-5 h-5 text-muted-foreground" />
            )}
            Bloqueo Biométrico
          </CardTitle>
          <Badge variant={isEnabled ? 'default' : 'secondary'}>
            {isEnabled ? 'Activo' : 'Inactivo'}
          </Badge>
        </div>
        <CardDescription>
          Protege tu app con {getBiometryDisplayName()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2 text-sm">
          {isAvailable ? (
            <>
              <CheckCircle className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                {getBiometryDisplayName()} disponible en este dispositivo
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Biometría no disponible
              </span>
            </>
          )}
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <BiometricIcon className="w-8 h-8 text-primary" />
            <div>
              <Label htmlFor="biometric-toggle-full" className="font-medium cursor-pointer">
                Activar {getBiometryDisplayName()}
              </Label>
              <p className="text-xs text-muted-foreground">
                Se solicitará al abrir la app
              </p>
            </div>
          </div>
          <Switch
            id="biometric-toggle-full"
            checked={isEnabled}
            onCheckedChange={handleToggle}
            disabled={isVerifying || !isAvailable}
          />
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          Cuando está activado, necesitarás verificar tu identidad con {getBiometryDisplayName()} 
          cada vez que abras la app o después de estar inactivo por un tiempo.
        </p>

        {/* Test Button (when enabled) */}
        {isEnabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => authenticate('Prueba de verificación biométrica')}
            disabled={isVerifying}
          >
            <BiometricIcon className="w-4 h-4 mr-2" />
            Probar {getBiometryDisplayName()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BiometricSettings;
