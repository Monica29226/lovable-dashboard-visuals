import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { ChevronDown, ChevronRight, FileSpreadsheet, Loader2, RefreshCw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCompany } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/executiveProjection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Estado de resultados por proyecto: cada proyecto es una Clase de QuickBooks
// (ProfitAndLoss con summarize_column_by=Classes). El usuario escoge uno o
// varios proyectos; la columna TOTAL suma solo los proyectos seleccionados.

interface ClassRow {
  key: string;
  name: string;
  level: number;
  type: "section" | "account" | "summary";
  values: number[];
}

interface ClassReport {
  classes: string[];
  rows: ClassRow[];
  startDate: string | null;
  endDate: string | null;
}

const MONTHS_ES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Setiembre", "Octubre", "Noviembre", "Diciembre"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const lastDayOfMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
const money = (value: number) => (value === 0 ? "-" : formatMoney(value, "", { showSymbol: false }));

const ProjectIncomeStatementPage = () => {
  const { language } = useLanguage();
  const es = language === "es";
  const { selectedCompanyId, companies } = useCompany();
  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const startDate = `${year}-${String(fromMonth).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(toMonth).padStart(2, "0")}-${lastDayOfMonth(year, toMonth)}`;

  const report = useQuery({
    queryKey: ["pl-by-class", selectedCompanyId, startDate, endDate],
    enabled: !!selectedCompanyId && !!selectedCompany?.is_connected,
    queryFn: async (): Promise<ClassReport> => {
      const { data, error } = await supabase.functions.invoke("quickbooks-profit-loss-by-project", {
        body: { companyId: selectedCompanyId, startDate, endDate },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { classes: data?.classes ?? [], rows: data?.rows ?? [], startDate: data?.startDate ?? null, endDate: data?.endDate ?? null };
    },
  });

  const classes = useMemo(() => report.data?.classes ?? [], [report.data]);

  // Al cambiar de empresa o de lista de proyectos, se seleccionan todos.
  useEffect(() => {
    setSelected(new Set(classes));
  }, [classes]);

  useEffect(() => {
    setCollapsed(new Set());
  }, [selectedCompanyId]);

  const visible = useMemo(
    () => classes.map((name, idx) => ({ name, idx })).filter((c) => selected.has(c.name)),
    [classes, selected]
  );
  const rowTotal = (row: ClassRow) => visible.reduce((sum, c) => sum + (row.values[c.idx] || 0), 0);

  // Una fila queda oculta si alguna sección que la contiene está contraída.
  const rows = useMemo(() => {
    const all = report.data?.rows ?? [];
    const out: ClassRow[] = [];
    const stack: { level: number; key: string }[] = [];
    for (const row of all) {
      while (stack.length && stack[stack.length - 1].level >= row.level) stack.pop();
      const hidden = stack.some((s) => collapsed.has(s.key));
      if (!hidden) out.push(row);
      if (row.type === "section") stack.push({ level: row.level, key: row.key });
    }
    return out;
  }, [report.data, collapsed]);

  const toggleProject = (name: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const toggleSection = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const months = es ? MONTHS_ES : MONTHS_EN;
  const yearOptions = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear()];
  const periodLabel = `${months[fromMonth - 1]} – ${months[toMonth - 1]} ${year}`;

  const exportExcel = () => {
    const header = [es ? "Cuenta" : "Account", ...visible.map((c) => c.name), "TOTAL"];
    const body = (report.data?.rows ?? []).map((row) => [
      `${"  ".repeat(row.level)}${row.name}`,
      ...visible.map((c) => (row.type === "section" ? "" : row.values[c.idx] || 0)),
      row.type === "section" ? "" : rowTotal(row),
    ]);
    const sheet = XLSX.utils.aoa_to_sheet([
      [`${selectedCompany?.company_name ?? ""} — ${es ? "Estado de Resultados por Proyecto" : "Income Statement by Project"}`],
      [periodLabel],
      [],
      header,
      ...body,
    ]);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, es ? "Por proyecto" : "By project");
    XLSX.writeFile(book, `Resultados_por_proyecto_${selectedCompany?.company_name ?? ""}_${startDate}_${endDate}.xlsx`);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">{es ? "Estado de Resultados por Proyecto" : "Income Statement by Project"}</h1>
        {selectedCompany?.company_name && <p className="text-muted-foreground mt-1">{selectedCompany.company_name}</p>}
      </header>

      <Card>
        <CardContent className="pt-6 flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{es ? "Año" : "Year"}</p>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>{yearOptions.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{es ? "Desde" : "From"}</p>
            <Select value={String(fromMonth)} onValueChange={(v) => { const m = Number(v); setFromMonth(m); if (m > toMonth) setToMonth(m); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{es ? "Hasta" : "To"}</p>
            <Select value={String(toMonth)} onValueChange={(v) => { const m = Number(v); setToMonth(m); if (m < fromMonth) setFromMonth(m); }}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => report.refetch()} disabled={report.isFetching}>
              <RefreshCw className={cn("h-4 w-4 mr-2", report.isFetching && "animate-spin")} />
              {es ? "Actualizar" : "Refresh"}
            </Button>
            <Button variant="outline" size="sm" onClick={exportExcel} disabled={!visible.length}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {!selectedCompany?.is_connected ? (
        <p className="text-sm text-muted-foreground">{es ? "Esta empresa no tiene QuickBooks conectado." : "This company has no QuickBooks connection."}</p>
      ) : report.isLoading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : report.isError ? (
        <p className="text-sm text-destructive">{es ? "No fue posible cargar el reporte de QuickBooks." : "Could not load the QuickBooks report."}</p>
      ) : !classes.length ? (
        <p className="text-sm text-muted-foreground">
          {es ? "No hay proyectos (Clases de QuickBooks) con movimientos en este período." : "No projects (QuickBooks Classes) with activity in this period."}
        </p>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-base">{es ? "Proyectos" : "Projects"}</CardTitle>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">{selected.size} / {classes.length}</span>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set(classes))}>{es ? "Todos" : "All"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>{es ? "Ninguno" : "None"}</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {classes.map((name) => (
                <Button
                  key={name}
                  size="sm"
                  variant={selected.has(name) ? "default" : "outline"}
                  onClick={() => toggleProject(name)}
                  aria-pressed={selected.has(name)}
                >
                  {name}
                </Button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{periodLabel}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {es ? "TOTAL suma solo los proyectos seleccionados. Fuente: QuickBooks Online." : "TOTAL adds only the selected projects. Source: QuickBooks Online."}
              </p>
            </CardHeader>
            <CardContent>
              {!visible.length ? (
                <p className="text-sm text-muted-foreground">{es ? "Seleccione al menos un proyecto." : "Select at least one project."}</p>
              ) : (
                <div className="overflow-x-auto rounded border">
                  <table className="w-full text-sm tabular-nums">
                    <thead>
                      <tr className="bg-muted">
                        <th className="sticky left-0 bg-muted text-left p-2 min-w-[240px]">{es ? "Cuenta" : "Account"}</th>
                        {visible.map((c) => <th key={c.name} className="text-right p-2 min-w-[130px]">{c.name}</th>)}
                        <th className="text-right p-2 min-w-[140px] border-l-2 border-primary/30 bg-primary/10">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => {
                        const isSection = row.type === "section";
                        const isSummary = row.type === "summary";
                        const bg = isSection ? "bg-muted/60" : isSummary ? "bg-primary/5" : "bg-background";
                        return (
                          <tr
                            key={row.key}
                            className={cn("border-t", bg, isSection && "cursor-pointer hover:bg-muted", (isSection || isSummary) && "font-semibold")}
                            onClick={isSection ? () => toggleSection(row.key) : undefined}
                          >
                            <td className={cn("sticky left-0 p-2", bg)} style={{ paddingLeft: `${0.5 + row.level * 1.25}rem` }}>
                              <span className="inline-flex items-center gap-1">
                                {isSection && (collapsed.has(row.key) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                {row.name}
                              </span>
                            </td>
                            {visible.map((c) => (
                              <td key={c.name} className="text-right p-2">{isSection ? "" : money(row.values[c.idx] || 0)}</td>
                            ))}
                            <td className="text-right p-2 border-l-2 border-primary/30 bg-primary/5">{isSection ? "" : money(rowTotal(row))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProjectIncomeStatementPage;
