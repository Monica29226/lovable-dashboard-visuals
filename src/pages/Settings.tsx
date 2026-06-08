/**
 * =========================================================
 * SETTINGS PAGE
 * =========================================================
 * 
 * User settings page including biometric lock configuration.
 * 
 * TO COPY TO ANOTHER PROJECT:
 * 1. Copy this file to src/pages/Settings.tsx
 * 2. Add route: <Route path="/settings" element={<Settings />} />
 * =========================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BiometricSettings } from '@/components/BiometricSettings';
import { BiometricDebug } from '@/components/BiometricDebug';
import { DomainSelector } from '@/components/DomainSelector';
import { BrandColorSettings } from '@/components/BrandColorSettings';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, LogOut, User, Shield, Settings as SettingsIcon, Bug } from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDebug, setShowDebug] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada');
      navigate('/auth');
    } catch {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="w-6 h-6" />
            Configuración
          </h1>
          <p className="text-muted-foreground">
            Administra tu cuenta y preferencias
          </p>
        </div>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-5 h-5" />
            Cuenta
          </CardTitle>
          <CardDescription>
            Información de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">{user?.email}</p>
              <p className="text-sm text-muted-foreground">
                Correo electrónico
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brand & colors (white-label accent per company) */}
      <BrandColorSettings />

      {/* Domain Selection */}
      <DomainSelector />


      {/* Security Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Seguridad
        </h2>
        
        {/* Biometric Settings */}
        <BiometricSettings />
      </div>

      <Separator />

      {/* Debug Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="show-debug" className="flex items-center gap-2 cursor-pointer">
            <Bug className="w-4 h-4" />
            Mostrar panel de depuración
          </Label>
          <Switch
            id="show-debug"
            checked={showDebug}
            onCheckedChange={setShowDebug}
          />
        </div>
        
        {showDebug && <BiometricDebug />}
      </div>

      <Separator />

      {/* Logout */}
      <Card className="border-destructive/20">
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            className="w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </CardContent>
      </Card>

      {/* Version Info */}
      <p className="text-center text-xs text-muted-foreground">
        Versión 1.0.0
      </p>
    </div>
  );
};

export default Settings;
