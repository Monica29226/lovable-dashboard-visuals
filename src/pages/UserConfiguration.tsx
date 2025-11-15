import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, UserPlus, Shield, Eye, Edit, Crown, Clock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface UserWithRole {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function UserConfiguration() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
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
    }
  });

  const handleInviteClick = () => {
    toast.info(
      language === "es"
        ? "Usa el botón 'Share' en la parte superior derecha para invitar colaboradores"
        : "Use the 'Share' button in the top right to invite collaborators"
    );
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-primary" />;
      case 'user':
        return <Edit className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    if (language === "es") {
      switch (role) {
        case 'admin': return 'Administrador';
        case 'user': return 'Editor';
        case 'viewer': return 'Visualizador';
        default: return role;
      }
    } else {
      switch (role) {
        case 'admin': return 'Administrator';
        case 'user': return 'Editor';
        case 'viewer': return 'Viewer';
        default: return role;
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          {language === "es" ? "Configuración de Usuarios" : "User Configuration"}
        </h1>
        <p className="text-muted-foreground">
          {language === "es"
            ? "Gestiona los usuarios que tienen acceso a este proyecto"
            : "Manage users who have access to this project"}
        </p>
      </div>

      {/* Active Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {language === "es" ? "Usuarios Activos" : "Active Users"}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Usuarios con acceso confirmado al proyecto"
              : "Users with confirmed access to the project"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              {language === "es" ? "Cargando usuarios..." : "Loading users..."}
            </div>
          ) : users && users.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{language === "es" ? "Usuario" : "User"}</TableHead>
                    <TableHead>{language === "es" ? "Email" : "Email"}</TableHead>
                    <TableHead>{language === "es" ? "Rol" : "Role"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((projectUser) => (
                    <TableRow key={projectUser.user_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {projectUser.full_name || projectUser.email}
                          {projectUser.user_id === user?.id && (
                            <span className="text-xs text-muted-foreground">
                              ({language === "es" ? "Tú" : "You"})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {projectUser.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(projectUser.role)}
                          <span>{getRoleLabel(projectUser.role)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              {language === "es" ? "No hay usuarios" : "No users found"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Users Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            {language === "es" ? "Invitar Colaboradores" : "Invite Collaborators"}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Agrega nuevos usuarios al proyecto"
              : "Add new users to the project"}
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
              ? "Para invitar colaboradores a este proyecto, usa el botón 'Share' en la parte superior derecha de la pantalla."
              : "To invite collaborators to this project, use the 'Share' button in the top right of the screen."}
          </p>
          <Button onClick={handleInviteClick} className="w-full sm:w-auto">
            <UserPlus className="h-4 w-4 mr-2" />
            {language === "es" ? "Invitar Usuario" : "Invite User"}
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
                  {language === "es" ? "Administrador" : "Admin"}
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
