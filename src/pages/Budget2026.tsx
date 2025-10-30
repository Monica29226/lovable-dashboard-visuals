import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Download, Save } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface BudgetItem {
  id: string;
  name: string;
  level: number;
  children?: BudgetItem[];
  isExpanded?: boolean;
  values: { [month: string]: number | null };
}

const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const initialBudgetData: BudgetItem[] = [
  {
    id: "ingresos",
    name: "Ingresos",
    level: 0,
    isExpanded: true,
    values: {},
    children: [
      {
        id: "cuotas",
        name: "Cuotas de Asociados",
        level: 1,
        values: {
          Ene: 70000, Feb: 15000, Mar: 30000, Abr: 30000, May: 20000, Jun: 10650,
          Jul: 15000, Ago: 5000, Sep: 5000, Oct: 5000, Nov: 5000, Dic: 40000
        }
      },
      {
        id: "membresias",
        name: "Membresías",
        level: 1,
        values: {
          Ene: 26800, Feb: 45650, Mar: 41400, Abr: 17000, May: 18430, Jun: 13350,
          Jul: 17250, Ago: 26875, Sep: 19900, Oct: 14200, Nov: 9000, Dic: 16230
        }
      },
      {
        id: "proyectos",
        name: "Proyectos y membresías especiales",
        level: 1,
        values: {
          Ene: 0, Feb: 0, Mar: 0, Abr: 0, May: 25000, Jun: 0,
          Jul: 0, Ago: 0, Sep: 18000, Oct: 0, Nov: 0, Dic: 0
        }
      }
    ]
  },
  {
    id: "egresos",
    name: "Egresos",
    level: 0,
    isExpanded: true,
    values: {},
    children: [
      {
        id: "personal",
        name: "Personal",
        level: 1,
        isExpanded: false,
        values: {},
        children: [
          {
            id: "salarios",
            name: "Salarios",
            level: 2,
            values: {
              Ene: 15000, Feb: 15000, Mar: 15000, Abr: 15000, May: 15000, Jun: 15000,
              Jul: 15000, Ago: 15000, Sep: 15000, Oct: 15000, Nov: 15000, Dic: 15000
            }
          },
          {
            id: "aguinaldo",
            name: "Aguinaldo CCSS",
            level: 2,
            values: {
              Ene: 1250, Feb: 1250, Mar: 1250, Abr: 1250, May: 1250, Jun: 1250,
              Jul: 1250, Ago: 1250, Sep: 1250, Oct: 1250, Nov: 1250, Dic: 1250
            }
          },
          {
            id: "ccss",
            name: "CCSS + IET + Póliza 26.67%",
            level: 2,
            values: {
              Ene: 4000, Feb: 4000, Mar: 4000, Abr: 4000, May: 4000, Jun: 4000,
              Jul: 4000, Ago: 4000, Sep: 4000, Oct: 4000, Nov: 4000, Dic: 4000
            }
          },
          {
            id: "polizas",
            name: "Pólizas",
            level: 2,
            values: {
              Ene: 144, Feb: 144, Mar: 144, Abr: 144, May: 144, Jun: 144,
              Jul: 144, Ago: 144, Sep: 144, Oct: 144, Nov: 144, Dic: 144
            }
          }
        ]
      },
      {
        id: "admin",
        name: "Gastos administrativos",
        level: 1,
        isExpanded: false,
        values: {},
        children: [
          {
            id: "planillas",
            name: "Planilla Oficinas y Arqueos",
            level: 2,
            values: {
              Ene: 1000, Feb: 1000, Mar: 1000, Abr: 1000, May: 1000, Jun: 1000,
              Jul: 1000, Ago: 1000, Sep: 1000, Oct: 1000, Nov: 1000, Dic: 1000
            }
          },
          {
            id: "telefonia",
            name: "Telefonía Celular",
            level: 2,
            values: {
              Ene: 37.75, Feb: 37.75, Mar: 37.75, Abr: 37.75, May: 37.75, Jun: 37.75,
              Jul: 37.75, Ago: 37.75, Sep: 37.75, Oct: 37.75, Nov: 37.75, Dic: 37.75
            }
          },
          {
            id: "suministros",
            name: "Suministros de Oficina",
            level: 2,
            values: {
              Ene: 100, Feb: 100, Mar: 100, Abr: 100, May: 100, Jun: 100,
              Jul: 100, Ago: 100, Sep: 100, Oct: 100, Nov: 100, Dic: 100
            }
          }
        ]
      },
      {
        id: "tecnologia",
        name: "Tecnología",
        level: 1,
        isExpanded: false,
        values: {},
        children: [
          {
            id: "hosting",
            name: "Hosting TI",
            level: 2,
            values: {
              Ene: 70, Feb: 70, Mar: 70, Abr: 70, May: 70, Jun: 70,
              Jul: 70, Ago: 70, Sep: 70, Oct: 70, Nov: 70, Dic: 70
            }
          },
          {
            id: "soporte",
            name: "Soporte y desarrollos tecnológicos",
            level: 2,
            values: {
              Ene: 1000, Feb: 2000, Mar: 2000, Abr: 2000, May: 1000, Jun: 1000,
              Jul: 1000, Ago: 1000, Sep: 2000, Oct: 2000, Nov: 1000, Dic: 1000
            }
          }
        ]
      }
    ]
  }
];

export default function Budget2026() {
  const { language } = useLanguage();
  const [budgetData, setBudgetData] = useState<BudgetItem[]>(initialBudgetData);
  const [editMode, setEditMode] = useState(false);

  const texts = {
    es: {
      title: "Presupuesto 2026",
      subtitle: "Gestión de presupuesto anual",
      editMode: "Modo Edición",
      save: "Guardar Cambios",
      export: "Exportar",
      exportExcel: "Exportar a Excel",
      exportPDF: "Exportar a PDF",
      total: "Total",
      account: "Cuenta"
    },
    en: {
      title: "Budget 2026",
      subtitle: "Annual budget management",
      editMode: "Edit Mode",
      save: "Save Changes",
      export: "Export",
      exportExcel: "Export to Excel",
      exportPDF: "Export to PDF",
      total: "Total",
      account: "Account"
    }
  };

  const t = texts[language];

  const toggleExpand = (itemId: string, parentPath: BudgetItem[] = budgetData): BudgetItem[] => {
    return parentPath.map(item => {
      if (item.id === itemId) {
        return { ...item, isExpanded: !item.isExpanded };
      }
      if (item.children) {
        return { ...item, children: toggleExpand(itemId, item.children) };
      }
      return item;
    });
  };

  const handleToggle = (itemId: string) => {
    setBudgetData(toggleExpand(itemId));
  };

  const updateValue = (itemId: string, month: string, value: number | null, parentPath: BudgetItem[] = budgetData): BudgetItem[] => {
    return parentPath.map(item => {
      if (item.id === itemId) {
        return { ...item, values: { ...item.values, [month]: value } };
      }
      if (item.children) {
        return { ...item, children: updateValue(itemId, month, value, item.children) };
      }
      return item;
    });
  };

  const handleValueChange = (itemId: string, month: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setBudgetData(updateValue(itemId, month, numValue));
  };

  const calculateTotal = (item: BudgetItem): number => {
    let total = 0;
    
    if (item.children && item.children.length > 0) {
      total = item.children.reduce((sum, child) => sum + calculateTotal(child), 0);
    } else {
      total = Object.values(item.values).reduce((sum, val) => sum + (val || 0), 0);
    }
    
    return total;
  };

  const calculateMonthTotal = (items: BudgetItem[], month: string): number => {
    return items.reduce((sum, item) => {
      if (item.children && item.children.length > 0) {
        return sum + calculateMonthTotal(item.children, month);
      }
      return sum + (item.values[month] || 0);
    }, 0);
  };

  const renderRow = (item: BudgetItem, index: number) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = item.isExpanded;
    const indent = item.level * 24;
    const rowTotal = calculateTotal(item);

    return (
      <>
        <tr key={item.id} className={`border-b ${item.level === 0 ? 'bg-accent font-semibold' : ''}`}>
          <td className="p-2 sticky left-0 bg-background border-r" style={{ paddingLeft: `${indent + 8}px` }}>
            <div className="flex items-center gap-2">
              {hasChildren && (
                <button
                  onClick={() => handleToggle(item.id)}
                  className="hover:bg-accent rounded p-1"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}
              {!hasChildren && <span className="w-6" />}
              <span>{item.name}</span>
            </div>
          </td>
          {months.map(month => {
            const value = hasChildren ? calculateMonthTotal([item], month) : (item.values[month] || 0);
            return (
              <td key={month} className="p-2 text-right border-r">
                {editMode && !hasChildren ? (
                  <Input
                    type="number"
                    value={item.values[month] || ""}
                    onChange={(e) => handleValueChange(item.id, month, e.target.value)}
                    className="w-24 h-8 text-right"
                  />
                ) : (
                  <span className={hasChildren ? 'font-medium' : ''}>
                    {value.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </td>
            );
          })}
          <td className="p-2 text-right font-semibold border-r bg-accent/50">
            {rowTotal.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </td>
        </tr>
        {hasChildren && isExpanded && item.children?.map((child, childIndex) => renderRow(child, childIndex))}
      </>
    );
  };

  const exportToExcel = () => {
    const flattenData = (items: BudgetItem[], result: any[] = []) => {
      items.forEach(item => {
        const row: any = { [t.account]: item.name };
        months.forEach(month => {
          const hasChildren = item.children && item.children.length > 0;
          row[month] = hasChildren ? calculateMonthTotal([item], month) : (item.values[month] || 0);
        });
        row[t.total] = calculateTotal(item);
        result.push(row);
        if (item.children) {
          flattenData(item.children, result);
        }
      });
      return result;
    };

    const data = flattenData(budgetData);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Presupuesto 2026");
    XLSX.writeFile(wb, "presupuesto-2026.xlsx");
    toast.success(language === 'es' ? 'Exportado a Excel' : 'Exported to Excel');
  };

  const handleSave = () => {
    toast.success(language === 'es' ? 'Cambios guardados' : 'Changes saved');
    setEditMode(false);
  };

  const totalIngresos = budgetData[0] ? calculateTotal(budgetData[0]) : 0;
  const totalEgresos = budgetData[1] ? calculateTotal(budgetData[1]) : 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <header className="bg-card rounded-xl shadow-sm p-6 border">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{t.title}</h1>
              <p className="text-muted-foreground">{t.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={editMode ? "default" : "outline"}
                onClick={() => setEditMode(!editMode)}
              >
                {t.editMode}
              </Button>
              {editMode && (
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  {t.save}
                </Button>
              )}
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="mr-2 h-4 w-4" />
                {t.exportExcel}
              </Button>
              <LanguageToggle />
            </div>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Presupuesto Anual 2026</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-accent sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left border-r sticky left-0 bg-accent min-w-[300px]">
                      {t.account}
                    </th>
                    {months.map(month => (
                      <th key={month} className="p-2 text-right border-r min-w-[100px]">
                        {month}
                      </th>
                    ))}
                    <th className="p-2 text-right border-r min-w-[120px]">
                      {t.total}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {budgetData.map((item, index) => renderRow(item, index))}
                  <tr className="border-t-2 bg-primary/10 font-bold">
                    <td className="p-3 sticky left-0 bg-primary/10">
                      Balance
                    </td>
                    {months.map(month => {
                      const ingresos = calculateMonthTotal([budgetData[0]], month);
                      const egresos = calculateMonthTotal([budgetData[1]], month);
                      const balance = ingresos - egresos;
                      return (
                        <td key={month} className={`p-3 text-right border-r ${balance < 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {balance.toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      );
                    })}
                    <td className={`p-3 text-right border-r ${(totalIngresos - totalEgresos) < 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {(totalIngresos - totalEgresos).toLocaleString('es-CR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
