import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown,
  Save,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface BudgetRow {
  id?: string;
  category: string;
  subcategory?: string;
  parent_category?: string;
  level: number;
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
  total: number;
  expanded?: boolean;
}

const Budget2026 = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetRow[]>([]);

  const texts = {
    es: {
      title: 'Presupuesto 2026',
      subtitle: 'Gestiona y edita el presupuesto anual',
      back: 'Volver',
      save: 'Guardar Cambios',
      exportExcel: 'Exportar a Excel',
      exportPDF: 'Exportar a PDF',
      loading: 'Cargando presupuesto...',
      saving: 'Guardando...',
      income: 'Ingresos',
      expenses: 'Egresos',
      total: 'Total',
      months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      savedSuccess: 'Presupuesto guardado exitosamente',
      loadError: 'Error al cargar presupuesto',
      saveError: 'Error al guardar presupuesto'
    },
    en: {
      title: 'Budget 2026',
      subtitle: 'Manage and edit annual budget',
      back: 'Back',
      save: 'Save Changes',
      exportExcel: 'Export to Excel',
      exportPDF: 'Export to PDF',
      loading: 'Loading budget...',
      saving: 'Saving...',
      income: 'Income',
      expenses: 'Expenses',
      total: 'Total',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      savedSuccess: 'Budget saved successfully',
      loadError: 'Error loading budget',
      saveError: 'Error saving budget'
    }
  };

  const t = texts[language];

  const getInitialBudgetData = (): BudgetRow[] => [
    // Income Section
    { category: t.income, level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Cuotas de Asociados', parent_category: t.income, level: 1, january: 70000, february: 15000, march: 30000, april: 30000, may: 20000, june: 10650, july: 15000, august: 5000, september: 5000, october: 5000, november: 5000, december: 40000, total: 250650 },
    { category: 'Membresías', parent_category: t.income, level: 1, january: 28800, february: 46650, march: 41400, april: 17000, may: 18430, june: 13350, july: 17250, august: 26875, september: 15900, october: 14200, november: 8000, december: 18230, total: 266085 },
    { category: 'Proyectos y membresías especiales', parent_category: t.income, level: 1, january: 0, february: 0, march: 0, april: 0, may: 25000, june: 0, july: 0, august: 0, september: 25000, october: 0, november: 0, december: 0, total: 50000 },
    
    // Expenses Section
    { category: t.expenses, level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    
    // Personnel
    { category: 'Personal', parent_category: t.expenses, level: 1, january: 21309.19, february: 21309.19, march: 21309.19, april: 21309.19, may: 21309.19, june: 21309.19, july: 21309.19, august: 21309.19, september: 21309.19, october: 21309.19, november: 21309.19, december: 21309.19, total: 255710.32, expanded: false },
    { category: 'Salarios', parent_category: 'Personal', level: 2, january: 15000, february: 15000, march: 15000, april: 15000, may: 15000, june: 15000, july: 15000, august: 15000, september: 15000, october: 15000, november: 15000, december: 15000, total: 180000 },
    { category: 'Aguinaldo 8.33%', parent_category: 'Personal', level: 2, january: 1250, february: 1250, march: 1250, april: 1250, may: 1250, june: 1250, july: 1250, august: 1250, september: 1250, october: 1250, november: 1250, december: 1250, total: 15000 },
    { category: 'CCSS 14.67% + 26.67%', parent_category: 'Personal', level: 2, january: 4000.5, february: 4000.5, march: 4000.5, april: 4000.5, may: 4000.5, june: 4000.5, july: 4000.5, august: 4000.5, september: 4000.5, october: 4000.5, november: 4000.5, december: 4000.5, total: 48006 },
    { category: 'Pólizas', parent_category: 'Personal', level: 2, january: 144, february: 144, march: 144, april: 144, may: 144, june: 144, july: 144, august: 144, september: 144, october: 144, november: 144, december: 144, total: 1728 },
    
    // Administrative Expenses
    { category: 'Gastos administrativos', parent_category: t.expenses, level: 1, january: 1207.75, february: 1207.75, march: 1207.75, april: 1207.75, may: 1207.75, june: 1207.75, july: 1207.75, august: 1207.75, september: 1207.75, october: 1207.75, november: 1207.75, december: 1207.75, total: 14493.02, expanded: false },
    { category: 'Compra Oficina + Arqueos', parent_category: 'Gastos administrativos', level: 2, january: 1000, february: 1000, march: 1000, april: 1000, may: 1000, june: 1000, july: 1000, august: 1000, september: 1000, october: 1000, november: 1000, december: 1000, total: 12000 },
    
    // Representation
    { category: 'Representación', parent_category: t.expenses, level: 1, january: 1450, february: 1650, march: 1450, april: 1050, may: 2650, june: 1450, july: 1650, august: 1050, september: 2550, october: 10550, november: 1050, december: 1050, total: 26400, expanded: false },
    
    // Communication
    { category: 'Comunicación y mercadeo', parent_category: t.expenses, level: 1, january: 100, february: 100, march: 100, april: 100, may: 1795, june: 100, july: 100, august: 100, september: 1795, october: 100, november: 1795, december: 100, total: 6285, expanded: false },
    
    // Events
    { category: 'Eventos', parent_category: t.expenses, level: 1, january: 0, february: 50, march: 0, april: 550, may: 0, june: 50, july: 0, august: 50, september: 0, october: 3000, november: 2050, december: 0, total: 8750, expanded: false },
    
    // Professional Services
    { category: 'Servicios Profesionales', parent_category: t.expenses, level: 1, january: 1552, february: 1552, march: 1552, april: 1552, may: 1552, june: 1552, july: 1552, august: 1552, september: 1552, october: 1552, november: 1552, december: 1552, total: 18624, expanded: false },
    { category: 'Legal', parent_category: 'Servicios Profesionales', level: 2, january: 500, february: 500, march: 500, april: 500, may: 500, june: 500, july: 500, august: 500, september: 500, october: 500, november: 500, december: 500, total: 6000 },
    { category: 'Contabilidad', parent_category: 'Servicios Profesionales', level: 2, january: 452, february: 452, march: 452, april: 452, may: 452, june: 452, july: 452, august: 452, september: 452, october: 452, november: 452, december: 452, total: 5424 },
    
    // Technology
    { category: 'Tecnología', parent_category: t.expenses, level: 1, january: 1070, february: 4570, march: 2070, april: 2070, may: 1070, june: 1120.85, july: 1070, august: 1070, september: 2070, october: 2034.86, november: 1070, december: 1070, total: 20416.71, expanded: false },
    { category: 'Hosting TI', parent_category: 'Tecnología', level: 2, january: 70, february: 70, march: 70, april: 70, may: 70, june: 70, july: 70, august: 70, september: 70, october: 70, november: 70, december: 70, total: 840 },
    { category: 'Soporte y desarrollos tecnológicos', parent_category: 'Tecnología', level: 2, january: 1000, february: 2000, march: 2000, april: 2000, may: 1000, june: 1000, july: 1000, august: 1000, september: 2000, october: 2000, november: 1000, december: 1000, total: 17000 },
    
    // Taxes
    { category: 'Impuestos', parent_category: t.expenses, level: 1, january: 500, february: 0, march: 0, april: 500, may: 0, june: 0, july: 500, august: 0, september: 0, october: 0, november: 500, december: 0, total: 2000, expanded: false },
    { category: 'Patente', parent_category: 'Impuestos', level: 2, january: 500, february: 0, march: 0, april: 500, may: 0, june: 0, july: 500, august: 0, september: 0, october: 0, november: 500, december: 0, total: 2000 }
  ];

  useEffect(() => {
    loadBudgetData();
  }, [selectedCompanyId]);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      if (!selectedCompanyId) {
        setBudgetData(getInitialBudgetData());
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('budget_2026')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('category', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedData = data.map(row => ({
          ...row,
          expanded: row.level === 0
        }));
        setBudgetData(recalculateTotals(formattedData));
      } else {
        setBudgetData(recalculateTotals(getInitialBudgetData()));
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error(t.loadError);
      setBudgetData(recalculateTotals(getInitialBudgetData()));
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetData = async () => {
    if (!selectedCompanyId) {
      toast.error(language === 'es' ? 'No hay empresa seleccionada' : 'No company selected');
      return;
    }
    
    try {
      setSaving(true);
      
      await supabase
        .from('budget_2026')
        .delete()
        .eq('company_id', selectedCompanyId);

      const dataToSave = budgetData.map(row => ({
        company_id: selectedCompanyId,
        category: row.category,
        subcategory: row.subcategory,
        parent_category: row.parent_category,
        level: row.level,
        january: row.january,
        february: row.february,
        march: row.march,
        april: row.april,
        may: row.may,
        june: row.june,
        july: row.july,
        august: row.august,
        september: row.september,
        october: row.october,
        november: row.november,
        december: row.december
      }));

      const { error } = await supabase
        .from('budget_2026')
        .insert(dataToSave);

      if (error) throw error;

      toast.success(t.savedSuccess);
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error(t.saveError);
    } finally {
      setSaving(false);
    }
  };

  const recalculateTotals = (data: BudgetRow[]) => {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                    'july', 'august', 'september', 'october', 'november', 'december'];
    
    const newData = [...data];
    
    // First, calculate totals for all individual rows
    newData.forEach((row, index) => {
      if (row.level > 0) {
        newData[index].total = months.reduce((sum, month) => 
          sum + (row[month as keyof BudgetRow] as number || 0), 0);
      }
    });
    
    // Then calculate totals for parent categories (level 0)
    newData.forEach((row, index) => {
      if (row.level === 0) {
        // Sum all direct children (level 1)
        const children = newData.filter(r => r.parent_category === row.category && r.level === 1);
        
        months.forEach(month => {
          const monthTotal = children.reduce((sum, child) => 
            sum + (child[month as keyof BudgetRow] as number || 0), 0);
          (newData[index] as any)[month] = monthTotal;
        });
        
        newData[index].total = months.reduce((sum, month) => 
          sum + (newData[index][month as keyof BudgetRow] as number || 0), 0);
      }
    });
    
    return newData;
  };

  const updateValue = (index: number, field: string, value: string) => {
    const newData = [...budgetData];
    const numValue = parseFloat(value) || 0;
    newData[index] = { ...newData[index], [field]: numValue };
    
    setBudgetData(recalculateTotals(newData));
  };

  const toggleExpand = (index: number) => {
    const newData = [...budgetData];
    newData[index].expanded = !newData[index].expanded;
    setBudgetData(newData);
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      budgetData.map(row => ({
        'Categoría': row.category,
        'Enero': row.january,
        'Febrero': row.february,
        'Marzo': row.march,
        'Abril': row.april,
        'Mayo': row.may,
        'Junio': row.june,
        'Julio': row.july,
        'Agosto': row.august,
        'Septiembre': row.september,
        'Octubre': row.october,
        'Noviembre': row.november,
        'Diciembre': row.december,
        'Total': row.total
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuesto 2026');
    XLSX.writeFile(workbook, 'presupuesto_2026.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text('Presupuesto 2026', 14, 20);
    
    const tableData = budgetData.map(row => [
      row.category,
      row.january.toLocaleString(),
      row.february.toLocaleString(),
      row.march.toLocaleString(),
      row.april.toLocaleString(),
      row.may.toLocaleString(),
      row.june.toLocaleString(),
      row.july.toLocaleString(),
      row.august.toLocaleString(),
      row.september.toLocaleString(),
      row.october.toLocaleString(),
      row.november.toLocaleString(),
      row.december.toLocaleString(),
      row.total.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Categoría', ...t.months, 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 7 }
    });

    doc.save('presupuesto_2026.pdf');
  };

  const shouldShowRow = (row: BudgetRow) => {
    if (row.level === 0) return true;
    if (row.level === 1) {
      const parentIndex = budgetData.findIndex(r => r.category === row.parent_category && r.level === 0);
      return parentIndex >= 0 && budgetData[parentIndex].expanded;
    }
    if (row.level === 2) {
      const directParentIndex = budgetData.findIndex(r => r.category === row.parent_category && r.level === 1);
      if (directParentIndex < 0 || !budgetData[directParentIndex].expanded) return false;
      
      const grandParentCategory = budgetData[directParentIndex].parent_category;
      const grandParentIndex = budgetData.findIndex(r => r.category === grandParentCategory && r.level === 0);
      return grandParentIndex >= 0 && budgetData[grandParentIndex].expanded;
    }
    return true;
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
                <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
                <p className="text-muted-foreground">{t.subtitle}</p>
              </div>
            </div>
            <LanguageToggle />
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button onClick={saveBudgetData} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? t.saving : t.save}
            </Button>
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

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="border p-2 text-left min-w-[250px]">Categoría</th>
                    {t.months.map(month => (
                      <th key={month} className="border p-2 text-right min-w-[100px]">{month}</th>
                    ))}
                    <th className="border p-2 text-right min-w-[120px] font-bold bg-primary/10">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {budgetData.map((row, index) => {
                    if (!shouldShowRow(row)) return null;
                    
                    const isMainCategory = row.level === 0;
                    const isSubcategory = row.level === 1;
                    const hasChildren = budgetData.some(r => r.parent_category === row.category && r.level === row.level + 1);
                    
                    return (
                      <tr 
                        key={index} 
                        className={`
                          ${isMainCategory ? 'bg-primary/5 font-bold' : ''}
                          ${isSubcategory ? 'bg-muted/30' : ''}
                          hover:bg-accent/50 transition-colors
                        `}
                      >
                        <td className="border p-2">
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 20}px` }}>
                            {hasChildren && (
                              <button
                                onClick={() => toggleExpand(index)}
                                className="hover:bg-accent rounded p-1"
                              >
                                {row.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            )}
                            <span className={isMainCategory ? 'font-bold text-base' : ''}>{row.category}</span>
                          </div>
                        </td>
                        {['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].map(month => (
                          <td key={month} className="border p-1">
                            {isMainCategory ? (
                              <div className="text-right font-bold p-1">
                                {row[month as keyof BudgetRow]?.toLocaleString() || '0'}
                              </div>
                            ) : (
                              <Input
                                type="number"
                                step="0.01"
                                value={row[month as keyof BudgetRow] as number || 0}
                                onChange={(e) => updateValue(index, month, e.target.value)}
                                className="text-right border-0 focus:ring-1 h-8"
                              />
                            )}
                          </td>
                        ))}
                        <td className="border p-2 text-right font-bold bg-primary/5">
                          {row.total.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Budget2026;