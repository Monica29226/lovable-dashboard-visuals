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
          <div className="grid grid-cols-1 gap-6">
            {projectData.projects.map((project: any, idx: number) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-xl">{project.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t.income}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(project.income || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.expenses}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {formatCurrency(project.expenses || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.netIncome}</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatCurrency(project.netIncome || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t.margin}</p>
                      <p className="text-2xl font-bold">
                        {project.margin ? `${project.margin.toFixed(1)}%` : '0%'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
