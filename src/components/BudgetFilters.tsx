import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface BudgetFiltersProps {
  onFilterChange: (filters: BudgetFilterState) => void;
  categories: string[];
}

export interface BudgetFilterState {
  category: string | null;
  period: 'all' | 'q1' | 'q2' | 'q3' | 'q4' | 'semester1' | 'semester2';
  type: 'all' | 'income' | 'expenses';
}

export const BudgetFilters = ({ onFilterChange, categories }: BudgetFiltersProps) => {
  const { language } = useLanguage();
  const [filters, setFilters] = useState<BudgetFilterState>({
    category: null,
    period: 'all',
    type: 'all'
  });
  const [isExpanded, setIsExpanded] = useState(false);

  const texts = {
    es: {
      filters: 'Filtros',
      category: 'Categoría',
      period: 'Periodo',
      type: 'Tipo',
      all: 'Todos',
      income: 'Ingresos',
      expenses: 'Egresos',
      q1: 'Q1 (Ene-Mar)',
      q2: 'Q2 (Abr-Jun)',
      q3: 'Q3 (Jul-Sep)',
      q4: 'Q4 (Oct-Dic)',
      semester1: 'Semestre 1',
      semester2: 'Semestre 2',
      clear: 'Limpiar Filtros',
      activeFilters: 'Filtros Activos'
    },
    en: {
      filters: 'Filters',
      category: 'Category',
      period: 'Period',
      type: 'Type',
      all: 'All',
      income: 'Income',
      expenses: 'Expenses',
      q1: 'Q1 (Jan-Mar)',
      q2: 'Q2 (Apr-Jun)',
      q3: 'Q3 (Jul-Sep)',
      q4: 'Q4 (Oct-Dec)',
      semester1: 'Semester 1',
      semester2: 'Semester 2',
      clear: 'Clear Filters',
      activeFilters: 'Active Filters'
    }
  };

  const t = texts[language];

  const updateFilter = (key: keyof BudgetFilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      category: null,
      period: 'all' as const,
      type: 'all' as const
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterCount = [
    filters.category !== null,
    filters.period !== 'all',
    filters.type !== 'all'
  ].filter(Boolean).length;

  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{t.filters}</h3>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} {t.activeFilters.toLowerCase()}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                {t.clear}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8"
            >
              {isExpanded ? '−' : '+'}
            </Button>
          </div>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Filtro por Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t.type}
              </label>
              <Select
                value={filters.type}
                onValueChange={(value) => updateFilter('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="income">{t.income}</SelectItem>
                  <SelectItem value="expenses">{t.expenses}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Categoría */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t.category}
              </label>
              <Select
                value={filters.category || 'all'}
                onValueChange={(value) => updateFilter('category', value === 'all' ? null : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Periodo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t.period}
              </label>
              <Select
                value={filters.period}
                onValueChange={(value) => updateFilter('period', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t.all}</SelectItem>
                  <SelectItem value="q1">{t.q1}</SelectItem>
                  <SelectItem value="q2">{t.q2}</SelectItem>
                  <SelectItem value="q3">{t.q3}</SelectItem>
                  <SelectItem value="q4">{t.q4}</SelectItem>
                  <SelectItem value="semester1">{t.semester1}</SelectItem>
                  <SelectItem value="semester2">{t.semester2}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
