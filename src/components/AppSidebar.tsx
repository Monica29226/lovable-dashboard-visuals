import { Home, FileText, BarChart3, Layers, DollarSign, LogOut, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const menuItems = [
  { title: "Dashboard", titleEs: "Panel Principal", url: "/", icon: Home },
  { title: "Income Statement", titleEs: "Estado de Resultados", url: "/quickbooks-income", icon: FileText },
  { title: "Balance Sheet", titleEs: "Estado de Posición Financiera", url: "/quickbooks-balance", icon: BarChart3 },
  { title: "Budget 2026", titleEs: "Presupuesto 2026", url: "/presupuesto-2026", icon: DollarSign },
  { title: "User Configuration", titleEs: "Configuración de Usuarios", url: "/user-configuration", icon: Users },
  { title: "QuickBooks Hub", titleEs: "Centro QuickBooks", url: "/quickbooks-hub", icon: Layers },
];

export function AppSidebar() {
  const { language } = useLanguage();
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold">
            {language === "es" ? "Menú" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 ${
                          isActive
                            ? "bg-primary text-primary-foreground font-medium"
                            : "hover:bg-muted"
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{language === "es" ? item.titleEs : item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 space-y-2">
          <div className="text-xs text-muted-foreground truncate">
            {user?.email}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            {language === "es" ? "Cerrar Sesión" : "Sign Out"}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
