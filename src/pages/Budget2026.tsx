import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { BudgetProvider, useBudget, BudgetRow } from "@/contexts/BudgetContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown,
  Save,
  FileSpreadsheet,
  FileText,
  ToggleLeft,
  ToggleRight
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
import { useCompany } from "@/contexts/CompanyContext";
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
    updateCell,
    updateAnnual,
    updateCategoryName,
    saveBudget,
    toggleRowExpand,
    editedCells,
    distributionMode,
    setDistributionMode,
    exchangeRate,
    setExchangeRate,
  } = useBudget();

  const [filteredBudgetData, setFilteredBudgetData] = useState<BudgetRow[]>([]);
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
      loading: 'Cargando presupuesto...',
      saving: 'Guardando...',
      income: 'INGRESOS',
      expenses: 'EGRESOS',
      netResult: 'Ingresos menos Egresos',
      total: 'Total',
      category: 'Categoría',
      months: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
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
      income: 'INCOME',
      expenses: 'EXPENSES',
      netResult: 'Income minus Expenses',
      total: 'Total',
      category: 'Category',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      savedSuccess: 'Budget saved successfully',
      tabDetails: 'Details',
      tabSummary: 'Summary'
    }
  };

  const t = texts[language];

  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  useEffect(() => {
    let filtered = [...budgetData];
    if (filters.type !== 'all') {
      const typeKeyword = filters.type === 'income' ? 
        (language === 'es' ? 'INGRESO' : 'INCOME') : 
        (language === 'es' ? 'EGRESO' : 'EXPENSES');
      filtered = filtered.filter(row => {
        if (row.level === 0) return row.category.includes(typeKeyword);
        return row.parent_category?.includes(typeKeyword) || 
               budgetData.find(r => r.category === row.parent_category)?.parent_category?.includes(typeKeyword);
      });
    }
    if (filters.category) {
      filtered = filtered.filter(row => 
        row.category === filters.category || 
        row.parent_category === filters.category ||
        budgetData.find(r => r.category === row.parent_category)?.parent_category === filters.category
      );
    }
    setFilteredBudgetData(filtered);
  }, [budgetData, filters, language]);

  const getMonthsForPeriod = (period: string): string[] => {
    const allMonths = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];
    switch (period) {
      case 'q1': return allMonths.slice(0, 3);
      case 'q2': return allMonths.slice(3, 6);
      case 'q3': return allMonths.slice(6, 9);
      case 'q4': return allMonths.slice(9, 12);
      case 'semester1': return allMonths.slice(0, 6);
      case 'semester2': return allMonths.slice(6, 12);
      default: return allMonths;
    }
  };

  const getVisibleMonths = () => getMonthsForPeriod(filters.period);

  const handleFillCells = (startRow: number, startMonth: string, endRow: number, endMonth: string) => {
    const months = ['january', 'february', 'march', 'april', 'may', 'june', 
                    'july', 'august', 'september', 'october', 'november', 'december'];
    const startMonthIndex = months.indexOf(startMonth);
    const endMonthIndex = months.indexOf(endMonth);
    if (startMonthIndex === -1 || endMonthIndex === -1) return;

    const sourceValue = budgetData[startRow][startMonth as keyof BudgetRow] as number;
    let increment = 0;
    if (startMonthIndex > 0) {
      const prevValue = budgetData[startRow][months[startMonthIndex - 1] as keyof BudgetRow] as number;
      if (!isNaN(prevValue)) increment = sourceValue - prevValue;
    }

    if (startRow === endRow) {
      const minM = Math.min(startMonthIndex, endMonthIndex);
      const maxM = Math.max(startMonthIndex, endMonthIndex);
      for (let i = minM; i <= maxM; i++) {
        if (i !== startMonthIndex) {
          const steps = i - startMonthIndex;
          const val = increment !== 0 ? sourceValue + increment * steps : sourceValue;
          updateCell(startRow, months[i], val);
        }
      }
    } else {
      const minR = Math.min(startRow, endRow);
      const maxR = Math.max(startRow, endRow);
      for (let i = minR; i <= maxR; i++) {
        if (i !== startRow && budgetData[i].level === 3) {
          const steps = i - startRow;
          const val = increment !== 0 ? sourceValue + increment * steps : sourceValue;
          updateCell(i, startMonth, val);
        }
      }
    }
  };

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

        <BudgetFilters
          onFilterChange={setFilters}
          categories={budgetData.filter(row => row.level === 1).map(row => row.category)}
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
                        {getVisibleMonths().map((month) => (
                          <th key={month} className="border p-2 text-right min-w-[100px]">
                            {t.months[['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'].indexOf(month)]}
                          </th>
                        ))}
                        <th className="border p-2 text-right min-w-[120px] font-bold bg-primary/10">{t.total}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(filteredBudgetData.length > 0 ? filteredBudgetData : budgetData).map((row, index) => {
                        // Check parent expand state
                        if (row.level >= 2) {
                          const parentRow = budgetData.find(r => r.category === row.parent_category && r.level === row.level - 1);
                          if (parentRow && !parentRow.expanded) return null;
                        }
                        
                        const isMainCategory = row.level === 0;
                        const isLevel1 = row.level === 1;
                        const isLevel2 = row.level === 2;
                        const hasChildren = budgetData.some(r => r.parent_category === row.category && r.level === row.level + 1);
                        const isDisabled = isMainCategory || (isLevel1 && hasChildren);
                        
                        // Distribution mode for this row
                        const mode = distributionMode[row.category] || "manual";
                        const isLeafRow = !isMainCategory && !isDisabled;
                        const isAutoMode = mode === "auto" && isLeafRow;
                        
                        return (
                          <tr 
                            key={index} 
                            className={cn(
                              isMainCategory && 'bg-primary/10',
                              isLevel1 && 'bg-muted/20',
                              'hover:bg-primary/5 transition-colors'
                            )}
                          >
                            <td className="border p-2">
                              <div className="flex items-center gap-2" style={{ paddingLeft: `${row.level * 20}px` }}>
                                {isLevel1 && hasChildren && (
                                  <button
                                    onClick={() => toggleRowExpand(index)}
                                    className="hover:bg-muted rounded p-1 transition-colors flex-shrink-0"
                                  >
                                    {row.expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                  </button>
                                )}
                                {isLevel1 && !hasChildren && <div className="w-6" />}
                                {isMainCategory ? (
                                  <span className="font-bold text-base">{row.category}</span>
                                ) : (
                                  <div className="flex items-center gap-1 flex-1">
                                    <Input
                                      type="text"
                                      value={row.category}
                                      onChange={(e) => updateCategoryName(index, e.target.value)}
                                      className={cn(
                                        "border-0 focus:ring-2 focus:ring-primary h-8 flex-1",
                                        (isMainCategory || isLevel1) && 'font-bold',
                                        isMainCategory && 'text-base'
                                      )}
                                      disabled={isMainCategory}
                                    />
                                    {isLeafRow && (
                                      <button
                                        onClick={() => setDistributionMode(row.category, mode === "auto" ? "manual" : "auto")}
                                        className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                                        title={mode === "auto" ? "Modo Auto (anual/12)" : "Modo Manual (meses editables)"}
                                      >
                                        {mode === "auto" ? <ToggleRight className="h-4 w-4 text-primary" /> : <ToggleLeft className="h-4 w-4" />}
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            {getVisibleMonths().map(month => {
                              const cellKey = `${index}-${month}`;
                              const isEdited = editedCells.has(cellKey);
                              
                              return (
                                <td key={month} className="border p-1 relative budget-cell" data-row={index} data-month={month}>
                                  <BudgetCellInput
                                    value={row[month as keyof BudgetRow] as number}
                                    onChange={(value) => {
                                      if (!isDisabled && !isAutoMode) {
                                        updateCell(index, month, value);
                                      }
                                    }}
                                    isEdited={isEdited}
                                    disabled={isDisabled || isAutoMode}
                                    className={cn(
                                      "h-8",
                                      isMainCategory && "font-bold text-primary cursor-default bg-primary/5",
                                      isLevel1 && "font-bold bg-muted/30 cursor-default",
                                      isLevel2 && "font-medium bg-muted/20 cursor-default",
                                      isAutoMode && "bg-muted/10 text-muted-foreground cursor-default"
                                    )}
                                  />
                                  {!isDisabled && !isAutoMode && (
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
                            <td className={cn(
                              "border p-1",
                              isMainCategory || isLevel1 || isLevel2 ? 'font-bold text-primary' : 'text-primary',
                              'bg-primary/10'
                            )}>
                              {isLeafRow && mode === "auto" ? (
                                <BudgetCellInput
                                  value={row.total}
                                  onChange={(value) => updateAnnual(index, value)}
                                  isEdited={editedCells.has(`${index}-total`)}
                                  disabled={false}
                                  className="h-8 font-bold text-primary bg-primary/5"
                                />
                              ) : (
                                <div className="text-right p-2">{formatNumber(row.total)}</div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Net Result Row */}
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
                                <td key={month} className={cn("border p-2 text-right font-bold", netResult < 0 ? 'text-destructive' : 'text-green-600')}>
                                  {formatNumber(netResult)}
                                </td>
                              );
                            })}
                            <td className={cn("border p-2 text-right font-bold text-base", (incomeRow.total - expensesRow.total) < 0 ? 'text-destructive' : 'text-green-600')}>
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
              <ComparativeBudget2025vs2026 budgetData={budgetData} />
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

const Budget2026 = () => {
  return (
    <BudgetProvider>
      <Budget2026Inner />
    </BudgetProvider>
  );
};

export default Budget2026;
