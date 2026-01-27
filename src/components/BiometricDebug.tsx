/**
 * =========================================================
 * BIOMETRIC DEBUG COMPONENT
 * =========================================================
 * 
 * Use this component to troubleshoot biometric issues.
 * Shows all relevant state and allows testing.
 * 
 * Add to any page: <BiometricDebug />
 * =========================================================
 */

import React, { useState } from 'react';
import { useBiometric } from '@/contexts/BiometricContext';
import { Capacitor } from '@capacitor/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Bug, 
  Smartphone, 
  Globe, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Fingerprint,
  ScanFace,
  RefreshCw,
  Play
} from 'lucide-react';
import { biometricConfig } from '@/config/biometricConfig';

export const BiometricDebug: React.FC = () => {
  const biometric = useBiometric();
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTestingAvailability, setIsTestingAvailability] = useState(false);
  const [isTestingAuth, setIsTestingAuth] = useState(false);

  const platform = Capacitor.getPlatform();
  const isNative = Capacitor.isNativePlatform();

  const handleTestAvailability = async () => {
    setIsTestingAvailability(true);
    setTestResult(null);
    try {
      const result = await biometric.checkAvailability();
      setTestResult(JSON.stringify(result, null, 2));
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsTestingAvailability(false);
  };

  const handleTestAuthenticate = async () => {
    setIsTestingAuth(true);
    setTestResult(null);
    try {
      const result = await biometric.authenticate('Test de autenticación biométrica');
      setTestResult(JSON.stringify(result, null, 2));
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
    setIsTestingAuth(false);
  };

  const StatusIcon = ({ condition }: { condition: boolean }) => 
    condition ? (
      <CheckCircle className="w-4 h-4 text-primary" />
    ) : (
      <XCircle className="w-4 h-4 text-destructive" />
    );

  const BiometricIcon = biometric.biometryType?.includes('face') ? ScanFace : Fingerprint;

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bug className="w-5 h-5" />
          Biometric Debug Panel
        </CardTitle>
        <CardDescription>
          Información de diagnóstico para solucionar problemas
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Platform Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Plataforma</h4>
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {isNative ? (
              <Smartphone className="w-5 h-5 text-primary" />
            ) : (
              <Globe className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{platform.toUpperCase()}</p>
              <p className="text-xs text-muted-foreground">
                {isNative ? 'Entorno nativo (Capacitor)' : 'Navegador web'}
              </p>
            </div>
            <Badge variant={isNative ? 'default' : 'secondary'} className="ml-auto">
              {isNative ? 'Nativo' : 'Web'}
            </Badge>
          </div>
          {!isNative && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Biometrics solo funcionan en apps nativas (iOS/Android)
            </p>
          )}
        </div>

        <Separator />

        {/* Biometric State */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Estado Biométrico</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>isNativePlatform</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={biometric.isNativePlatform} />
                <code className="text-xs">{String(biometric.isNativePlatform)}</code>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>isAvailable</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={biometric.isAvailable} />
                <code className="text-xs">{String(biometric.isAvailable)}</code>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>biometryType</span>
              <div className="flex items-center gap-2">
                <BiometricIcon className="w-4 h-4" />
                <code className="text-xs">{biometric.biometryType || 'null'}</code>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>isEnabled (user pref)</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={biometric.isEnabled} />
                <code className="text-xs">{String(biometric.isEnabled)}</code>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>isVerified (session)</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={biometric.isVerified} />
                <code className="text-xs">{String(biometric.isVerified)}</code>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>requiresVerification</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={biometric.requiresVerification} />
                <code className="text-xs">{String(biometric.requiresVerification)}</code>
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>showBiometricSettings</span>
              <div className="flex items-center gap-2">
                <StatusIcon condition={biometric.showBiometricSettings} />
                <code className="text-xs">{String(biometric.showBiometricSettings)}</code>
              </div>
            </div>
            {biometric.error && (
              <div className="p-2 bg-destructive/10 text-destructive rounded">
                <span className="font-medium">Error:</span> {biometric.error}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Config */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Configuración</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>config.enabled</span>
              <code className="text-xs">{String(biometricConfig.enabled)}</code>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>config.triggerPoint</span>
              <code className="text-xs">{biometricConfig.triggerPoint}</code>
            </div>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span>backgroundLockTimeout</span>
              <code className="text-xs">{biometricConfig.backgroundLockTimeout / 1000}s</code>
            </div>
          </div>
        </div>

        <Separator />

        {/* Test Actions */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Pruebas</h4>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestAvailability}
              disabled={isTestingAvailability}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isTestingAvailability ? 'animate-spin' : ''}`} />
              Test checkAvailability()
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestAuthenticate}
              disabled={isTestingAuth || !isNative}
            >
              <Play className={`w-4 h-4 mr-2 ${isTestingAuth ? 'animate-spin' : ''}`} />
              Test authenticate()
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => biometric.clearVerification()}
            >
              Clear Verification (require re-auth)
            </Button>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Resultado del Test</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-auto max-h-40">
              {testResult}
            </pre>
          </div>
        )}

        {/* Checklist */}
        <Separator />
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Checklist para que aparezca el prompt</h4>
          <ul className="text-xs space-y-1 text-muted-foreground">
            <li className="flex items-center gap-2">
              <StatusIcon condition={isNative} />
              Ejecutar en iOS/Android nativo (no navegador web)
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon condition={biometric.isAvailable} />
              Dispositivo debe soportar Face ID / Touch ID
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon condition={biometric.isEnabled} />
              Usuario debe habilitar biometrics en Configuración
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon condition={!biometric.isVerified} />
              Sesión NO debe estar ya verificada
            </li>
            <li className="flex items-center gap-2">
              <StatusIcon condition={biometricConfig.enabled} />
              config.enabled debe ser true
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BiometricDebug;
