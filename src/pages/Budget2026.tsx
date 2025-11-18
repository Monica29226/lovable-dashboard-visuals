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
  FileText,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BudgetSummary2026 from "@/components/BudgetSummary2026";
import AssociateFeeComposition from "@/components/AssociateFeeComposition";
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
  const [exchangeRate, setExchangeRate] = useState<number>(540);
  const [allExpanded, setAllExpanded] = useState(true);

  const texts = {
    es: {
      title: 'Presupuesto de Operación 2026',
      subtitle: 'Asociación Horizonte Positivo',
      exchangeRate: 'Tipo de Cambio (₡)',
      back: 'Volver',
      save: 'Guardar Cambios',
      exportExcel: 'Exportar a Excel',
      exportPDF: 'Exportar a PDF',
      expandAll: 'Expandir Todo',
      collapseAll: 'Colapsar Todo',
      loading: 'Cargando presupuesto...',
      saving: 'Guardando...',
      income: 'INGRESOS',
      expenses: 'EGRESOS',
      netResult: 'Ingresos menos Egresos',
      total: 'Total',
      category: 'Categoría',
      months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      savedSuccess: 'Presupuesto guardado exitosamente',
      loadError: 'Error al cargar presupuesto',
      saveError: 'Error al guardar presupuesto',
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
      expandAll: 'Expand All',
      collapseAll: 'Collapse All',
      loading: 'Loading budget...',
      saving: 'Saving...',
      income: 'INCOME',
      expenses: 'EXPENSES',
      netResult: 'Income minus Expenses',
      total: 'Total',
      category: 'Category',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      savedSuccess: 'Budget saved successfully',
      loadError: 'Error loading budget',
      saveError: 'Error saving budget',
      tabDetails: 'Details',
      tabSummary: 'Summary'
    }
  };

  const t = texts[language];

  // Función para formatear números en formato contable
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
  };

  const getInitialBudgetData = (): BudgetRow[] => [
    // INGRESOS
    { category: t.income, level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Cuotas de Asociados', parent_category: t.income, level: 1, january: 70000, february: 15000, march: 30000, april: 30000, may: 20000, june: 10650, july: 15000, august: 5000, september: 5000, october: 5000, november: 5000, december: 40000, total: 250650, expanded: true },
    { category: 'Membresías de Empresas', parent_category: t.income, level: 1, january: 15467, february: 5550, march: 30700, april: 30000, may: 16000, june: 17067.67, july: 13800, august: 19880, september: 10749.33, october: 56313.09, november: 20000, december: 23105.42, total: 258632.51, expanded: true },
    
    // EGRESOS
    { category: t.expenses, level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    
    // 1. Personal
    { category: 'Personal', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Salarios', parent_category: 'Personal', level: 2, january: 13000, february: 13000, march: 13000, april: 13000, may: 13000, june: 13000, july: 13000, august: 13000, september: 13000, october: 13000, november: 13000, december: 13000, total: 156000 },
    { category: 'Aguinaldo 8.33%', parent_category: 'Personal', level: 2, january: 1083.33, february: 1083.33, march: 1083.33, april: 1083.33, may: 1083.33, june: 1083.33, july: 1083.33, august: 1083.33, september: 1083.33, october: 1083.33, november: 1083.33, december: 1083.33, total: 13000 },
    { category: 'CCSS + LPT + Otros 26.67%', parent_category: 'Personal', level: 2, january: 3467.10, february: 3467.10, march: 3467.10, april: 3467.10, may: 3467.10, june: 3467.10, july: 3467.10, august: 3467.10, september: 3467.10, october: 3467.10, november: 3467.10, december: 3467.10, total: 41605.20 },
    { category: 'Pólizas', parent_category: 'Personal', level: 2, january: 124.80, february: 124.80, march: 124.80, april: 124.80, may: 124.80, june: 124.80, july: 124.80, august: 124.80, september: 124.80, october: 124.80, november: 124.80, december: 124.80, total: 1497.60 },
    { category: 'Prestaciones Sociales', parent_category: 'Personal', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
    { category: 'Beneficios Salud', parent_category: 'Personal', level: 2, january: 81.36, february: 81.36, march: 81.36, april: 81.36, may: 81.36, june: 81.36, july: 81.36, august: 81.36, september: 81.36, october: 81.36, november: 81.36, december: 81.36, total: 976.32 },
    { category: 'Capacitación personal', parent_category: 'Personal', level: 2, january: 833.33, february: 833.33, march: 833.33, april: 833.33, may: 833.33, june: 833.33, july: 833.33, august: 833.33, september: 833.33, october: 833.33, november: 833.33, december: 833.33, total: 10000 },
    
    // 2. Gastos Administrativos
    { category: 'Gastos Administrativos', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Alquiler Oficinas y Parqueos', parent_category: 'Gastos Administrativos', level: 2, january: 1500, february: 1500, march: 1500, april: 1500, may: 1500, june: 1500, july: 1500, august: 1500, september: 1500, october: 1500, november: 1500, december: 1500, total: 18000 },
    { category: 'Telefonía Celular', parent_category: 'Gastos Administrativos', level: 2, january: 97.75, february: 97.75, march: 97.75, april: 97.75, may: 97.75, june: 97.75, july: 97.75, august: 97.75, september: 97.75, october: 97.75, november: 97.75, december: 97.75, total: 1173.02 },
    { category: 'Suministros de Oficina', parent_category: 'Gastos Administrativos', level: 2, january: 100, february: 100, march: 100, april: 100, may: 100, june: 100, july: 100, august: 100, september: 100, october: 100, november: 100, december: 100, total: 1200 },
    { category: 'Comisiones Financieras', parent_category: 'Gastos Administrativos', level: 2, january: 10, february: 10, march: 10, april: 10, may: 10, june: 10, july: 10, august: 10, september: 10, october: 10, november: 10, december: 10, total: 120 },
    { category: 'Compra de equipo', parent_category: 'Gastos Administrativos', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
    
    // 3. Viáticos y Giras
    { category: 'Viáticos y Giras', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Viáticos', parent_category: 'Viáticos y Giras', level: 2, january: 2000, february: 2000, march: 2000, april: 2000, may: 2000, june: 2000, july: 2000, august: 2000, september: 2000, october: 2000, november: 2000, december: 2000, total: 24000 },
    
    // 4. Comunicación y Mercadeo
    { category: 'Comunicación y Mercadeo', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Pauta Redes Digitales', parent_category: 'Comunicación y Mercadeo', level: 2, january: 150, february: 150, march: 150, april: 150, may: 150, june: 150, july: 150, august: 150, september: 150, october: 150, november: 150, december: 150, total: 1800 },
    { category: 'Pauta Medios de Comunicación', parent_category: 'Comunicación y Mercadeo', level: 2, january: 0, february: 0, march: 0, april: 0, may: 1695, june: 0, july: 0, august: 0, september: 1695, october: 0, november: 1695, december: 0, total: 5085 },
    
    // 5. Eventos
    { category: 'Eventos', parent_category: t.expenses, level: 1, january: 0, february: 50, march: 0, april: 550, may: 3000, june: 50, july: 0, august: 50, september: 3000, october: 2050, november: 0, december: 0, total: 8750, expanded: true },
    
    // 6. Servicios Profesionales
    { category: 'Servicios Profesionales', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Legal', parent_category: 'Servicios Profesionales', level: 2, january: 500, february: 500, march: 500, april: 500, may: 500, june: 500, july: 500, august: 500, september: 500, october: 500, november: 500, december: 500, total: 6000 },
    { category: 'Contabilidad', parent_category: 'Servicios Profesionales', level: 2, january: 904, february: 904, march: 904, april: 904, may: 904, june: 904, july: 904, august: 904, september: 904, october: 904, november: 904, december: 904, total: 5424 },
    { category: 'Otros servicios profesionales', parent_category: 'Servicios Profesionales', level: 2, january: 600, february: 600, march: 600, april: 600, may: 600, june: 600, july: 600, august: 600, september: 600, october: 600, november: 600, december: 600, total: 8700 },
    
    // 7. Tecnología
    { category: 'Tecnología', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Soporte TI', parent_category: 'Tecnología', level: 2, january: 70, february: 70, march: 70, april: 70, may: 70, june: 70, july: 70, august: 70, september: 70, october: 70, november: 70, december: 70, total: 840 },
    { category: 'Soporte y desarrollos tecnológicos', parent_category: 'Tecnología', level: 2, january: 1000, february: 2000, march: 2000, april: 2000, may: 1000, june: 1000, july: 1000, august: 1000, september: 2000, october: 2000, november: 1000, december: 1000, total: 17000 },
    { category: 'Seguridad de la información', parent_category: 'Tecnología', level: 2, january: 0, february: 2500, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 2500 },
    { category: 'Cuotas y Suscripciones', parent_category: 'Tecnología', level: 2, january: 125, february: 125, march: 125, april: 125, may: 125, june: 125, july: 125, august: 125, september: 125, october: 125, november: 125, december: 125, total: 1500 },
    
    // 8. Otros Gastos (nueva categoría principal)
    { category: 'Otros Gastos', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    
    // 8.1 Impuestos (ahora subcategoría de Otros Gastos)
    { category: 'Impuestos', parent_category: 'Otros Gastos', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
    { category: 'Patente', parent_category: 'Impuestos', level: 3, january: 800, february: 0, march: 0, april: 800, may: 0, june: 0, july: 800, august: 0, september: 0, october: 800, november: 0, december: 0, total: 3200 },
    { category: 'IVA, no soportado', parent_category: 'Impuestos', level: 3, january: 400, february: 400, march: 400, april: 400, may: 400, june: 400, july: 400, august: 400, september: 400, october: 400, november: 400, december: 400, total: 4800 },
    { category: 'Impuesto de Renta, Estimado', parent_category: 'Impuestos', level: 3, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
    
    // 8.2 Depreciación (ahora subcategoría de Otros Gastos)
    { category: 'Depreciación', parent_category: 'Otros Gastos', level: 2, january: 250, february: 250, march: 250, april: 250, may: 250, june: 250, july: 250, august: 250, september: 250, october: 250, november: 250, december: 250, total: 3000, expanded: true }
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
        .eq('company_id', selectedCompanyId);

      if (error) throw error;

      if (data && data.length > 0) {
        // Ordenar datos manualmente: INGRESOS primero, luego EGRESOS
        const sortedData = [...data].sort((a, b) => {
          // Primero ordenar por tipo (INGRESOS vs EGRESOS)
          const isAIncome = a.category.includes('INGRESO') || a.category === 'INCOME' || 
                           a.parent_category?.includes('INGRESO') || a.parent_category === 'INCOME';
          const isBIncome = b.category.includes('INGRESO') || b.category === 'INCOME' || 
                           b.parent_category?.includes('INGRESO') || b.parent_category === 'INCOME';
          
          if (isAIncome && !isBIncome) return -1;
          if (!isAIncome && isBIncome) return 1;
          
          // Luego ordenar por level
          if (a.level !== b.level) return a.level - b.level;
          
          // Finalmente por categoría
          return a.category.localeCompare(b.category);
        });
        
        const formattedData = sortedData.map(row => ({
          ...row,
          expanded: row.level === 0 || row.level === 1 // Expandir level 0 y level 1 por defecto
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
    
    const newData = JSON.parse(JSON.stringify(data)); // Deep clone to avoid mutations
    
    // Step 1: Calculate totals for level 3 (deepest leaf nodes)
    newData.forEach((row: BudgetRow, index: number) => {
      if (row.level === 3) {
        newData[index].total = months.reduce((sum, month) => 
          sum + (Number(row[month as keyof BudgetRow]) || 0), 0);
      }
    });
    
    // Step 2: Calculate totals for level 2 categories (sum level 3 children, or own values if no children)
    newData.forEach((row: BudgetRow, index: number) => {
      if (row.level === 2) {
        const children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 3
        );
        
        if (children.length > 0) {
          // Has children - sum their monthly values
          months.forEach(month => {
            const monthTotal = children.reduce((sum: number, child: BudgetRow) => 
              sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
            newData[index][month] = monthTotal;
          });
        }
        
        // Calculate annual total from monthly values
        newData[index].total = months.reduce((sum, month) => 
          sum + (Number(newData[index][month as keyof BudgetRow]) || 0), 0);
      }
    });
    
    // Step 3: Calculate totals for level 1 categories (sum level 2 children)
    newData.forEach((row: BudgetRow, index: number) => {
      if (row.level === 1) {
        const children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 2
        );
        
        if (children.length > 0) {
          // Has children - sum their monthly values
          months.forEach(month => {
            const monthTotal = children.reduce((sum: number, child: BudgetRow) => 
              sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
            newData[index][month] = monthTotal;
          });
        }
        
        // Calculate annual total from monthly values
        newData[index].total = months.reduce((sum, month) => 
          sum + (Number(newData[index][month as keyof BudgetRow]) || 0), 0);
      }
    });
    
    // Step 4: Calculate totals for level 0 (main categories) by summing level 1 children
    newData.forEach((row: BudgetRow, index: number) => {
      if (row.level === 0) {
        const children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 1
        );
        
        // Sum monthly values from all level 1 children
        months.forEach(month => {
          const monthTotal = children.reduce((sum: number, child: BudgetRow) => 
            sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
          newData[index][month] = monthTotal;
        });
        
        // Calculate annual total from monthly values
        newData[index].total = months.reduce((sum, month) => 
          sum + (Number(newData[index][month as keyof BudgetRow]) || 0), 0);
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

  const updateCategoryName = (index: number, newName: string) => {
    const newData = [...budgetData];
    const oldName = newData[index].category;
    newData[index] = { ...newData[index], category: newName };
    
    // Actualizar parent_category de los hijos
    newData.forEach((row, idx) => {
      if (row.parent_category === oldName) {
        newData[idx] = { ...newData[idx], parent_category: newName };
      }
    });
    
    setBudgetData(newData);
  };

  const toggleExpand = (index: number) => {
    const newData = [...budgetData];
    newData[index].expanded = !newData[index].expanded;
    setBudgetData(newData);
  };

  const toggleAllExpanded = () => {
    const newData = budgetData.map(row => {
      // Cambiar estado de todas las categorías que tienen hijos (cualquier nivel)
      const hasChildren = budgetData.some(r => r.parent_category === row.category && r.level === row.level + 1);
      if (hasChildren) {
        return { ...row, expanded: !allExpanded };
      }
      return row;
    });
    setBudgetData(newData);
    setAllExpanded(!allExpanded);
  };

  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Crear encabezados con nombres de meses en español
    const excelData: any[][] = [['Categoría', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Total']];
    
    // Agregar datos con indentación visual
    budgetData.forEach(row => {
      let categoryName = row.category;
      
      // Agregar indentación visual basada en el nivel
      if (row.level === 3) {
        categoryName = '    - ' + categoryName;
      } else if (row.level === 2) {
        categoryName = '  - ' + categoryName;
      } else if (row.level === 1) {
        categoryName = ' ' + categoryName;
      }
      
      excelData.push([
        categoryName, 
        row.january, 
        row.february, 
        row.march, 
        row.april, 
        row.may, 
        row.june, 
        row.july, 
        row.august, 
        row.september, 
        row.october, 
        row.november, 
        row.december, 
        row.total
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    
    // Configurar anchos de columna
    worksheet['!cols'] = [{ wch: 40 }, ...Array(13).fill({ wch: 14 })];
    
    // Aplicar formato numérico con separador de miles y 2 decimales
    budgetData.forEach((row, index) => {
      const rowNum = index + 2;
      
      // Formato numérico para todas las celdas de meses y total
      for (let col = 1; col <= 13; col++) {
        const cell = XLSX.utils.encode_cell({ r: rowNum - 1, c: col });
        if (worksheet[cell]) {
          worksheet[cell].z = '#,##0.00';
          worksheet[cell].t = 'n';
        }
      }
    });

    // Formato para encabezado (azul oscuro con texto blanco)
    for (let col = 0; col <= 13; col++) {
      const cell = XLSX.utils.encode_cell({ r: 0, c: col });
      if (worksheet[cell]) {
        worksheet[cell].s = {
          font: { bold: true, color: { rgb: "FFFFFF" } },
          fill: { fgColor: { rgb: "1E3A8A" } },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
    }

    // Aplicar formato según nivel de categoría
    budgetData.forEach((row, index) => {
      const rowNum = index + 2;
      
      // Formato para categorías principales (INGRESOS, EGRESOS)
      if (row.level === 0) {
        const isIncome = row.category.includes('INGRESO');
        const bgColor = isIncome ? "DBEAFE" : "FEF3C7"; // Azul claro para ingresos, amarillo para egresos
        
        for (let col = 0; col <= 13; col++) {
          const cell = XLSX.utils.encode_cell({ r: rowNum - 1, c: col });
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: true, size: 11 },
              fill: { fgColor: { rgb: bgColor } },
              alignment: { 
                horizontal: col === 0 ? "left" : "right", 
                vertical: "center" 
              },
              numFmt: col > 0 ? "#,##0.00" : undefined
            };
          }
        }
      }
      // Formato para subcategorías de nivel 1 (cuentas madre - negrita)
      else if (row.level === 1) {
        for (let col = 0; col <= 13; col++) {
          const cell = XLSX.utils.encode_cell({ r: rowNum - 1, c: col });
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: true },
              alignment: { 
                horizontal: col === 0 ? "left" : "right", 
                vertical: "center" 
              },
              numFmt: col > 0 ? "#,##0.00" : undefined
            };
          }
        }
      }
      // Formato para subcategorías de nivel 2 (Impuestos, Depreciación - negrita)
      else if (row.level === 2) {
        for (let col = 0; col <= 13; col++) {
          const cell = XLSX.utils.encode_cell({ r: rowNum - 1, c: col });
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: true },
              alignment: { 
                horizontal: col === 0 ? "left" : "right", 
                vertical: "center" 
              },
              numFmt: col > 0 ? "#,##0.00" : undefined
            };
          }
        }
      }
      // Formato para subcategorías de nivel 3 (cuentas hija - sin negrita)
      else {
        for (let col = 0; col <= 13; col++) {
          const cell = XLSX.utils.encode_cell({ r: rowNum - 1, c: col });
          if (worksheet[cell]) {
            worksheet[cell].s = {
              font: { bold: false },
              alignment: { 
                horizontal: col === 0 ? "left" : "right", 
                vertical: "center" 
              },
              numFmt: col > 0 ? "#,##0.00" : undefined
            };
          }
        }
      }
    });
    
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
    
    // Preparar datos con indentación visual
    const tableData = budgetData.map(row => {
      let categoryName = row.category;
      
      // Agregar indentación visual
      if (row.level === 3) {
        categoryName = '    - ' + categoryName;
      } else if (row.level === 2) {
        categoryName = '  - ' + categoryName;
      } else if (row.level === 1) {
        categoryName = ' ' + categoryName;
      }
      
      return [
        categoryName,
        formatNumber(row.january),
        formatNumber(row.february),
        formatNumber(row.march),
        formatNumber(row.april),
        formatNumber(row.may),
        formatNumber(row.june),
        formatNumber(row.july),
        formatNumber(row.august),
        formatNumber(row.september),
        formatNumber(row.october),
        formatNumber(row.november),
        formatNumber(row.december),
        formatNumber(row.total)
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [['Categoría', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Total']],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 7,
        halign: 'right',
        cellPadding: 2
      },
      headStyles: {
        fillColor: [30, 58, 138], // Azul oscuro
        textColor: [255, 255, 255],
        fontSize: 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 50 } // Categoría alineada a la izquierda
      },
      didParseCell: function(data) {
        // Aplicar colores según el nivel de la categoría
        if (data.section === 'body') {
          const row = budgetData[data.row.index];
          
          if (row.level === 0) {
            // INGRESOS o EGRESOS
            const isIncome = row.category.includes('INGRESO');
            data.cell.styles.fillColor = isIncome ? [219, 234, 254] : [254, 243, 199]; // Azul claro o amarillo
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize = 8;
          } else if (row.level === 1) {
            // Categorías principales (cuentas madre)
            data.cell.styles.fontStyle = 'bold';
          } else if (row.level === 2) {
            // Subcategorías colapsables (Impuestos, Depreciación)
            data.cell.styles.fontStyle = 'bold';
          }
          // Nivel 3 mantiene estilo normal (sin negrita)
        }
      }
    });

    doc.save('presupuesto_2026.pdf');
    toast.success(language === 'es' ? 'PDF exportado exitosamente' : 'PDF exported successfully');
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
    
    if (row.level === 3) {
      // Check if level 2 parent is expanded
      const level2ParentIndex = budgetData.findIndex(r => r.category === row.parent_category && r.level === 2);
      if (level2ParentIndex < 0 || !budgetData[level2ParentIndex].expanded) return false;
      
      // Check if level 1 grandparent is expanded
      const level1ParentCategory = budgetData[level2ParentIndex].parent_category;
      const level1ParentIndex = budgetData.findIndex(r => r.category === level1ParentCategory && r.level === 1);
      if (level1ParentIndex < 0 || !budgetData[level1ParentIndex].expanded) return false;
      
      // Check if level 0 great-grandparent is expanded
      const level0ParentCategory = budgetData[level1ParentIndex].parent_category;
      const level0ParentIndex = budgetData.findIndex(r => r.category === level0ParentCategory && r.level === 0);
      return level0ParentIndex >= 0 && budgetData[level0ParentIndex].expanded;
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
            <Button onClick={saveBudgetData} disabled={saving} className="bg-primary hover:bg-primary/90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              {saving ? t.saving : t.save}
            </Button>
            <Button variant="outline" onClick={toggleAllExpanded}>
              {allExpanded ? <Minimize2 className="h-4 w-4 mr-2" /> : <Maximize2 className="h-4 w-4 mr-2" />}
              {allExpanded ? t.collapseAll : t.expandAll}
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

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="details">{t.tabDetails}</TabsTrigger>
            <TabsTrigger value="summary">{t.tabSummary}</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
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
                    const isLevel1 = row.level === 1;
                    const isLevel2 = row.level === 2;
                    const isLevel3 = row.level === 3;
                    const hasChildren = budgetData.some(r => r.parent_category === row.category && r.level === row.level + 1);
                    
                    return (
                      <tr 
                        key={index} 
                        className={`
                          ${isMainCategory ? 'bg-primary/10' : ''}
                          ${isLevel1 ? 'bg-muted/20' : ''}
                          hover:bg-primary/5 transition-colors
                        `}
                      >
                        <td className="border p-2">
                          <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 20}px` }}>
                            {hasChildren && (
                              <button
                                onClick={() => toggleExpand(index)}
                                className="hover:bg-accent rounded p-1 flex-shrink-0"
                              >
                                {row.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            )}
                            <Input
                              type="text"
                              value={row.category}
                              onChange={(e) => updateCategoryName(index, e.target.value)}
                              className={`border-0 focus:ring-2 focus:ring-primary h-8 ${
                                isMainCategory || isLevel1 ? 'font-bold' : ''
                              } ${isMainCategory ? 'text-base' : ''} flex-1`}
                            />
                          </div>
                        </td>
                        {['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].map(month => (
                          <td key={month} className="border p-1">
                            <Input
                              type="text"
                              value={formatNumber(row[month as keyof BudgetRow] as number)}
                              onChange={(e) => {
                                if (!isMainCategory && !isLevel1 && !isLevel2) {
                                  updateValue(index, month, e.target.value);
                                }
                              }}
                              onFocus={(e) => {
                                if (!isMainCategory && !isLevel1 && !isLevel2) {
                                  // Mostrar valor sin formato cuando se enfoca
                                  e.target.value = (row[month as keyof BudgetRow] as number || 0).toString();
                                  e.target.select();
                                }
                              }}
                              onBlur={(e) => {
                                if (!isMainCategory && !isLevel1 && !isLevel2) {
                                  // Formatear valor en formato contable cuando pierde el foco
                                  const numValue = parseFloat(e.target.value) || 0;
                                  e.target.value = formatNumber(numValue);
                                }
                              }}
                              readOnly={isMainCategory || isLevel1 || isLevel2}
                              className={`text-right border-0 focus:ring-2 focus:ring-primary h-8 ${
                                isMainCategory ? 'font-bold text-primary cursor-default' : 
                                isLevel1 ? 'font-bold text-primary cursor-default' : 
                                isLevel2 ? 'font-bold text-primary cursor-default' : 
                                ''
                              }`}
                            />
                          </td>
                        ))}
                        <td className={`border p-2 text-right bg-primary/10 ${isMainCategory || isLevel1 || isLevel2 ? 'font-bold text-primary' : 'text-primary'}`}>
                          {formatNumber(row.total)}
                        </td>
                      </tr>
                    );
                  })}
                  
                  {/* Net Result Row: Income minus Expenses */}
                  {(() => {
                    const incomeRow = budgetData.find(row => row.category === t.income);
                    const expensesRow = budgetData.find(row => row.category === t.expenses);
                    
                    if (!incomeRow || !expensesRow) return null;
                    
                    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
                    
                    return (
                      <tr className="bg-primary/10 border-t-2 border-primary">
                        <td className="border p-2">
                          <div className="flex items-center gap-2 font-bold text-base text-primary">
                            {t.netResult}
                          </div>
                        </td>
                        {months.map(month => {
                          const income = (incomeRow[month as keyof BudgetRow] as number) || 0;
                          const expenses = (expensesRow[month as keyof BudgetRow] as number) || 0;
                          const netResult = income - expenses;
                          
                          return (
                            <td key={month} className={`border p-2 text-right font-bold ${netResult < 0 ? 'text-destructive' : 'text-green-600'}`}>
                              {formatNumber(netResult)}
                            </td>
                          );
                        })}
                        <td className={`border p-2 text-right font-bold text-base ${(incomeRow.total - expensesRow.total) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatNumber(incomeRow.total - expensesRow.total)}
                        </td>
                      </tr>
                    );
                  })()}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          </TabsContent>

          <TabsContent value="summary">
            <AssociateFeeComposition />
            <BudgetSummary2026 budgetData={budgetData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Budget2026;