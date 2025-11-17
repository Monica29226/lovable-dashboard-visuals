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
import { UserPlus, Shield, Edit, Trash2 } from 'lucide-react';

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
    password: '',
    full_name: '',
    role: 'user' as 'admin' | 'user' | 'viewer'
  });

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

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) throw new Error('No session');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(userData),
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
      setNewUser({ email: '', password: '', full_name: '', role: 'user' });
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500';
      case 'user':
        return 'bg-blue-500';
      case 'viewer':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'user':
        return <Edit className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: language === 'es' ? 'Administrador' : 'Admin',
      user: language === 'es' ? 'Editor' : 'Editor',
      viewer: language === 'es' ? 'Visor' : 'Viewer'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          {language === 'es' ? 'Gestión de Usuarios' : 'User Management'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'es' 
            ? 'Crear, editar y gestionar usuarios del sistema'
            : 'Create, edit and manage system users'}
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

              <div className="space-y-2">
                <Label htmlFor="password">
                  {language === 'es' ? 'Contraseña' : 'Password'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  required
                />
              </div>

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
          <CardTitle>
            {language === 'es' ? 'Usuarios del Sistema' : 'System Users'}
          </CardTitle>
          <CardDescription>
            {language === 'es'
              ? 'Gestiona los usuarios y sus roles'
              : 'Manage users and their roles'}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === 'es' ? 'Usuario' : 'User'}</TableHead>
                  <TableHead>{language === 'es' ? 'Correo' : 'Email'}</TableHead>
                  <TableHead>{language === 'es' ? 'Rol' : 'Role'}</TableHead>
                  <TableHead>{language === 'es' ? 'Acciones' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.user_id}>
                    <TableCell className="font-medium">
                      {u.full_name || u.email}
                      {u.user_id === user?.id && (
                        <Badge variant="outline" className="ml-2">
                          {language === 'es' ? 'Tú' : 'You'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
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
                        <SelectTrigger className="w-[140px]">
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
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}