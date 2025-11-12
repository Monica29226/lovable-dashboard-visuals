import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, UserPlus, Shield, Eye, Edit, Crown } from "lucide-react";
import { toast } from "sonner";

export default function UserConfiguration() {
  const { user } = useAuth();
  const { language } = useLanguage();

  const handleInviteClick = () => {
    toast.info(
      language === "es"
        ? "Usa el botón 'Share' en la parte superior derecha para invitar colaboradores"
        : "Use the 'Share' button in the top right to invite collaborators"
    );
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

      {/* Current User Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {language === "es" ? "Usuario Actual" : "Current User"}
          </CardTitle>
          <CardDescription>
            {language === "es"
              ? "Información sobre tu sesión actual"
              : "Information about your current session"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "es" ? "Email" : "Email"}
              </p>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Crown className="h-5 w-5" />
              <span className="font-medium">
                {language === "es" ? "Administrador" : "Administrator"}
              </span>
            </div>
          </div>
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
