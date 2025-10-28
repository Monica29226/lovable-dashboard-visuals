import { Home, FileText, BarChart3, Building2, Layers, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const menuItems = [
  { title: "Dashboard", titleEs: "Panel Principal", url: "/", icon: Home },
  { title: "QuickBooks Hub", titleEs: "Centro QuickBooks", url: "/quickbooks-hub", icon: Layers },
];

export function AppSidebar() {
  const { language } = useLanguage();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

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
        
        {user && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <div className="px-2 py-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>{language === "es" ? "Cerrar Sesión" : "Logout"}</span>
                </Button>
                <div className="text-xs text-muted-foreground mt-2 px-2 truncate">
                  {user.email}
                </div>
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
