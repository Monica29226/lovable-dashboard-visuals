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
import { toast } from 'sonner';
import { UserPlus, Shield, Edit, Crown, Eye, Clock, Users } from 'lucide-react';

interface UserWithRole {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'user' | 'viewer';
  created_at: string | null;
}

export default function UserManagement() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    role: 'user' as 'admin' | 'user' | 'viewer',
    company_ids: [] as string[],
  });

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

      const usersWithRoles: UserWithRole[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.user_id);
        return {
          ...profile,
          role: userRole?.role || 'user'
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
      setNewUser({ email: '', full_name: '', role: 'user', company_ids: [] });
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
        .update({ role })
        .eq('user_id', userId);

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
      case 'admin':
        return 'bg-primary';
      case 'user':
        return 'bg-green-500';
      case 'viewer':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'user':
        return <Edit className="h-4 w-4" />;
      case 'viewer':
        return <Eye className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: language === 'es' ? 'Administrador' : 'Administrator',
      user: language === 'es' ? 'Editor' : 'Editor',
      viewer: language === 'es' ? 'Visualizador' : 'Viewer'
    };
    return labels[role as keyof typeof labels] || role;
  };

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
                  onValueChange={(value: 'admin' | 'user' | 'viewer') => 
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      {language === 'es' ? 'Administrador' : 'Admin'}
                    </SelectItem>
                    <SelectItem value="user">
                      {language === 'es' ? 'Editor' : 'Editor'}
                    </SelectItem>
                    <SelectItem value="viewer">
                      {language === 'es' ? 'Visor' : 'Viewer'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

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
                          <SelectItem value="admin">
                            {language === 'es' ? 'Administrador' : 'Administrator'}
                          </SelectItem>
                          <SelectItem value="user">
                            {language === 'es' ? 'Editor' : 'Editor'}
                          </SelectItem>
                          <SelectItem value="viewer">
                            {language === 'es' ? 'Visualizador' : 'Viewer'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
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
    </div>
  );
}