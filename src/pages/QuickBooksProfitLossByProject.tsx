import { useState, useEffect } from "react";
import { useLanguage, LanguageProvider } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ArrowLeft, FileText, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Función para formatear valores monetarios en Colones
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'CRC',
    minimumFractionDigits: 2
  }).format(value);
}

const QuickBooksProfitLossByProjectContent = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const texts = {
    es: {
      title: 'Estado de Resultados por Proyecto',
      loading: 'Cargando datos...',
      backToHub: 'Volver al Hub',
      project: 'Proyecto',
      income: 'Ingresos',
      expenses: 'Gastos',
      netIncome: 'Utilidad Neta',
      margin: 'Margen',
      noData: 'No hay datos disponibles'
    },
    en: {
      title: 'Profit & Loss by Project',
      loading: 'Loading data...',
      backToHub: 'Back to Hub',
      project: 'Project',
      income: 'Income',
      expenses: 'Expenses',
      netIncome: 'Net Income',
      margin: 'Margin',
      noData: 'No data available'
    }
  };

  const t = texts[language];

  const fetchProjectData = async () => {
    if (!selectedCompanyId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('quickbooks-profit-loss-by-project', {
        body: { companyId: selectedCompanyId }
      });
      
      if (error) throw error;
      setProjectData(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast.error(language === 'es' ? 'Error al cargar datos' : 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
    
    // Auto-actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchProjectData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [selectedCompanyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/quickbooks-hub')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary mb-2">{t.title}</h1>
                <p className="text-muted-foreground">
                  {lastUpdate && `Última actualización: ${lastUpdate.toLocaleTimeString('es-CR')}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={fetchProjectData}
                disabled={loading}
              >
                <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <LanguageToggle />
            </div>
          </div>
        </header>

        {projectData && projectData.projects && projectData.projects.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {projectData.projects.map((project: any, idx: number) => (
                <Card key={`summary-${idx}`} className="bg-gradient-to-br from-card to-accent/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.income}</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(project.income || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.expenses}</p>
                      <p className="text-xl font-bold text-red-600">
                        {formatCurrency(project.expenses || 0)}
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.netIncome}</p>
                      <p className={`text-2xl font-bold ${(project.netIncome || 0) >= 0 ? 'text-primary' : 'text-red-600'}`}>
                        {formatCurrency(project.netIncome || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">{t.margin}</p>
                      <p className={`text-lg font-bold ${(project.margin || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {project.margin ? `${project.margin.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 gap-6">
              {projectData.projects.map((project: any, idx: number) => (
                <Card key={`detail-${idx}`}>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center justify-between">
                      <span>{project.name} - Detalle</span>
                      <span className={`text-lg ${(project.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(project.netIncome || 0)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Income Details */}
                      {project.details?.incomeItems && project.details.incomeItems.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-green-600 mb-3 text-lg">{t.income}</h3>
                          <div className="space-y-2">
                            {project.details.incomeItems.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm">{item.name}</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(item.value)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center py-2 font-bold bg-accent/30 px-2 rounded">
                              <span>Total {t.income}</span>
                              <span className="text-green-600">{formatCurrency(project.income)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Expense Details */}
                      {project.details?.expenseItems && project.details.expenseItems.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-red-600 mb-3 text-lg">{t.expenses}</h3>
                          <div className="space-y-2">
                            {project.details.expenseItems.map((item: any, itemIdx: number) => (
                              <div key={itemIdx} className="flex justify-between items-center py-2 border-b">
                                <span className="text-sm">{item.name}</span>
                                <span className="font-semibold text-red-600">
                                  {formatCurrency(item.value)}
                                </span>
                              </div>
                            ))}
                            <div className="flex justify-between items-center py-2 font-bold bg-accent/30 px-2 rounded">
                              <span>Total {t.expenses}</span>
                              <span className="text-red-600">{formatCurrency(project.expenses)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t.noData}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

const QuickBooksProfitLossByProject = () => (
  <LanguageProvider>
    <QuickBooksProfitLossByProjectContent />
  </LanguageProvider>
);

export default QuickBooksProfitLossByProject;
