import { Home, FileText, BarChart3, Settings } from "lucide-react";
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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const menuItems = [
  { title: "Dashboard", titleEs: "Panel Principal", url: "/", icon: Home },
  { title: "QuickBooks Balance", titleEs: "Balance QuickBooks", url: "/quickbooks-balance", icon: BarChart3 },
  { title: "Income Statement", titleEs: "Estado de Resultados", url: "/quickbooks-income", icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const { language } = useLanguage();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary font-bold">
            {!collapsed && (language === "es" ? "Menú" : "Menu")}
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
                      {!collapsed && <span>{language === "es" ? item.titleEs : item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
