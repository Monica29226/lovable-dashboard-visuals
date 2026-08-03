import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { UserPlus, Shield, Edit, Crown, Eye, Clock, Users, Mail, Trash2, AlertTriangle, Send } from 'lucide-react';


type Role = 'admin' | 'contador' | 'cliente' | 'user' | 'viewer';

interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  created_at: string | null;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'cliente' as Role,
    company_ids: [] as string[],
  });

  // Row action dialogs
  const [emailTarget, setEmailTarget] = useState<UserWithRole | null>(null);
  const [newEmailValue, setNewEmailValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<UserWithRole | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');


  // Companies for access assignment
  const { data: companies } = useQuery({
    queryKey: ['companies-for-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quickbooks_companies')
        .select('id, company_name')
        .order('company_name');
      if (error) throw error;
      return data as { id: string; company_name: string }[];
    },
    enabled: !!user,
  });

  const toggleCompany = (id: string) => {
    setNewUser((prev) => ({
      ...prev,
      company_ids: prev.company_ids.includes(id)
        ? prev.company_ids.filter((c) => c !== id)
        : [...prev.company_ids, id],
    }));
  };

  // Fetch all users with their roles
  const { data: users, isLoading } = useQuery({
    queryKey: ['all-users'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name, created_at');

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const rolePriority: Record<string, number> = {
        admin: 1, contador: 2, cliente: 3, user: 4, viewer: 5,
      };

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRoles = roles.filter(r => r.user_id === profile.user_id);
        const best = userRoles.sort(
          (a, b) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99)
        )[0];
        return {
          ...profile,
          role: (best?.role as Role) || 'user'
        };
      });

      return usersWithRoles;
    },
    enabled: !!user
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('No session');

      const autoPassword = generatePassword();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ ...userData, password: autoPassword }),
        }
      );

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setNewUser({ email: '', full_name: '', role: 'cliente', company_ids: [] });
      toast.success(
        language === 'es' ? 'Usuario creado exitosamente' : 'User created successfully'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: role as Role }, { onConflict: 'user_id' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success(
        language === 'es' ? 'Rol actualizado exitosamente' : 'Role updated successfully'
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });

  // Shared helper to call admin edge functions with the caller's session token.
  const callAdminFunction = async (fn: string, payload: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error(language === 'es' ? 'Sesión no válida' : 'Invalid session');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${fn}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error');
    return result;
  };

  // Change email mutation
  const changeEmailMutation = useMutation({
    mutationFn: ({ userId, newEmail }: { userId: string; newEmail: string }) =>
      callAdminFunction('admin-update-user-email', { userId, newEmail }),
    onSuccess: (result: { warning?: string }) => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setEmailTarget(null);
      if (result?.warning) {
        toast.warning(result.warning);
      } else {
        toast.success(
          language === 'es'
            ? 'El correo del usuario se actualizó correctamente'
            : 'The user email was updated successfully'
        );
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  // Sign-in status (auth data is only readable server-side).
  const { data: signInStatus } = useQuery({
    queryKey: ['users-sign-in-status'],
    enabled: !!user,
    queryFn: async () => {
      const result = await callAdminFunction('admin-resend-invitation', { listStatus: true });
      const map: Record<string, string | null> = {};
      for (const u of (result?.users || []) as { id: string; last_sign_in_at: string | null }[]) {
        map[u.id] = u.last_sign_in_at;
      }
      return map;
    },
    retry: false,
  });

  // Resend invitation mutation
  const [resendingId, setResendingId] = useState<string | null>(null);
  const resendInvitationMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      callAdminFunction('admin-resend-invitation', { userId }),
    onSuccess: (result: { emailSent?: boolean; email?: string; error?: string }) => {
      if (result?.emailSent) {
        toast.success(`Se reenvió la invitación a ${result.email ?? 'el usuario'}.`);
      } else {
        toast.error(result?.error || 'La invitación no se pudo enviar.');
      }
    },
    onError: (error: Error) => toast.error(error.message),
    onSettled: () => setResendingId(null),
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      callAdminFunction('admin-delete-user', { userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      setDeleteTarget(null);
      setDeleteConfirmation('');
      toast.success(
        language === 'es'
          ? 'El usuario fue eliminado y se le retiró el acceso a todas sus empresas'
          : 'The user was deleted and their access to all companies was removed'
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });


  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(newUser);
  };


  const handleInviteClick = () => {
    toast.info(
      language === "es"
        ? "Usa el botón 'Share' en la parte superior derecha para invitar colaboradores"
        : "Use the 'Share' button in the top right to invite collaborators"
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-primary';
      case 'contador': return 'bg-amber-600';
      case 'user': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'contador': return <Edit className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: language === 'es' ? 'Administrador' : 'Administrator',
      contador: language === 'es' ? 'Contador' : 'Accountant',
      cliente: language === 'es' ? 'Cliente' : 'Client',
      user: language === 'es' ? 'Editor' : 'Editor',
      viewer: language === 'es' ? 'Visualizador' : 'Viewer',
    };
    return labels[role] || role;
  };

  // Used to block deleting the last administrator from the UI.
  const adminCount = (users || []).filter((u) => u.role === 'admin').length;


  const roleOptions = (
    <>
      <SelectItem value="admin">{getRoleLabel('admin')}</SelectItem>
      <SelectItem value="contador">{getRoleLabel('contador')}</SelectItem>
      <SelectItem value="cliente">{getRoleLabel('cliente')}</SelectItem>
    </>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          {language === 'es' ? 'Gestión de Usuarios' : 'User Management'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'es' 
            ? 'Gestiona los usuarios que tienen acceso a este proyecto'
            : 'Manage users who have access to this project'}
        </p>
      </div>

      {/* Create User Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {language === 'es' ? 'Crear Nuevo Usuario' : 'Create New User'}
          </CardTitle>
          <CardDescription>
            {language === 'es'
              ? 'Agrega un nuevo usuario al sistema con su rol asignado'
              : 'Add a new user to the system with their assigned role'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  {language === 'es' ? 'Correo Electrónico' : 'Email'}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="usuario@ejemplo.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">
                  {language === 'es' ? 'Nombre Completo' : 'Full Name'}
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder={language === 'es' ? 'Nombre Completo' : 'Full Name'}
                />
              </div>

              <p className="text-xs text-muted-foreground">
                {language === 'es' 
                  ? 'La contraseña se generará automáticamente por el sistema' 
                  : 'Password will be auto-generated by the system'}
              </p>

              <div className="space-y-2">
                <Label htmlFor="role">
                  {language === 'es' ? 'Rol' : 'Role'}
                </Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: Role) =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {newUser.role !== 'admin' && (
              <div className="space-y-2">
                <Label>
                  {language === 'es' ? 'Empresas con acceso' : 'Companies with access'}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === 'es'
                    ? 'El usuario solo verá las empresas seleccionadas. Los administradores ven todas.'
                    : 'The user will only see selected companies. Admins see all.'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(companies || []).map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={newUser.company_ids.includes(c.id)}
                        onCheckedChange={() => toggleCompany(c.id)}
                      />
                      <span className="text-sm">{c.company_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}


            <Button 
              type="submit" 
              disabled={createUserMutation.isPending}
              className="w-full md:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {createUserMutation.isPending
                ? (language === 'es' ? 'Creando...' : 'Creating...')
                : (language === 'es' ? 'Crear Usuario' : 'Create User')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {language === 'es' ? 'Usuarios Activos' : 'Active Users'}
          </CardTitle>
          <CardDescription>
            {language === 'es'
              ? 'Usuarios con acceso confirmado al proyecto'
              : 'Users with confirmed access to the project'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'es' ? 'Cargando usuarios...' : 'Loading users...'}
            </div>
          ) : !users || users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'es' ? 'No hay usuarios' : 'No users found'}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'es' ? 'Usuario' : 'User'}</TableHead>
                  <TableHead>{language === 'es' ? 'Correo' : 'Email'}</TableHead>
                  <TableHead>{language === 'es' ? 'Rol' : 'Role'}</TableHead>
                  <TableHead>{language === 'es' ? 'Cambiar Rol' : 'Change Role'}</TableHead>
                  <TableHead className="text-right">{language === 'es' ? 'Acciones' : 'Actions'}</TableHead>

                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {u.full_name || u.email}
                        {u.user_id === user?.id && (
                          <Badge variant="outline">
                            {language === 'es' ? 'Tú' : 'You'}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(u.role)}>
                        <span className="flex items-center gap-1">
                          {getRoleIcon(u.role)}
                          {getRoleLabel(u.role)}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={u.role}
                        onValueChange={(value) =>
                          updateRoleMutation.mutate({ userId: u.user_id, role: value })
                        }
                        disabled={u.user_id === user?.id}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      {(() => {
                        const isSelf = u.user_id === user?.id;
                        const isLastAdmin = u.role === 'admin' && adminCount <= 1;
                        const blockedReason = isSelf
                          ? (language === 'es'
                              ? 'No puede eliminar su propia cuenta'
                              : 'You cannot delete your own account')
                          : isLastAdmin
                            ? (language === 'es'
                                ? 'Es el último administrador'
                                : 'This is the last administrator')
                            : null;

                        return (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEmailTarget(u);
                                setNewEmailValue(u.email || '');
                              }}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {language === 'es' ? 'Cambiar correo' : 'Change email'}
                            </Button>

                            {blockedReason ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span tabIndex={0}>
                                      <Button variant="outline" size="sm" disabled>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {language === 'es' ? 'Eliminar' : 'Delete'}
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>{blockedReason}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget(u);
                                  setDeleteConfirmation('');
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {language === 'es' ? 'Eliminar' : 'Delete'}
                              </Button>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Collaborators Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {language === "es" ? "Invitar Colaboradores" : "Invite Collaborators"}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Información sobre cómo invitar usuarios externos al proyecto"
              : "Information about inviting external users to the project"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-orange-500 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">
                {language === "es" ? "Invitaciones Pendientes" : "Pending Invitations"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "es"
                  ? "Las invitaciones pendientes se gestionan a través del botón 'Share' en la parte superior derecha. Los usuarios invitados aparecerán en la lista de usuarios activos una vez que acepten la invitación."
                  : "Pending invitations are managed through the 'Share' button in the top right. Invited users will appear in the active users list once they accept the invitation."}
              </p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {language === "es"
              ? "Para invitar colaboradores externos a este proyecto de Lovable, usa el botón 'Share' en la parte superior derecha de la pantalla."
              : "To invite external collaborators to this Lovable project, use the 'Share' button in the top right of the screen."}
          </p>
          <Button onClick={handleInviteClick} variant="outline" className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            {language === "es" ? "Más Información" : "More Information"}
          </Button>
        </CardContent>
      </Card>

      {/* Access Levels Card */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === "es" ? "Niveles de Acceso" : "Access Levels"}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Descripción de los diferentes roles disponibles"
              : "Description of the different available roles"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Eye className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">
                  {language === "es" ? "Visualizador" : "Viewer"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "es"
                    ? "Puede ver todos los datos del proyecto pero no puede hacer cambios"
                    : "Can view all project data but cannot make changes"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Edit className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">
                  {language === "es" ? "Editor" : "Editor"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "es"
                    ? "Puede ver y editar datos del proyecto"
                    : "Can view and edit project data"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Crown className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">
                  {language === "es" ? "Administrador" : "Administrator"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {language === "es"
                    ? "Acceso completo incluyendo configuración, gestión de usuarios y despliegue"
                    : "Full access including settings, user management, and deployment"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change email dialog */}
      <Dialog open={!!emailTarget} onOpenChange={(open) => !open && setEmailTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              {language === 'es' ? 'Cambiar correo' : 'Change email'}
            </DialogTitle>
            <DialogDescription>
              {language === 'es'
                ? 'El nuevo correo quedará confirmado de inmediato y será el que la persona use para ingresar. Su contraseña no cambia.'
                : 'The new email is confirmed immediately and becomes the sign-in address. The password is unchanged.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{language === 'es' ? 'Usuario' : 'User'}</Label>
              <p className="text-sm text-muted-foreground">
                {emailTarget?.full_name || emailTarget?.email}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">
                {language === 'es' ? 'Correo electrónico' : 'Email address'}
              </Label>
              <Input
                id="new-email"
                type="email"
                value={newEmailValue}
                onChange={(e) => setNewEmailValue(e.target.value)}
                placeholder="usuario@ejemplo.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailTarget(null)}>
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              disabled={
                changeEmailMutation.isPending ||
                !newEmailValue.trim() ||
                newEmailValue.trim().toLowerCase() === (emailTarget?.email || '').toLowerCase()
              }
              onClick={() =>
                emailTarget &&
                changeEmailMutation.mutate({
                  userId: emailTarget.user_id,
                  newEmail: newEmailValue.trim(),
                })
              }
            >
              {changeEmailMutation.isPending
                ? (language === 'es' ? 'Guardando...' : 'Saving...')
                : (language === 'es' ? 'Guardar correo' : 'Save email')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete user dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteConfirmation('');
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {language === 'es' ? 'Eliminar usuario' : 'Delete user'}
            </DialogTitle>
            <DialogDescription>
              {language === 'es'
                ? 'Se eliminará la cuenta de forma permanente y se le retirará el acceso a todas sus empresas. Esta acción no se puede deshacer.'
                : 'The account will be permanently deleted and their access to all companies removed. This action cannot be undone.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <p className="font-medium">{deleteTarget?.full_name || deleteTarget?.email}</p>
              <p className="text-muted-foreground">{deleteTarget?.email}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm">
                {language === 'es'
                  ? 'Para confirmar, escriba el correo exacto del usuario'
                  : 'To confirm, type the exact email of the user'}
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={deleteTarget?.email || ''}
                autoComplete="off"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteConfirmation('');
              }}
            >
              {language === 'es' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button
              variant="destructive"
              disabled={
                deleteUserMutation.isPending ||
                !deleteTarget?.email ||
                deleteConfirmation.trim().toLowerCase() !== deleteTarget.email.toLowerCase()
              }
              onClick={() =>
                deleteTarget && deleteUserMutation.mutate({ userId: deleteTarget.user_id })
              }
            >
              {deleteUserMutation.isPending
                ? (language === 'es' ? 'Eliminando...' : 'Deleting...')
                : (language === 'es' ? 'Eliminar definitivamente' : 'Delete permanently')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>

  );
}