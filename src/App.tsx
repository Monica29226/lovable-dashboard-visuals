/**
 * =========================================================
 * MAIN APP COMPONENT
 * =========================================================
 * 
 * TO ADD BIOMETRIC LOCK TO ANOTHER PROJECT:
 * 1. Import BiometricProvider from '@/contexts/BiometricContext'
 * 2. Wrap your app with <BiometricProvider> INSIDE <AuthProvider>
 * 3. Use <BiometricProtectedRoute> for biometric-protected routes
 * =========================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { BiometricProvider } from "@/contexts/BiometricContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { BiometricProtectedRoute } from "@/components/BiometricProtectedRoute";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Index from "./pages/Index";
import Index2026 from "./pages/Index2026";
import QuickBooksOnline from "./pages/QuickBooksOnline";
import QuickBooksCallback from "./pages/QuickBooksCallback";
import QuickBooksDebug from "./pages/QuickBooksDebug";
import Budget2026 from "./pages/Budget2026";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <BrowserRouter>
        <AuthProvider>
          {/* BiometricProvider must be inside AuthProvider and BrowserRouter */}
          <BiometricProvider>
            <CompanyProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        {/* BiometricProtectedRoute adds biometric check after Supabase auth */}
                        <BiometricProtectedRoute>
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
                                    <Route path="/panel-2026" element={<Index2026 />} />
                                    <Route path="/quickbooks" element={<QuickBooksOnline />} />
                                    <Route path="/quickbooks-hub" element={<Navigate to="/quickbooks" replace />} />
                                    <Route path="/quickbooks-balance" element={<Navigate to="/quickbooks" replace />} />
                                    <Route path="/quickbooks-income" element={<Navigate to="/quickbooks" replace />} />
                                    <Route path="/quickbooks-accounts-receivable" element={<Navigate to="/quickbooks" replace />} />
                                    <Route path="/quickbooks-accounts-payable" element={<Navigate to="/quickbooks" replace />} />
                                    <Route path="/quickbooks-debug" element={<QuickBooksDebug />} />
                                    <Route path="/budget-2026" element={<Budget2026 />} />
                                    <Route path="/presupuesto-2026" element={<Budget2026 />} />
                                    <Route path="/user-management" element={<UserManagement />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/auth/quickbooks/callback" element={<QuickBooksCallback />} />
                                    <Route path="*" element={<NotFound />} />
                                  </Routes>
                                </main>
                              </div>
                            </div>
                          </SidebarProvider>
                        </BiometricProtectedRoute>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </TooltipProvider>
            </CompanyProvider>
          </BiometricProvider>
        </AuthProvider>
      </BrowserRouter>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
