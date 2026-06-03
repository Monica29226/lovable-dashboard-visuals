import React from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { BudgetProvider, useBudget } from "@/contexts/BudgetContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft, 
  Save,
  FileSpreadsheet,
  FileText,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetSummary2026 from "@/components/BudgetSummary2026";
import AssociateFeeComposition from "@/components/AssociateFeeComposition";
// ComparativeBudget2025vs2026 removed from summary tab
import FinancialProjection2027 from "@/components/FinancialProjection2027";
import BalancePatrimonyTab from "@/components/BalancePatrimonyTab";
import BudgetDetailsReport from "@/components/BudgetDetailsReport";
import { BudgetAuditDialog } from "@/components/BudgetAuditDialog";
import { useCompany } from "@/contexts/CompanyContext";
import { isHorizonte } from "@/lib/company";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Budget2026Inner = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const {
    budgetData,
    loading,
    saving,
    saveBudget,
    exchangeRate,
    setExchangeRate,
  } = useBudget();



  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const texts = {
    es: {
      title: 'Presupuesto de Operación 2026',
      subtitle: 'Asociación Horizonte Positivo',
      exchangeRate: 'Tipo de Cambio (₡)',
      back: 'Volver',
      save: 'Guardar Cambios',
      exportExcel: 'Exportar a Excel',
      exportPDF: 'Exportar a PDF',
      loading: 'Cargando presupuesto...',
      saving: 'Guardando...',
      savedSuccess: 'Presupuesto guardado exitosamente',
      tabDetails: 'Detalles',
      tabSummary: 'Resumen'
    },
    en: {
      title: 'Operating Budget 2026',
      subtitle: 'Horizonte Positivo Association',
      exchangeRate: 'Exchange Rate (₡)',
      back: 'Back',
      save: 'Save Changes',
      exportExcel: 'Export to Excel',
      exportPDF: 'Export to PDF',
      loading: 'Loading budget...',
      saving: 'Saving...',
      savedSuccess: 'Budget saved successfully',
      tabDetails: 'Details',
      tabSummary: 'Summary'
    }
  };

  const t = texts[language];

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    const excelData: any[][] = [['Categoría', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Total']];
    budgetData.forEach(row => {
      let categoryName = row.category;
      if (row.level === 3) categoryName = '    - ' + categoryName;
      else if (row.level === 2) categoryName = '  - ' + categoryName;
      else if (row.level === 1) categoryName = ' ' + categoryName;
      excelData.push([categoryName, row.january, row.february, row.march, row.april, row.may, row.june, row.july, row.august, row.september, row.october, row.november, row.december, row.total]);
    });
    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    worksheet['!cols'] = [{ wch: 40 }, ...Array(13).fill({ wch: 14 })];
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuesto 2026');
    XLSX.writeFile(workbook, 'presupuesto_2026.xlsx');
    toast.success(language === 'es' ? 'Excel exportado exitosamente' : 'Excel exported successfully');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('Presupuesto de Operación 2026', 14, 15);
    doc.setFontSize(12);
    doc.text('Asociación Horizonte Positivo', 14, 22);
    const tableData = budgetData.map(row => {
      let categoryName = row.category;
      if (row.level === 3) categoryName = '    - ' + categoryName;
      else if (row.level === 2) categoryName = '  - ' + categoryName;
      else if (row.level === 1) categoryName = ' ' + categoryName;
      return [categoryName, formatNumber(row.january), formatNumber(row.february), formatNumber(row.march), formatNumber(row.april), formatNumber(row.may), formatNumber(row.june), formatNumber(row.july), formatNumber(row.august), formatNumber(row.september), formatNumber(row.october), formatNumber(row.november), formatNumber(row.december), formatNumber(row.total)];
    });
    autoTable(doc, {
      startY: 28,
      head: [['Categoría', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7, halign: 'right', cellPadding: 2 },
      headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { halign: 'left', cellWidth: 50 } },
      didParseCell: function(data) {
        if (data.section === 'body') {
          const row = budgetData[data.row.index];
          if (row?.level === 0) {
            const isIncome = row.category.includes('INGRESO');
            data.cell.styles.fillColor = isIncome ? [219, 234, 254] : [254, 243, 199];
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 8;
          } else if (row?.level === 1 || row?.level === 2) {
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
    doc.save('presupuesto_2026.pdf');
    toast.success(language === 'es' ? 'PDF exportado exitosamente' : 'PDF exported successfully');
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6 border">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/quickbooks-hub')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t.back}
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-primary">{t.title}</h1>
                <p className="text-lg text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <LanguageToggle />
          </div>
          
          <div className="mb-4 flex items-center gap-4">
            <label className="font-medium">{t.exchangeRate}:</label>
            <Input
              type="number"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
              className="w-32"
              step="0.01"
            />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveBudget} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? t.saving : t.save}
            </Button>
            <BudgetAuditDialog companyId={selectedCompanyId} />
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              {t.exportExcel}
            </Button>
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="h-4 w-4 mr-2" />
              {t.exportPDF}
            </Button>
          </div>
        </header>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-6">
            <TabsTrigger value="details">{t.tabDetails}</TabsTrigger>
            <TabsTrigger value="summary">{t.tabSummary}</TabsTrigger>
            <TabsTrigger value="projection">Proyección 2025–2028</TabsTrigger>
            <TabsTrigger value="balance">Balance y Patrimonio</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <BudgetDetailsReport budgetData={budgetData} language={language} />
          </TabsContent>

          <TabsContent value="summary">
            <AssociateFeeComposition />
            <BudgetSummary2026 budgetData={budgetData} />
          </TabsContent>

          <TabsContent value="projection">
            <FinancialProjection2027 budgetData={budgetData} />
          </TabsContent>

          <TabsContent value="balance">
            <BalancePatrimonyTab budgetData={budgetData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const Budget2026 = () => {
  const { selectedCompanyId, companies, isLoading } = useCompany();
  const { language } = useLanguage();
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Budget is only configured for Horizonte Positivo. Other companies must not
  // inherit Horizonte's budget data.
  if (selectedCompany && !isHorizonte(selectedCompany.company_name)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {language === "es" ? "Presupuesto no configurado" : "Budget not configured"}
          </h2>
          <p className="text-muted-foreground">
            {language === "es"
              ? `El módulo de presupuesto no está disponible para ${selectedCompany.company_name}.`
              : `The budget module is not available for ${selectedCompany.company_name}.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <BudgetProvider>
      <Budget2026Inner />
    </BudgetProvider>
  );
};

export default Budget2026;
