/**
 * =========================================================
 * MAIN APP COMPONENT
 * =========================================================
 *
 * NOTA: la biometría quedó desconectada de la app web porque
 * en navegador no protege nada (da falsa sensación de seguridad).
 * Los componentes se conservan en el repo por si algún día se
 * publica la app nativa.
 * =========================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { CompanySelector } from "@/components/CompanySelector";
import { LanguageToggle } from "@/components/LanguageToggle";

import { LanguageProvider } from "@/contexts/LanguageContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import { StaffRoute } from "@/components/StaffRoute";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";

import Index2026 from "./pages/Index2026";
import QuickBooksOnline from "./pages/QuickBooksOnline";
import IncomeStatementUSDPage from "./pages/IncomeStatementUSD";
import QuickBooksCallback from "./pages/QuickBooksCallback";

import Budget2026 from "./pages/Budget2026";
import Empresas from "./pages/Empresas";
import CentroDocumental from "./pages/CentroDocumental";
import Settings from "./pages/Settings";
import Unsubscribe from "./pages/Unsubscribe";
import NotFound from "./pages/NotFound";
import VistaGlobal from "./pages/VistaGlobal";
import { useCompany } from "@/contexts/CompanyContext";

const queryClient = new QueryClient();

// Los clientes de un grupo empresarial abren en "Vista global"; el resto mantiene el panel actual.
const HomeRoute = () => {
  const { hasGroups, isGlobalView } = useCompany();
  return hasGroups && isGlobalView ? <VistaGlobal /> : <Index />;
};


const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          <CompanyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/unsubscribe" element={<Unsubscribe />} />
                {/* Public OAuth callback — must NOT be behind ProtectedRoute */}
                <Route path="/auth/quickbooks/callback" element={<QuickBooksCallback />} />

                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar />
                          <div className="flex-1 flex flex-col">
                            <header className="app-header h-12 flex items-center justify-between border-b border-border bg-card px-4">
                              <SidebarTrigger />
                              <div className="flex items-center gap-2">
                                <LanguageToggle />
                                <CompanySelector />
                              </div>
                            </header>

                            <main className="flex-1">
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/panel-corporativo" element={<Navigate to="/empresas" replace />} />
                                <Route path="/panel-2026" element={<Index2026 />} />
                                <Route path="/quickbooks" element={<QuickBooksOnline />} />
                                <Route path="/estado-resultados-usd" element={<IncomeStatementUSDPage />} />
                                <Route path="/quickbooks-settings" element={<Navigate to="/settings" replace />} />
                                <Route path="/quickbooks-hub" element={<Navigate to="/quickbooks" replace />} />
                                <Route path="/quickbooks-balance" element={<Navigate to="/quickbooks" replace />} />
                                <Route path="/quickbooks-income" element={<Navigate to="/quickbooks" replace />} />
                                <Route path="/quickbooks-accounts-receivable" element={<Navigate to="/quickbooks" replace />} />
                                <Route path="/quickbooks-accounts-payable" element={<Navigate to="/quickbooks" replace />} />

                                <Route path="/budget-2026" element={<Budget2026 />} />
                                <Route path="/centro-documental" element={<CentroDocumental />} />
                                <Route path="/documentos" element={<Navigate to="/centro-documental" replace />} />
                                <Route path="/presupuesto-2026" element={<Budget2026 />} />
                                <Route path="/user-management" element={<Navigate to="/settings" replace />} />
                                <Route path="/empresas" element={<StaffRoute><Empresas /></StaffRoute>} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<NotFound />} />
                              </Routes>
                            </main>
                          </div>
                        </div>
                      </SidebarProvider>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </TooltipProvider>
          </CompanyProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
