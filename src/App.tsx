import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Index from "./pages/Index";
import QuickBooksHub from "./pages/QuickBooksHub";
import QuickBooksBalance from "./pages/QuickBooksBalance";
import QuickBooksIncome from "./pages/QuickBooksIncome";
import QuickBooksAccountsReceivable from "./pages/QuickBooksAccountsReceivable";
import QuickBooksAccountsPayable from "./pages/QuickBooksAccountsPayable";
import QuickBooksProfitLossByProject from "./pages/QuickBooksProfitLossByProject";
import QuickBooksCallback from "./pages/QuickBooksCallback";
import QuickBooksCompanies from "./pages/QuickBooksCompanies";
import QuickBooksDebug from "./pages/QuickBooksDebug";
import QuickBooksDebugRedirect from "./pages/QuickBooksDebugRedirect";

import QuickBooksSync from "./pages/QuickBooksSync";
import QuickBooksSettings from "./pages/QuickBooksSettings";
import Budget2026 from "./pages/Budget2026";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <CompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <SidebarProvider>
                        <div className="flex min-h-screen w-full">
                          <AppSidebar />
                          <div className="flex-1 flex flex-col">
                            <header className="h-12 flex items-center justify-between border-b border-border bg-card px-4">
                              <SidebarTrigger />
                            </header>
                            <main className="flex-1">
                              <Routes>
                                <Route path="/" element={<Index />} />
                                <Route path="/quickbooks-hub" element={<QuickBooksHub />} />
                                <Route path="/quickbooks-debug" element={<QuickBooksDebug />} />
                                <Route path="/quickbooks-debug-redirect" element={<QuickBooksDebugRedirect />} />
                                
                                <Route path="/quickbooks-balance" element={<QuickBooksBalance />} />
                                <Route path="/quickbooks-income" element={<QuickBooksIncome />} />
                                <Route path="/quickbooks-accounts-receivable" element={<QuickBooksAccountsReceivable />} />
                                <Route path="/quickbooks-accounts-payable" element={<QuickBooksAccountsPayable />} />
                                <Route path="/quickbooks-profit-loss-by-project" element={<QuickBooksProfitLossByProject />} />
                                <Route path="/quickbooks-companies" element={<QuickBooksCompanies />} />
                                <Route path="/quickbooks-sync" element={<QuickBooksSync />} />
                                <Route path="/settings/quickbooks" element={<QuickBooksSettings />} />
                                <Route path="/budget-2026" element={<Budget2026 />} />
                                <Route path="/presupuesto-2026" element={<Budget2026 />} />
                                <Route path="/user-management" element={<UserManagement />} />
                                <Route path="/auth/quickbooks/callback" element={<QuickBooksCallback />} />
                                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
