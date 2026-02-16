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
import ComparativeBudget2025vs2026 from "@/components/ComparativeBudget2025vs2026";
import FinancialProjection2027 from "@/components/FinancialProjection2027";
import { BudgetCellInput } from "@/components/BudgetCellInput";
import { BudgetAuditDialog } from "@/components/BudgetAuditDialog";
import { BudgetFillHandle } from "@/components/BudgetFillHandle";
import { BudgetFilters, BudgetFilterState } from "@/components/BudgetFilters";
import { cn } from "@/lib/utils";
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

interface CellEdit {
  rowIndex: number;
  month: string;
}

const Budget2026 = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { selectedCompanyId } = useCompany();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetRow[]>([]);
  const [filteredBudgetData, setFilteredBudgetData] = useState<BudgetRow[]>([]);
  const [originalBudgetData, setOriginalBudgetData] = useState<BudgetRow[]>([]);
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());
  const [exchangeRate, setExchangeRate] = useState<number>(505);
  const [allExpanded, setAllExpanded] = useState(false);
  const [filters, setFilters] = useState<BudgetFilterState>({
    category: null,
    period: 'all',
    type: 'all'
  });

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
    // ============ INGRESOS ============
    { category: t.income, level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    
    { category: 'Cuotas de Asociados', parent_category: t.income, level: 1, january: 70000.00, february: 15000.00, march: 30000.00, april: 30000.00, may: 20000.00, june: 10650.00, july: 15000.00, august: 5000.00, september: 5000.00, october: 5000.00, november: 5000.00, december: 40000.00, total: 250650.00, expanded: false },
    
    { category: 'Membresías', parent_category: t.income, level: 1, january: 15467.00, february: 5550.00, march: 30700.00, april: 30000.00, may: 16000.00, june: 17067.67, july: 13800.00, august: 19880.00, september: 10749.33, october: 20580.58, november: 20000.00, december: 23105.42, total: 222900.00, expanded: false },
    
    { category: 'Proyectos y membresías especiales', parent_category: t.income, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    
    // ============ EGRESOS ============
    { category: t.expenses, level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    
    // ========== 1. PERSONAL ==========
    { category: 'Personal', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Salarios', parent_category: 'Personal', level: 2, january: 13000.00, february: 13000.00, march: 13000.00, april: 13000.00, may: 13000.00, june: 13000.00, july: 13000.00, august: 13000.00, september: 13000.00, october: 13000.00, november: 13000.00, december: 13000.00, total: 156000.00 },
    { category: 'Aguinaldo 8.33%', parent_category: 'Personal', level: 2, january: 1083.33, february: 1083.33, march: 1083.33, april: 1083.33, may: 1083.33, june: 1083.33, july: 1083.33, august: 1083.33, september: 1083.33, october: 1083.33, november: 1083.33, december: 1083.33, total: 13000.00 },
    { category: 'CCSS + LPT + Otros 26.83%', parent_category: 'Personal', level: 2, january: 3487.90, february: 3487.90, march: 3487.90, april: 3487.90, may: 3487.90, june: 3487.90, july: 3487.90, august: 3487.90, september: 3487.90, october: 3487.90, november: 3487.90, december: 3487.90, total: 41854.80 },
    { category: 'Pólizas', parent_category: 'Personal', level: 2, january: 124.80, february: 124.80, march: 124.80, april: 124.80, may: 124.80, june: 124.80, july: 124.80, august: 124.80, september: 124.80, october: 124.80, november: 124.80, december: 124.80, total: 1497.60 },
    { category: 'Prestaciones Sociales', parent_category: 'Personal', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
    { category: 'Beneficios Salud', parent_category: 'Personal', level: 2, january: 81.36, february: 81.36, march: 81.36, april: 81.36, may: 81.36, june: 81.36, july: 81.36, august: 81.36, september: 81.36, october: 81.36, november: 81.36, december: 81.36, total: 976.32 },
    { category: 'Capacitación personal', parent_category: 'Personal', level: 2, january: 833.33, february: 833.33, march: 833.33, april: 833.33, may: 833.33, june: 833.33, july: 833.33, august: 833.33, september: 833.33, october: 833.33, november: 833.33, december: 833.33, total: 10000.00 },
    
    // ========== 2. GASTOS ADMINISTRATIVOS ==========
    { category: 'Gastos administrativos', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Alquiler Oficinas y Parqueos', parent_category: 'Gastos administrativos', level: 2, january: 1500.00, february: 1500.00, march: 1500.00, april: 1500.00, may: 1500.00, june: 1500.00, july: 1500.00, august: 1500.00, september: 1500.00, october: 1500.00, november: 1500.00, december: 1500.00, total: 18000.00 },
    { category: 'Telefonía Celular', parent_category: 'Gastos administrativos', level: 2, january: 97.75, february: 97.75, march: 97.75, april: 97.75, may: 97.75, june: 97.75, july: 97.75, august: 97.75, september: 97.75, october: 97.75, november: 97.75, december: 97.75, total: 1173.02 },
    { category: 'Suministros de Oficina', parent_category: 'Gastos administrativos', level: 2, january: 100.00, february: 100.00, march: 100.00, april: 100.00, may: 100.00, june: 100.00, july: 100.00, august: 100.00, september: 100.00, october: 100.00, november: 100.00, december: 100.00, total: 1200.00 },
    { category: 'Comisiones Financieras', parent_category: 'Gastos administrativos', level: 2, january: 10.00, february: 10.00, march: 10.00, april: 10.00, may: 10.00, june: 10.00, july: 10.00, august: 10.00, september: 10.00, october: 10.00, november: 10.00, december: 10.00, total: 120.00 },
    { category: 'Compra de equipo', parent_category: 'Gastos administrativos', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
    
    // ========== 3. VIÁTICOS Y GIRAS ==========
    { category: 'Viaticos y Giras', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Viáticos', parent_category: 'Viaticos y Giras', level: 2, january: 3000.00, february: 3000.00, march: 2400.00, april: 2000.00, may: 2000.00, june: 2000.00, july: 2000.00, august: 2000.00, september: 2000.00, october: 2000.00, november: 2000.00, december: 2000.00, total: 26400.00 },
    
    // ========== 4. COMUNICACIÓN Y MERCADEO ==========
    { category: 'Comunicación y Mercadeo', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Pauta Redes Digitales', parent_category: 'Comunicación y Mercadeo', level: 2, january: 150.00, february: 150.00, march: 150.00, april: 150.00, may: 150.00, june: 150.00, july: 150.00, august: 150.00, september: 150.00, october: 150.00, november: 150.00, december: 150.00, total: 1800.00 },
    { category: 'Pauta Medios de Comunicación', parent_category: 'Comunicación y Mercadeo', level: 2, january: 0, february: 0, march: 0, april: 0, may: 1695.00, june: 0, july: 0, august: 0, september: 1695.00, october: 0, november: 1695.00, december: 0, total: 5085.00 },
    { category: 'Eventos', parent_category: 'Comunicación y Mercadeo', level: 2, january: 0, february: 50.00, march: 0, april: 550.00, may: 3000.00, june: 50.00, july: 0, august: 50.00, september: 3000.00, october: 2050.00, november: 0, december: 0, total: 8750.00 },
    
    // ========== 6. SERVICIOS PROFESIONALES ==========
    { category: 'Servicios Profesionales', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Legal', parent_category: 'Servicios Profesionales', level: 2, january: 500.00, february: 500.00, march: 500.00, april: 500.00, may: 500.00, june: 500.00, july: 500.00, august: 500.00, september: 500.00, october: 500.00, november: 500.00, december: 500.00, total: 6000.00 },
    { category: 'Contabilidad', parent_category: 'Servicios Profesionales', level: 2, january: 904.00, february: 904.00, march: 904.00, april: 904.00, may: 904.00, june: 904.00, july: 904.00, august: 904.00, september: 904.00, october: 904.00, november: 904.00, december: 904.00, total: 10848.00 },
    { category: 'Otros servicios profesionales', parent_category: 'Servicios Profesionales', level: 2, january: 600.00, february: 600.00, march: 600.00, april: 600.00, may: 600.00, june: 600.00, july: 600.00, august: 600.00, september: 600.00, october: 600.00, november: 600.00, december: 600.00, total: 7200.00 },
    
    // ========== 7. TECNOLOGÍA ==========
    { category: 'Tecnología', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Soporte TI', parent_category: 'Tecnología', level: 2, january: 70.00, february: 70.00, march: 70.00, april: 70.00, may: 70.00, june: 70.00, july: 70.00, august: 70.00, september: 70.00, october: 70.00, november: 70.00, december: 70.00, total: 840.00 },
    { category: 'Soporte y desarrollos tecnológicos', parent_category: 'Tecnología', level: 2, january: 1000.00, february: 2000.00, march: 2000.00, april: 2000.00, may: 1000.00, june: 1000.00, july: 1000.00, august: 1000.00, september: 2000.00, october: 2000.00, november: 1000.00, december: 1000.00, total: 17000.00 },
    { category: 'Seguridad de la información', parent_category: 'Tecnología', level: 2, january: 0, february: 2500.00, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 2500.00 },
    { category: 'Cuotas y Suscripciones', parent_category: 'Tecnología', level: 2, january: 125.00, february: 125.00, march: 125.00, april: 125.00, may: 125.00, june: 125.00, july: 125.00, august: 125.00, september: 125.00, october: 125.00, november: 125.00, december: 125.00, total: 1500.00 },
    
    // ========== 8. OTROS GASTOS ==========
    { category: 'Otros Gastos', parent_category: t.expenses, level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: false },
    { category: 'Patente', parent_category: 'Otros Gastos', level: 2, january: 800.00, february: 0, march: 0, april: 800.00, may: 0, june: 0, july: 800.00, august: 0, september: 0, october: 800.00, november: 0, december: 0, total: 3200.00 },
    { category: 'IVA, no soportado', parent_category: 'Otros Gastos', level: 2, january: 400.00, february: 400.00, march: 400.00, april: 400.00, may: 400.00, june: 400.00, july: 400.00, august: 400.00, september: 400.00, october: 400.00, november: 400.00, december: 400.00, total: 4800.00 },
    { category: 'Impuesto de Renta, Estimado', parent_category: 'Otros Gastos', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
    { category: 'Otros Gastos', parent_category: 'Otros Gastos', level: 2, january: 100.00, february: 0, march: 0, april: 100.00, may: 0, june: 0, july: 0, august: 100.00, september: 0, october: 0, november: 0, december: 100.00, total: 400.00 },
    { category: 'Depreciación', parent_category: 'Otros Gastos', level: 2, january: 250.00, february: 250.00, march: 250.00, april: 250.00, may: 250.00, june: 250.00, july: 250.00, august: 250.00, september: 250.00, october: 250.00, november: 250.00, december: 250.00, total: 3000.00 }
  ];

  useEffect(() => {
    loadBudgetData();
  }, [selectedCompanyId]);

  // Force fresh reload on mount to clear any cache
  useEffect(() => {
    const reloadTimer = setTimeout(() => {
      if (selectedCompanyId) {
        console.log('Reloading budget data to get fresh updates...');
        loadBudgetData();
      }
    }, 500);
    return () => clearTimeout(reloadTimer);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [budgetData, filters]);

  const applyFilters = () => {
    let filtered = [...budgetData];

    // Filtro por tipo
    if (filters.type !== 'all') {
      const typeKeyword = filters.type === 'income' ? 
        (language === 'es' ? 'INGRESO' : 'INCOME') : 
        (language === 'es' ? 'EGRESO' : 'EXPENSES');
      
      filtered = filtered.filter(row => {
        if (row.level === 0) {
          return row.category.includes(typeKeyword);
        }
        return row.parent_category?.includes(typeKeyword) || 
               budgetData.find(r => r.category === row.parent_category)?.parent_category?.includes(typeKeyword);
      });
    }

    // Filtro por categoría
    if (filters.category) {
      filtered = filtered.filter(row => 
        row.category === filters.category || 
        row.parent_category === filters.category ||
        budgetData.find(r => r.category === row.parent_category)?.parent_category === filters.category
      );
    }

    setFilteredBudgetData(filtered);
  };

  const getMonthsForPeriod = (period: string): string[] => {
    const allMonths = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    
    switch (period) {
      case 'q1': return ['january', 'february', 'march'];
      case 'q2': return ['april', 'may', 'june'];
      case 'q3': return ['july', 'august', 'september'];
      case 'q4': return ['october', 'november', 'december'];
      case 'semester1': return ['january', 'february', 'march', 'april', 'may', 'june'];
      case 'semester2': return ['july', 'august', 'september', 'october', 'november', 'december'];
      default: return allMonths;
    }
  };

  const getVisibleMonths = () => {
    return getMonthsForPeriod(filters.period);
  };

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      
      if (!selectedCompanyId) {
        setBudgetData(getInitialBudgetData().map(row => ({
          ...row,
          expanded: true
        })));
        setLoading(false);
        return;
      }
      
      // Ordenar por display_order para mantener el orden del Excel
      const { data, error } = await supabase
        .from('budget_2026')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedData = data.map(row => ({
          ...row,
          expanded: true  // Inicializar todas las filas como expandidas
        }));
        const recalculatedData = recalculateTotals(formattedData);
        setBudgetData(recalculatedData);
        setOriginalBudgetData(JSON.parse(JSON.stringify(recalculatedData))); // Deep copy para comparación
      } else {
        const initialData = recalculateTotals(getInitialBudgetData().map(row => ({
          ...row,
          expanded: true
        })));
        setBudgetData(initialData);
        setOriginalBudgetData(JSON.parse(JSON.stringify(initialData)));
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error(t.loadError);
      setBudgetData(recalculateTotals(getInitialBudgetData().map(row => ({
        ...row,
        expanded: true
      }))));
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

      const dataToSave = budgetData.map((row, index) => ({
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
        december: row.december,
        display_order: index  // Preservar el orden actual
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
    
    // Step 3: Calculate totals for level 1 categories (sum level 2 AND level 3 children)
    newData.forEach((row: BudgetRow, index: number) => {
      if (row.level === 1) {
        const level2Children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 2
        );
        const level3Children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 3
        );
        
        if (level2Children.length > 0 || level3Children.length > 0) {
          // Has children - sum their monthly values
          months.forEach(month => {
            const level2Total = level2Children.reduce((sum: number, child: BudgetRow) => 
              sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
            const level3Total = level3Children.reduce((sum: number, child: BudgetRow) => 
              sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
            newData[index][month] = level2Total + level3Total;
          });
        }
        
        // Calculate annual total from monthly values
        newData[index].total = months.reduce((sum, month) => 
          sum + (Number(newData[index][month as keyof BudgetRow]) || 0), 0);
      }
    });
    
    // Step 4: Calculate totals for level 0 (main categories) by summing level 1 AND level 3 children
    newData.forEach((row: BudgetRow, index: number) => {
      if (row.level === 0) {
        const level1Children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 1
        );
        const level3Children = newData.filter((r: BudgetRow) => 
          r.parent_category === row.category && r.level === 3
        );
        
        // Sum monthly values from all level 1 and level 3 children
        months.forEach(month => {
          const level1Total = level1Children.reduce((sum: number, child: BudgetRow) => 
            sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
          const level3Total = level3Children.reduce((sum: number, child: BudgetRow) => 
            sum + (Number(child[month as keyof BudgetRow]) || 0), 0);
          newData[index][month] = level1Total + level3Total;
        });
        
        // Calculate annual total from monthly values
        newData[index].total = months.reduce((sum, month) => 
          sum + (Number(newData[index][month as keyof BudgetRow]) || 0), 0);
      }
    });
    
    // Step 5: Sort hierarchically so children appear immediately after their parents
    return sortHierarchically(newData);
  };

  const sortHierarchically = (data: BudgetRow[]): BudgetRow[] => {
    const result: BudgetRow[] = [];
    
    // Crear un índice de posición original para mantener el orden
    const originalIndexMap = new Map<string, number>();
    data.forEach((row, index) => {
      originalIndexMap.set(`${row.category}-${row.level}-${row.parent_category}`, index);
    });
    
    // Helper function to add a row's children recursively
    const addChildren = (parentCategory: string, targetLevel: number) => {
      // Find all rows that are children of the parent
      let matchingRows = data.filter(r => 
        r.level === targetLevel && 
        r.parent_category === parentCategory
      );
      
      // Sort level 1 expense categories using the custom order
      if (targetLevel === 1 && parentCategory?.includes('EGRESO')) {
        const expenseCategoryOrder = [
          'Personal',
          'Gastos Administrativos',
          'Viáticos y Giras',
          'Comunicación y Mercadeo',
          'Servicios Profesionales',
          'Tecnología',
          'Impuestos',
          'Otros Gastos'
        ];
        
        matchingRows.sort((a, b) => {
          const indexA = expenseCategoryOrder.indexOf(a.category);
          const indexB = expenseCategoryOrder.indexOf(b.category);
          
          if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
          }
          if (indexA !== -1) return -1;
          if (indexB !== -1) return 1;
          return 0; // Mantener orden original si no están en la lista
        });
      } else {
        // Para todos los demás niveles (0, 2, 3), mantener orden original de inserción
        matchingRows.sort((a, b) => {
          const indexA = originalIndexMap.get(`${a.category}-${a.level}-${a.parent_category}`) ?? 0;
          const indexB = originalIndexMap.get(`${b.category}-${b.level}-${b.parent_category}`) ?? 0;
          return indexA - indexB;
        });
      }
      
      // Add each matching row and then recursively add its children
      matchingRows.forEach(matchingRow => {
        result.push(matchingRow);
        // Recursively add children of this row
        addChildren(matchingRow.category, targetLevel + 1);
      });
    };
    
    // Start with level 0 (INGRESOS and EGRESOS)
    const level0Rows = data.filter(r => r.level === 0);
    level0Rows.sort((a, b) => {
      // INGRESOS first, then EGRESOS
      if (a.category.includes('INGRESO')) return -1;
      if (b.category.includes('INGRESO')) return 1;
      return a.category.localeCompare(b.category);
    });
    
    level0Rows.forEach(level0Row => {
      result.push(level0Row);
      // Add all descendants of this level 0 row
      addChildren(level0Row.category, 1);
    });
    
    return result;
  };

  const toggleRowExpand = (index: number) => {
    const newData = [...budgetData];
    newData[index] = { ...newData[index], expanded: !newData[index].expanded };
    setBudgetData(newData);
  };

  const updateValue = async (index: number, field: string, value: number) => {
    const newData = [...budgetData];
    const oldValue = newData[index][field as keyof BudgetRow] as number;
    
    // Solo registrar si el valor realmente cambió
    if (oldValue === value) return;
    
    newData[index] = { ...newData[index], [field]: value };
    
    // Marcar celda como editada
    const cellKey = `${index}-${field}`;
    setEditedCells(prev => new Set([...prev, cellKey]));
    
    // Registrar en auditoría
    if (selectedCompanyId && newData[index].id) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          await supabase.from('budget_2026_audit').insert({
            budget_row_id: newData[index].id,
            company_id: selectedCompanyId,
            user_id: userData.user.id,
            category: newData[index].category,
            field_changed: field,
            old_value: oldValue,
            new_value: value
          });
        }
      } catch (error) {
        console.error('Error logging audit:', error);
      }
    }
    
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

  const toggleAllExpand = () => {
    // Esta función ya no es necesaria
  };

  const handleFillCells = (startRow: number, startMonth: string, endRow: number, endMonth: string) => {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                    'july', 'august', 'september', 'october', 'november', 'december'];
    
    const startMonthIndex = months.indexOf(startMonth);
    const endMonthIndex = months.indexOf(endMonth);
    
    if (startMonthIndex === -1 || endMonthIndex === -1) return;
    
    const newData = [...budgetData];
    const sourceValue = newData[startRow][startMonth as keyof BudgetRow] as number;
    
    // Detectar patrón: buscar si hay dos valores consecutivos para determinar incremento
    let pattern: 'copy' | 'series' = 'copy';
    let increment = 0;
    
    if (startMonthIndex > 0) {
      const prevValue = newData[startRow][months[startMonthIndex - 1] as keyof BudgetRow] as number;
      if (prevValue !== undefined && !isNaN(prevValue)) {
        increment = sourceValue - prevValue;
        if (increment !== 0) {
          pattern = 'series';
        }
      }
    }
    
    // Aplicar llenado
    if (startRow === endRow) {
      // Llenado horizontal (mismo row, diferentes meses)
      const minMonth = Math.min(startMonthIndex, endMonthIndex);
      const maxMonth = Math.max(startMonthIndex, endMonthIndex);
      
      for (let i = minMonth; i <= maxMonth; i++) {
        if (i !== startMonthIndex) {
          const month = months[i];
          const cellKey = `${startRow}-${month}`;
          
          if (pattern === 'series') {
            const steps = i - startMonthIndex;
            newData[startRow] = { 
              ...newData[startRow], 
              [month]: sourceValue + (increment * steps)
            };
          } else {
            newData[startRow] = { 
              ...newData[startRow], 
              [month]: sourceValue 
            };
          }
          
          setEditedCells(prev => new Set([...prev, cellKey]));
        }
      }
    } else {
      // Llenado vertical (misma columna, diferentes rows)
      const minRow = Math.min(startRow, endRow);
      const maxRow = Math.max(startRow, endRow);
      
      for (let i = minRow; i <= maxRow; i++) {
        if (i !== startRow && newData[i].level === 3) { // Solo llenar celdas editables (level 3)
          const cellKey = `${i}-${startMonth}`;
          
          if (pattern === 'series') {
            const steps = i - startRow;
            newData[i] = { 
              ...newData[i], 
              [startMonth]: sourceValue + (increment * steps)
            };
          } else {
            newData[i] = { 
              ...newData[i], 
              [startMonth]: sourceValue 
            };
          }
          
          setEditedCells(prev => new Set([...prev, cellKey]));
        }
      }
    }
    
    setBudgetData(recalculateTotals(newData));
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
    // Mostrar siempre todas las filas
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

        <BudgetFilters
          onFilterChange={setFilters}
          categories={budgetData
            .filter(row => row.level === 1)
            .map(row => row.category)
          }
        />

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="details">{t.tabDetails}</TabsTrigger>
            <TabsTrigger value="summary">{t.tabSummary}</TabsTrigger>
            <TabsTrigger value="projection">Proyección 2027–2029</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                <thead className="bg-muted sticky top-0 z-10">
                  <tr>
                    <th className="border p-2 text-left min-w-[250px]">Categoría</th>
                    {getVisibleMonths().map((month, idx) => (
                      <th key={month} className="border p-2 text-right min-w-[100px]">{t.months[['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(month)]}</th>
                    ))}
                    <th className="border p-2 text-right min-w-[120px] font-bold bg-primary/10">{t.total}</th>
                  </tr>
                </thead>
                <tbody>
                  {(filteredBudgetData.length > 0 ? filteredBudgetData : budgetData).map((row, index) => {
                    if (!shouldShowRow(row)) return null;
                    
                    // Verificar si esta fila debe mostrarse basado en el estado expandido del padre
                    if (row.level >= 2) {
                      const parentRow = budgetData.find(r => r.category === row.parent_category && r.level === row.level - 1);
                      if (parentRow && !parentRow.expanded) {
                        return null; // Ocultar si el padre está colapsado
                      }
                    }
                    
                    const isMainCategory = row.level === 0;
                    const isLevel1 = row.level === 1;
                    const isLevel2 = row.level === 2;
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
                            {isLevel1 && hasChildren && (
                              <button
                                onClick={() => toggleRowExpand(index)}
                                className="hover:bg-muted rounded p-1 transition-colors flex-shrink-0"
                              >
                                {row.expanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                            {isLevel1 && !hasChildren && <div className="w-6" />}
                            {isMainCategory ? (
                              <span className="font-bold text-base">{row.category}</span>
                            ) : (
                              <Input
                                type="text"
                                value={row.category}
                                onChange={(e) => updateCategoryName(index, e.target.value)}
                                className={`border-0 focus:ring-2 focus:ring-primary h-8 ${
                                  isMainCategory || isLevel1 ? 'font-bold' : ''
                                } ${isMainCategory ? 'text-base' : ''} flex-1`}
                                disabled={isMainCategory}
                              />
                            )}
                          </div>
                        </td>
                        {getVisibleMonths().map(month => {
                          const cellKey = `${index}-${month}`;
                          const isEdited = editedCells.has(cellKey);
                          // Solo deshabilitar categorías principales y categorías nivel 1 con hijos
                          const isDisabled = isMainCategory || (isLevel1 && hasChildren);
                          
                          return (
                            <td 
                              key={month} 
                              className="border p-1 relative budget-cell"
                              data-row={index}
                              data-month={month}
                            >
                              <BudgetCellInput
                                value={row[month as keyof BudgetRow] as number}
                                onChange={(value) => {
                                  if (!isDisabled) {
                                    updateValue(index, month, value);
                                  }
                                }}
                                isEdited={isEdited}
                                disabled={isDisabled}
                                className={cn(
                                  "h-8",
                                  isMainCategory && "font-bold text-primary cursor-default bg-primary/5",
                                  isLevel1 && "font-bold bg-muted/30 cursor-default",
                                  isLevel2 && "font-medium bg-muted/20 cursor-default"
                                )}
                              />
                              {!isDisabled && (
                                <BudgetFillHandle
                                  rowIndex={index}
                                  month={month}
                                  onFill={handleFillCells}
                                  disabled={isDisabled}
                                />
                              )}
                            </td>
                          );
                        })}
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
            <div className="mb-6">
              <ComparativeBudget2025vs2026 />
            </div>
            <BudgetSummary2026 budgetData={budgetData} />
          </TabsContent>

          <TabsContent value="projection">
            <FinancialProjection2027 budgetData={budgetData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Budget2026;