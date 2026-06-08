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
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCompany } from "@/contexts/CompanyContext";
import { isHorizonte } from "@/lib/company";
import { Button } from "@/components/ui/button";
import { AclMonogram } from "@/components/AclMonogram";



const baseMenuItems = [
  { title: "Dashboard 2026", titleEs: "Panel 2026", url: "/panel-2026", icon: Home },
  { title: "Dashboard 2025", titleEs: "Panel 2025", url: "/", icon: Home },
];

// Budget is only available for Horizonte Positivo.
const budgetMenuItem = { title: "Budget 2026", titleEs: "Presupuesto 2026", url: "/presupuesto-2026", icon: DollarSign };

const tailMenuItems = [
  { title: "QuickBooks Online", titleEs: "QuickBooks Online", url: "/quickbooks", icon: Layers },
  { title: "Settings", titleEs: "Configuración", url: "/settings", icon: Settings },
];

const adminMenuItems = [
  { title: "User Management", titleEs: "Gestión de Usuarios", url: "/user-management", icon: UserCog },
  { title: "Companies", titleEs: "Empresas", url: "/empresas", icon: Building2 },
];

export function AppSidebar() {
  const { language } = useLanguage();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { selectedCompanyId, companies } = useCompany();

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const horizonte = isHorizonte(selectedCompany?.company_name);

  const menuItems = [
    ...baseMenuItems,
    ...(horizonte ? [budgetMenuItem] : []),
    ...tailMenuItems,
  ];

  const items = isAdmin ? [...menuItems, ...adminMenuItems] : menuItems;

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border/40">
          <AclMonogram size={36} onInk arc={false} className="shrink-0" />
          <div className="leading-tight">
            <div className="font-display text-base text-sidebar-foreground">Dashboard ACL</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">Portal</div>
          </div>
        </div>
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
