import { Home, DollarSign, LogOut, UserCog, Layers, Settings, Building2 } from "lucide-react";
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
import { useIsAdmin } from "@/hooks/useIsAdmin";

const menuItems = [
  { title: "Dashboard 2026", titleEs: "Panel 2026", url: "/panel-2026", icon: Home },
  { title: "Dashboard 2025", titleEs: "Panel 2025", url: "/", icon: Home },
  { title: "Budget 2026", titleEs: "Presupuesto 2026", url: "/presupuesto-2026", icon: DollarSign },
  { title: "User Management", titleEs: "Gestión de Usuarios", url: "/user-management", icon: UserCog },
  { title: "Companies", titleEs: "Empresas", url: "/empresas", icon: Building2 },
  { title: "QuickBooks Online", titleEs: "QuickBooks Online", url: "/quickbooks", icon: Layers },
  { title: "Settings", titleEs: "Configuración", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { language } = useLanguage();
  const { signOut, user } = useAuth();

  const items = menuItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold">
            {language === "es" ? "Menú" : "Menu"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
