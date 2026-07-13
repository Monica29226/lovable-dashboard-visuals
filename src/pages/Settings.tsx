/**
 * =========================================================
 * SETTINGS PAGE
 * =========================================================
 *
 * Unified settings page with tabs:
 *  - Mi Cuenta: account, brand/colors, domain, security/biometric, debug, logout
 *  - Credenciales QuickBooks: staff-only (admin/contador)
 *  - Usuarios: admin-only
 * =========================================================
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { BiometricSettings } from '@/components/BiometricSettings';
import { BiometricDebug } from '@/components/BiometricDebug';
import { DomainSelector } from '@/components/DomainSelector';
import { BrandColorSettings } from '@/components/BrandColorSettings';
import QuickBooksSettings from '@/pages/QuickBooksSettings';
import UserManagement from '@/pages/UserManagement';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Shield, Settings as SettingsIcon, Bug, KeyRound, Users } from 'lucide-react';
import { toast } from 'sonner';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isStaff } = useUserRole();
  const { isAdmin } = useIsAdmin();
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
    <div className="container max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Configuración
        </h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias
        </p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Mi Cuenta
          </TabsTrigger>
          {isStaff && (
            <TabsTrigger value="quickbooks" className="flex items-center gap-2">
              <KeyRound className="w-4 h-4" />
              Credenciales QuickBooks
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Usuarios
            </TabsTrigger>
          )}
        </TabsList>

        {/* ============ MI CUENTA ============ */}
        <TabsContent value="account" className="space-y-6">
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
        </TabsContent>

        {/* ============ CREDENCIALES QUICKBOOKS (staff) ============ */}
        {isStaff && (
          <TabsContent value="quickbooks">
            <QuickBooksSettings />
          </TabsContent>
        )}

        {/* ============ USUARIOS (admin) ============ */}
        {isAdmin && (
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Settings;
