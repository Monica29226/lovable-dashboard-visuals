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
import Index from "./pages/Index";
import QuickBooksHub from "./pages/QuickBooksHub";
import QuickBooksBalance from "./pages/QuickBooksBalance";
import QuickBooksIncome from "./pages/QuickBooksIncome";
import QuickBooksCallback from "./pages/QuickBooksCallback";
import QuickBooksCompanies from "./pages/QuickBooksCompanies";
import Auth from "./pages/Auth";
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
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col">
                    <header className="h-12 flex items-center justify-between border-b border-border bg-card px-4">
                      <SidebarTrigger />
                    </header>
                    <main className="flex-1">
                      <Routes>
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/auth/quickbooks/callback" element={<QuickBooksCallback />} />
                        <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                        <Route path="/quickbooks-hub" element={<ProtectedRoute><QuickBooksHub /></ProtectedRoute>} />
                        <Route path="/quickbooks-balance" element={<ProtectedRoute><QuickBooksBalance /></ProtectedRoute>} />
                        <Route path="/quickbooks-income" element={<ProtectedRoute><QuickBooksIncome /></ProtectedRoute>} />
                        <Route path="/quickbooks-companies" element={<ProtectedRoute><QuickBooksCompanies /></ProtectedRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
