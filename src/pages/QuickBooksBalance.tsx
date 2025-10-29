import { useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ChevronDown, ChevronRight, ArrowLeft, FileText, DollarSign, Receipt } from "lucide-react";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const QuickBooksBalanceContent = () => {
  const { t } = useLanguage();
  const { selectedCompanyId, companies } = useCompany();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [balanceData, setBalanceData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const selectedCompany = companies.find(c => c.id === selectedCompanyId);

  const handleAuth = async () => {
    if (!selectedCompanyId) {
      toast.error('Por favor selecciona una empresa');
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-auth', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Error al autenticar con QuickBooks');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    if (!selectedCompanyId) return;
    try {
      setLoading(true);
      console.log('Fetching balance for company:', selectedCompanyId);
      const { data, error } = await supabase.functions.invoke('quickbooks-balance', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      
      console.log('Balance data received:', data);
      setBalanceData(data);
      toast.success('Balance cargado exitosamente');
    } catch (error) {
      console.error('Error fetching balance:', error);
      toast.error('Error al cargar el balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      // If no company is selected, try to find and select "Horizonte Positivo"
      if (!selectedCompanyId && companies.length > 0) {
        const horizontePositivo = companies.find(c => c.company_name === 'Horizonte Positivo');
        if (horizontePositivo) {
          // This will trigger the effect again with the selected company
          return;
        }
      }

      if (!selectedCompanyId) return;

      try {
        const { data } = await supabase.functions.invoke('quickbooks-check-auth', {
          body: { companyId: selectedCompanyId }
        });
        setIsAuthenticated(data?.authenticated || false);
        if (data?.authenticated) {
          fetchBalance();
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
    };
    checkAuth();
  }, [selectedCompanyId, companies]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">
                  Balance QuickBooks - {selectedCompany?.company_name || 'Selecciona empresa'}
                </h1>
                <p className="text-sm text-muted-foreground">Datos en Colones (CRC)</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
            </div>
          </div>
        </header>

        {/* Quick Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-income')}>
                <FileText className="h-4 w-4 mr-2" />
                Estado de Resultados
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-payable')}>
                <Receipt className="h-4 w-4 mr-2" />
                Cuentas por Pagar
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/quickbooks-accounts-receivable')}>
                <DollarSign className="h-4 w-4 mr-2" />
                Cuentas por Cobrar
              </Button>
            </div>
          </CardContent>
        </Card>

        {!isAuthenticated ? (
          <Card>
            <CardHeader>
              <CardTitle>Conectar con QuickBooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-muted-foreground">
                Para ver el balance, primero debes conectar tu cuenta de QuickBooks.
              </p>
              <Button onClick={handleAuth} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar QuickBooks
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button onClick={fetchBalance} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Actualizar Balance
              </Button>
            </div>

            {balanceData && (
              <div className="grid gap-6">
                {/* Activos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceData.assets?.map((section: any, sectionIdx: number) => (
                      <div key={sectionIdx} className="mb-4">
                        {section.children && section.children.length > 0 ? (
                          <Collapsible defaultOpen={section.level <= 1}>
                            <CollapsibleTrigger asChild>
                              <div className={`flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded px-2 ${
                                section.type === 'Section' ? 'font-semibold text-lg' : ''
                              }`} style={{ paddingLeft: `${section.level * 20 + 8}px` }}>
                                <div className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4" />
                                  <span>{section.name}</span>
                                </div>
                                <span>{formatCurrency(section.value)}</span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {section.children.map((child: any, childIdx: number) => (
                                <div key={childIdx}>
                                  {child.children && child.children.length > 0 ? (
                                    <Collapsible defaultOpen={child.level <= 2}>
                                      <CollapsibleTrigger asChild>
                                        <div className={`flex items-center justify-between py-2 cursor-pointer hover:bg-accent rounded px-2 ${
                                          child.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                        }`} style={{ paddingLeft: `${child.level * 20 + 8}px` }}>
                                          <div className="flex items-center gap-2">
                                            <ChevronDown className="h-4 w-4" />
                                            <span>{child.name}</span>
                                          </div>
                                          <span>{formatCurrency(child.value)}</span>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        {child.children.map((subChild: any, subIdx: number) => (
                                          <div key={subIdx} className={`flex justify-between py-2 ${
                                            subChild.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                          }`} style={{ paddingLeft: `${subChild.level * 20 + 8}px` }}>
                                            <span>{subChild.name}</span>
                                            <span>{formatCurrency(subChild.value)}</span>
                                          </div>
                                        ))}
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ) : (
                                    <div className={`flex justify-between py-2 ${
                                      child.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                    }`} style={{ paddingLeft: `${child.level * 20 + 8}px` }}>
                                      <span>{child.name}</span>
                                      <span>{formatCurrency(child.value)}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <div className="flex justify-between py-2" style={{ paddingLeft: `${section.level * 20 + 8}px` }}>
                            <span>{section.name}</span>
                            <span>{formatCurrency(section.value)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between py-4 font-bold text-xl mt-4 border-t-4 border-primary">
                      <span>Total Activos</span>
                      <span className="text-primary">{formatCurrency(balanceData.totalAssets)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Pasivos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Pasivos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceData.liabilities?.map((section: any, sectionIdx: number) => (
                      <div key={sectionIdx} className="mb-4">
                        {section.children && section.children.length > 0 ? (
                          <Collapsible defaultOpen={section.level <= 1}>
                            <CollapsibleTrigger asChild>
                              <div className={`flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded px-2 ${
                                section.type === 'Section' ? 'font-semibold text-lg' : ''
                              }`} style={{ paddingLeft: `${section.level * 20 + 8}px` }}>
                                <div className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4" />
                                  <span>{section.name}</span>
                                </div>
                                <span>{formatCurrency(section.value)}</span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {section.children.map((child: any, childIdx: number) => (
                                <div key={childIdx}>
                                  {child.children && child.children.length > 0 ? (
                                    <Collapsible defaultOpen={child.level <= 2}>
                                      <CollapsibleTrigger asChild>
                                        <div className={`flex items-center justify-between py-2 cursor-pointer hover:bg-accent rounded px-2 ${
                                          child.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                        }`} style={{ paddingLeft: `${child.level * 20 + 8}px` }}>
                                          <div className="flex items-center gap-2">
                                            <ChevronDown className="h-4 w-4" />
                                            <span>{child.name}</span>
                                          </div>
                                          <span>{formatCurrency(child.value)}</span>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        {child.children.map((subChild: any, subIdx: number) => (
                                          <div key={subIdx} className={`flex justify-between py-2 ${
                                            subChild.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                          }`} style={{ paddingLeft: `${subChild.level * 20 + 8}px` }}>
                                            <span>{subChild.name}</span>
                                            <span>{formatCurrency(subChild.value)}</span>
                                          </div>
                                        ))}
                                      </CollapsibleContent>
                                    </Collapsible>
                                  ) : (
                                    <div className={`flex justify-between py-2 ${
                                      child.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                    }`} style={{ paddingLeft: `${child.level * 20 + 8}px` }}>
                                      <span>{child.name}</span>
                                      <span>{formatCurrency(child.value)}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <div className="flex justify-between py-2" style={{ paddingLeft: `${section.level * 20 + 8}px` }}>
                            <span>{section.name}</span>
                            <span>{formatCurrency(section.value)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between py-4 font-bold text-xl mt-4 border-t-4 border-primary">
                      <span>Total Pasivos</span>
                      <span className="text-primary">{formatCurrency(balanceData.totalLiabilities)}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Patrimonio */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Patrimonio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {balanceData.equity?.map((section: any, sectionIdx: number) => (
                      <div key={sectionIdx} className="mb-4">
                        {section.children && section.children.length > 0 ? (
                          <Collapsible defaultOpen={section.level <= 1}>
                            <CollapsibleTrigger asChild>
                              <div className={`flex items-center justify-between py-3 cursor-pointer hover:bg-accent rounded px-2 ${
                                section.type === 'Section' ? 'font-semibold text-lg' : ''
                              }`} style={{ paddingLeft: `${section.level * 20 + 8}px` }}>
                                <div className="flex items-center gap-2">
                                  <ChevronDown className="h-4 w-4" />
                                  <span>{section.name}</span>
                                </div>
                                <span>{formatCurrency(section.value)}</span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              {section.children.map((child: any, childIdx: number) => (
                                <div key={childIdx} className={`flex justify-between py-2 ${
                                  child.type === 'Summary' ? 'font-bold border-t-2 mt-2 pt-3' : ''
                                }`} style={{ paddingLeft: `${child.level * 20 + 8}px` }}>
                                  <span>{child.name}</span>
                                  <span>{formatCurrency(child.value)}</span>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        ) : (
                          <div className="flex justify-between py-2" style={{ paddingLeft: `${section.level * 20 + 8}px` }}>
                            <span>{section.name}</span>
                            <span>{formatCurrency(section.value)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    <div className="flex justify-between py-4 font-bold text-xl mt-4 border-t-4 border-primary">
                      <span>Total Patrimonio</span>
                      <span className="text-primary">{formatCurrency(balanceData.totalEquity)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const QuickBooksBalance = () => {
  return (
    <LanguageProvider>
      <QuickBooksBalanceContent />
    </LanguageProvider>
  );
};

export default QuickBooksBalance;
