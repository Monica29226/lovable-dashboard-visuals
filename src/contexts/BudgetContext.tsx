import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCompany } from "@/contexts/CompanyContext";

// ─── Types ───────────────────────────────────────────────────────────
export interface BudgetRow {
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

export type DistributionMode = "auto" | "manual";

export interface BudgetDerived {
  totalIncome: number;
  totalExpenses: number;
  netResult: number;
  cuotasAsociados: number;
  membresias: number;
  membresiaResult: number;
  resultadoBrutoTotal: number;
  impuestoRenta: number;
  resultadoNeto: number;
}

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'] as const;

const TAX_RATE = 0.30;

// ─── Meta constants ──────────────────────────────────────────────────
export const BUDGET_META = {
  ccssRate: 0.2687,
  aguinaldoRate: 0.0833,
  taxRate: TAX_RATE,
};

// ─── Context Interface ───────────────────────────────────────────────
interface BudgetContextType {
  // Data
  budgetData: BudgetRow[];
  loading: boolean;
  saving: boolean;

  // CRUD
  updateCell: (rowIndex: number, month: string, value: number) => void;
  updateAnnual: (rowIndex: number, value: number) => void;
  updateCategoryName: (rowIndex: number, newName: string) => void;
  saveBudget: () => Promise<void>;
  reloadBudget: () => Promise<void>;

  // Expand/collapse
  toggleRowExpand: (rowIndex: number) => void;

  // Distribution mode per category
  distributionMode: Record<string, DistributionMode>;
  setDistributionMode: (category: string, mode: DistributionMode) => void;

  // Edit tracking
  editedCells: Set<string>;

  // Derived selectors (computed from current budgetData)
  derived: BudgetDerived;

  // Exchange rate
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

// ─── Recalculate totals (hierarchical) ───────────────────────────────
const recalculateTotals = (data: BudgetRow[]): BudgetRow[] => {
  const newData: BudgetRow[] = JSON.parse(JSON.stringify(data));

  // Step 1: level 3 totals
  newData.forEach((row, i) => {
    if (row.level === 3) {
      newData[i].total = MONTHS.reduce((sum, m) => sum + (Number((row as any)[m]) || 0), 0);
    }
  });

  // Step 2: level 2
  newData.forEach((row, i) => {
    if (row.level === 2) {
      const children = newData.filter(r => r.parent_category === row.category && r.level === 3);
      if (children.length > 0) {
        MONTHS.forEach(m => {
          (newData[i] as any)[m] = children.reduce((s, c) => s + (Number((c as any)[m]) || 0), 0);
        });
      }
      newData[i].total = MONTHS.reduce((s, m) => s + (Number((newData[i] as any)[m]) || 0), 0);
    }
  });

  // Step 3: level 1
  newData.forEach((row, i) => {
    if (row.level === 1) {
      const l2 = newData.filter(r => r.parent_category === row.category && r.level === 2);
      const l3 = newData.filter(r => r.parent_category === row.category && r.level === 3);
      if (l2.length > 0 || l3.length > 0) {
        MONTHS.forEach(m => {
          (newData[i] as any)[m] =
            l2.reduce((s, c) => s + (Number((c as any)[m]) || 0), 0) +
            l3.reduce((s, c) => s + (Number((c as any)[m]) || 0), 0);
        });
      }
      newData[i].total = MONTHS.reduce((s, m) => s + (Number((newData[i] as any)[m]) || 0), 0);
    }
  });

  // Step 4: level 0
  newData.forEach((row, i) => {
    if (row.level === 0) {
      const l1 = newData.filter(r => r.parent_category === row.category && r.level === 1);
      const l3 = newData.filter(r => r.parent_category === row.category && r.level === 3);
      MONTHS.forEach(m => {
        (newData[i] as any)[m] =
          l1.reduce((s, c) => s + (Number((c as any)[m]) || 0), 0) +
          l3.reduce((s, c) => s + (Number((c as any)[m]) || 0), 0);
      });
      newData[i].total = MONTHS.reduce((s, m) => s + (Number((newData[i] as any)[m]) || 0), 0);
    }
  });

  return sortHierarchically(newData);
};

// ─── Hierarchical sort ───────────────────────────────────────────────
const sortHierarchically = (data: BudgetRow[]): BudgetRow[] => {
  const result: BudgetRow[] = [];
  const originalIndexMap = new Map<string, number>();
  data.forEach((row, index) => {
    originalIndexMap.set(`${row.category}-${row.level}-${row.parent_category}`, index);
  });

  const expenseCategoryOrder = [
    'Personal', 'Gastos Administrativos', 'Gastos administrativos',
    'Viáticos y Giras', 'Viaticos y Giras',
    'Comunicación y Mercadeo',
    'Servicios Profesionales', 'Tecnología', 'Impuestos', 'Otros Gastos'
  ];

  const addChildren = (parentCategory: string, targetLevel: number) => {
    let matching = data.filter(r => r.level === targetLevel && r.parent_category === parentCategory);
    if (targetLevel === 1 && (parentCategory?.includes('EGRESO') || parentCategory === 'EXPENSES')) {
      matching.sort((a, b) => {
        const iA = expenseCategoryOrder.findIndex(c => a.category.includes(c) || c.includes(a.category));
        const iB = expenseCategoryOrder.findIndex(c => b.category.includes(c) || c.includes(b.category));
        if (iA !== -1 && iB !== -1) return iA - iB;
        if (iA !== -1) return -1;
        if (iB !== -1) return 1;
        return 0;
      });
    } else {
      matching.sort((a, b) => {
        const iA = originalIndexMap.get(`${a.category}-${a.level}-${a.parent_category}`) ?? 0;
        const iB = originalIndexMap.get(`${b.category}-${b.level}-${b.parent_category}`) ?? 0;
        return iA - iB;
      });
    }
    matching.forEach(row => {
      result.push(row);
      addChildren(row.category, targetLevel + 1);
    });
  };

  const l0 = data.filter(r => r.level === 0);
  l0.sort((a, b) => {
    if (a.category.includes('INGRESO') || a.category === 'INCOME') return -1;
    if (b.category.includes('INGRESO') || b.category === 'INCOME') return 1;
    return a.category.localeCompare(b.category);
  });
  l0.forEach(row => {
    result.push(row);
    addChildren(row.category, 1);
  });

  return result;
};

// ─── Initial fallback data ───────────────────────────────────────────
const getInitialBudgetData = (): BudgetRow[] => [
  { category: 'INGRESOS', level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Cuotas de Asociados', parent_category: 'INGRESOS', level: 1, january: 70000, february: 15000, march: 30000, april: 30000, may: 20000, june: 10650, july: 15000, august: 5000, september: 5000, october: 5000, november: 5000, december: 40000, total: 250650, expanded: true },
  { category: 'Membresías', parent_category: 'INGRESOS', level: 1, january: 15467, february: 5550, march: 30700, april: 30000, may: 16000, june: 17067.67, july: 13800, august: 19880, september: 10749.33, october: 20580.58, november: 20000, december: 23105.42, total: 222900, expanded: true },
  { category: 'Proyectos y membresías especiales', parent_category: 'INGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'EGRESOS', level: 0, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Personal', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Salarios', parent_category: 'Personal', level: 2, january: 13000, february: 13000, march: 13000, april: 13000, may: 13000, june: 13000, july: 13000, august: 13000, september: 13000, october: 13000, november: 13000, december: 13000, total: 156000 },
  { category: 'Aguinaldo 8.33%', parent_category: 'Personal', level: 2, january: 1083.33, february: 1083.33, march: 1083.33, april: 1083.33, may: 1083.33, june: 1083.33, july: 1083.33, august: 1083.33, september: 1083.33, october: 1083.33, november: 1083.33, december: 1083.33, total: 13000 },
  { category: 'CCSS + LPT + Otros 26.83%', parent_category: 'Personal', level: 2, january: 3487.90, february: 3487.90, march: 3487.90, april: 3487.90, may: 3487.90, june: 3487.90, july: 3487.90, august: 3487.90, september: 3487.90, october: 3487.90, november: 3487.90, december: 3487.90, total: 41854.80 },
  { category: 'Pólizas', parent_category: 'Personal', level: 2, january: 124.80, february: 124.80, march: 124.80, april: 124.80, may: 124.80, june: 124.80, july: 124.80, august: 124.80, september: 124.80, october: 124.80, november: 124.80, december: 124.80, total: 1497.60 },
  { category: 'Prestaciones Sociales', parent_category: 'Personal', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
  { category: 'Beneficios Salud', parent_category: 'Personal', level: 2, january: 81.36, february: 81.36, march: 81.36, april: 81.36, may: 81.36, june: 81.36, july: 81.36, august: 81.36, september: 81.36, october: 81.36, november: 81.36, december: 81.36, total: 976.32 },
  { category: 'Capacitación personal', parent_category: 'Personal', level: 2, january: 833.33, february: 833.33, march: 833.33, april: 833.33, may: 833.33, june: 833.33, july: 833.33, august: 833.33, september: 833.33, october: 833.33, november: 833.33, december: 833.33, total: 10000 },
  { category: 'Gastos administrativos', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Alquiler Oficinas y Parqueos', parent_category: 'Gastos administrativos', level: 2, january: 1500, february: 1500, march: 1500, april: 1500, may: 1500, june: 1500, july: 1500, august: 1500, september: 1500, october: 1500, november: 1500, december: 1500, total: 18000 },
  { category: 'Telefonía Celular', parent_category: 'Gastos administrativos', level: 2, january: 97.75, february: 97.75, march: 97.75, april: 97.75, may: 97.75, june: 97.75, july: 97.75, august: 97.75, september: 97.75, october: 97.75, november: 97.75, december: 97.75, total: 1173.02 },
  { category: 'Suministros de Oficina', parent_category: 'Gastos administrativos', level: 2, january: 100, february: 100, march: 100, april: 100, may: 100, june: 100, july: 100, august: 100, september: 100, october: 100, november: 100, december: 100, total: 1200 },
  { category: 'Comisiones Financieras', parent_category: 'Gastos administrativos', level: 2, january: 10, february: 10, march: 10, april: 10, may: 10, june: 10, july: 10, august: 10, september: 10, october: 10, november: 10, december: 10, total: 120 },
  { category: 'Compra de equipo', parent_category: 'Gastos administrativos', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
  { category: 'Viaticos y Giras', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Viáticos', parent_category: 'Viaticos y Giras', level: 2, january: 3000, february: 3000, march: 2400, april: 2000, may: 2000, june: 2000, july: 2000, august: 2000, september: 2000, october: 2000, november: 2000, december: 2000, total: 26400 },
  { category: 'Comunicación y Mercadeo', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Pauta Redes Digitales', parent_category: 'Comunicación y Mercadeo', level: 2, january: 150, february: 150, march: 150, april: 150, may: 150, june: 150, july: 150, august: 150, september: 150, october: 150, november: 150, december: 150, total: 1800 },
  { category: 'Pauta Medios de Comunicación', parent_category: 'Comunicación y Mercadeo', level: 2, january: 0, february: 0, march: 0, april: 0, may: 1695, june: 0, july: 0, august: 0, september: 1695, october: 0, november: 1695, december: 0, total: 5085 },
  { category: 'Eventos', parent_category: 'Comunicación y Mercadeo', level: 2, january: 0, february: 50, march: 0, april: 550, may: 3000, june: 50, july: 0, august: 50, september: 3000, october: 2050, november: 0, december: 0, total: 8750 },
  { category: 'Servicios Profesionales', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Legal', parent_category: 'Servicios Profesionales', level: 2, january: 500, february: 500, march: 500, april: 500, may: 500, june: 500, july: 500, august: 500, september: 500, october: 500, november: 500, december: 500, total: 6000 },
  { category: 'Contabilidad', parent_category: 'Servicios Profesionales', level: 2, january: 904, february: 904, march: 904, april: 904, may: 904, june: 904, july: 904, august: 904, september: 904, october: 904, november: 904, december: 904, total: 10848 },
  { category: 'Otros servicios profesionales', parent_category: 'Servicios Profesionales', level: 2, january: 600, february: 600, march: 600, april: 600, may: 600, june: 600, july: 600, august: 600, september: 600, october: 600, november: 600, december: 600, total: 7200 },
  { category: 'Tecnología', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Soporte TI', parent_category: 'Tecnología', level: 2, january: 70, february: 70, march: 70, april: 70, may: 70, june: 70, july: 70, august: 70, september: 70, october: 70, november: 70, december: 70, total: 840 },
  { category: 'Soporte y desarrollos tecnológicos', parent_category: 'Tecnología', level: 2, january: 1000, february: 2000, march: 2000, april: 2000, may: 1000, june: 1000, july: 1000, august: 1000, september: 2000, october: 2000, november: 1000, december: 1000, total: 17000 },
  { category: 'Seguridad de la información', parent_category: 'Tecnología', level: 2, january: 0, february: 2500, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 2500 },
  { category: 'Cuotas y Suscripciones', parent_category: 'Tecnología', level: 2, january: 125, february: 125, march: 125, april: 125, may: 125, june: 125, july: 125, august: 125, september: 125, october: 125, november: 125, december: 125, total: 1500 },
  { category: 'Otros Gastos', parent_category: 'EGRESOS', level: 1, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0, expanded: true },
  { category: 'Patente', parent_category: 'Otros Gastos', level: 2, january: 800, february: 0, march: 0, april: 800, may: 0, june: 0, july: 800, august: 0, september: 0, october: 800, november: 0, december: 0, total: 3200 },
  { category: 'IVA, no soportado', parent_category: 'Otros Gastos', level: 2, january: 400, february: 400, march: 400, april: 400, may: 400, june: 400, july: 400, august: 400, september: 400, october: 400, november: 400, december: 400, total: 4800 },
  { category: 'Impuesto de Renta, Estimado', parent_category: 'Otros Gastos', level: 2, january: 0, february: 0, march: 0, april: 0, may: 0, june: 0, july: 0, august: 0, september: 0, october: 0, november: 0, december: 0, total: 0 },
  { category: 'Otros Gastos', parent_category: 'Otros Gastos', level: 2, january: 100, february: 0, march: 0, april: 100, may: 0, june: 0, july: 0, august: 100, september: 0, october: 0, november: 0, december: 100, total: 400 },
  { category: 'Depreciación', parent_category: 'Otros Gastos', level: 2, january: 250, february: 250, march: 250, april: 250, may: 250, june: 250, july: 250, august: 250, september: 250, october: 250, november: 250, december: 250, total: 3000 },
];

// ─── Provider ────────────────────────────────────────────────────────
export const BudgetProvider = ({ children }: { children: ReactNode }) => {
  const { selectedCompanyId } = useCompany();
  const [budgetData, setBudgetData] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedCells, setEditedCells] = useState<Set<string>>(new Set());
  const [exchangeRate, setExchangeRate] = useState(505);
  const [distributionMode, setDistributionModeState] = useState<Record<string, DistributionMode>>({});

  const setDistributionMode = useCallback((category: string, mode: DistributionMode) => {
    setDistributionModeState(prev => ({ ...prev, [category]: mode }));
  }, []);

  // ── Load from Supabase ────────────────────────────────────────────
  const loadBudgetData = useCallback(async () => {
    try {
      setLoading(true);
      if (!selectedCompanyId) {
        setBudgetData(recalculateTotals(getInitialBudgetData()));
        return;
      }
      const { data, error } = await supabase
        .from('budget_2026')
        .select('*')
        .eq('company_id', selectedCompanyId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map(row => ({ ...row, expanded: true }));
        setBudgetData(recalculateTotals(formatted));
      } else {
        setBudgetData(recalculateTotals(getInitialBudgetData()));
      }
    } catch (error) {
      console.error('Error loading budget:', error);
      toast.error('Error al cargar presupuesto');
      setBudgetData(recalculateTotals(getInitialBudgetData()));
    } finally {
      setLoading(false);
    }
  }, [selectedCompanyId]);

  useEffect(() => { loadBudgetData(); }, [loadBudgetData]);

  // ── Save to Supabase ──────────────────────────────────────────────
  const saveBudget = useCallback(async () => {
    if (!selectedCompanyId) {
      toast.error('No hay empresa seleccionada');
      return;
    }
    try {
      setSaving(true);
      await supabase.from('budget_2026').delete().eq('company_id', selectedCompanyId);
      const dataToSave = budgetData.map((row, index) => ({
        company_id: selectedCompanyId,
        category: row.category,
        subcategory: row.subcategory,
        parent_category: row.parent_category,
        level: row.level,
        january: row.january, february: row.february, march: row.march,
        april: row.april, may: row.may, june: row.june,
        july: row.july, august: row.august, september: row.september,
        october: row.october, november: row.november, december: row.december,
        display_order: index,
      }));
      const { error } = await supabase.from('budget_2026').insert(dataToSave);
      if (error) throw error;
      toast.success('Presupuesto guardado exitosamente');
      setEditedCells(new Set());
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Error al guardar presupuesto');
    } finally {
      setSaving(false);
    }
  }, [selectedCompanyId, budgetData]);

  // ── Cell update (monthly) ─────────────────────────────────────────
  const updateCell = useCallback(async (rowIndex: number, month: string, value: number) => {
    setBudgetData(prev => {
      const newData = [...prev];
      const oldValue = (newData[rowIndex] as any)[month] as number;
      if (oldValue === value) return prev;
      newData[rowIndex] = { ...newData[rowIndex], [month]: value };
      setEditedCells(prev => new Set([...prev, `${rowIndex}-${month}`]));

      // Audit log
      if (selectedCompanyId && newData[rowIndex].id) {
        supabase.auth.getUser().then(({ data: userData }) => {
          if (userData.user) {
            supabase.from('budget_2026_audit').insert({
              budget_row_id: newData[rowIndex].id,
              company_id: selectedCompanyId,
              user_id: userData.user.id,
              category: newData[rowIndex].category,
              field_changed: month,
              old_value: oldValue,
              new_value: value,
            }).then(() => {});
          }
        });
      }

      return recalculateTotals(newData);
    });
  }, [selectedCompanyId]);

  // ── Annual update (auto-distributes to months) ────────────────────
  const updateAnnual = useCallback((rowIndex: number, value: number) => {
    setBudgetData(prev => {
      const newData = [...prev];
      const monthlyValue = Math.round((value / 12) * 100) / 100;
      const remainder = Math.round((value - monthlyValue * 12) * 100) / 100;
      MONTHS.forEach((m, i) => {
        (newData[rowIndex] as any)[m] = i === 0 ? monthlyValue + remainder : monthlyValue;
      });
      newData[rowIndex].total = value;
      setEditedCells(prev => new Set([...prev, `${rowIndex}-total`]));
      return recalculateTotals(newData);
    });
  }, []);

  // ── Category name update ──────────────────────────────────────────
  const updateCategoryName = useCallback((rowIndex: number, newName: string) => {
    setBudgetData(prev => {
      const newData = [...prev];
      const oldName = newData[rowIndex].category;
      newData[rowIndex] = { ...newData[rowIndex], category: newName };
      newData.forEach((row, idx) => {
        if (row.parent_category === oldName) {
          newData[idx] = { ...newData[idx], parent_category: newName };
        }
      });
      return newData;
    });
  }, []);

  // ── Toggle expand ─────────────────────────────────────────────────
  const toggleRowExpand = useCallback((rowIndex: number) => {
    setBudgetData(prev => {
      const newData = [...prev];
      newData[rowIndex] = { ...newData[rowIndex], expanded: !newData[rowIndex].expanded };
      return newData;
    });
  }, []);

  // ── Derived selectors ─────────────────────────────────────────────
  const derived = useMemo<BudgetDerived>(() => {
    const getCatTotal = (name: string) => {
      // Find the category and calculate its total
      const row = budgetData.find(r => r.category === name && (r.level === 1 || r.level === 0));
      if (!row) return 0;
      // For level 1 with children, the total is already aggregated by recalculateTotals
      return row.total || 0;
    };

    const incomeRow = budgetData.find(r => r.level === 0 && (r.category.includes('INGRESO') || r.category === 'INCOME'));
    const expenseRow = budgetData.find(r => r.level === 0 && (r.category.includes('EGRESO') || r.category === 'EXPENSES'));

    const totalIncome = incomeRow?.total || 0;
    const totalExpenses = expenseRow?.total || 0;
    const netResult = totalIncome - totalExpenses;

    const cuotasAsociados = getCatTotal('Cuotas de Asociados');
    const membresias = getCatTotal('Membresías');

    // Resultado de Membresía = Membresías - Egresos
    const membresiaResult = membresias - totalExpenses;
    // Resultado Bruto Total = Membresía result + Cuotas
    const resultadoBrutoTotal = membresiaResult + cuotasAsociados;
    // Impuesto de Renta 30% (solo si positivo)
    const impuestoRenta = resultadoBrutoTotal > 0 ? resultadoBrutoTotal * TAX_RATE : 0;
    // Resultado Neto = Bruto - Impuesto
    const resultadoNeto = resultadoBrutoTotal - impuestoRenta;

    return {
      totalIncome,
      totalExpenses,
      netResult,
      cuotasAsociados,
      membresias,
      membresiaResult,
      resultadoBrutoTotal,
      impuestoRenta,
      resultadoNeto,
    };
  }, [budgetData]);

  const value: BudgetContextType = {
    budgetData,
    loading,
    saving,
    updateCell,
    updateAnnual,
    updateCategoryName,
    saveBudget,
    reloadBudget: loadBudgetData,
    toggleRowExpand,
    distributionMode,
    setDistributionMode,
    editedCells,
    derived,
    exchangeRate,
    setExchangeRate,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error("useBudget must be used within BudgetProvider");
  return ctx;
};
