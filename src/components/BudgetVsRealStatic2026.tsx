import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { tr } from "@/lib/panel2026I18n";

type Row = {
  label: string;
  annual: number | null;
  june: number | null;
  actual: number | null;
  variance: number | null;
  pending: number | null;
  progress: string; // pre-formatted (e.g. "28%", "n/a")
  bold?: boolean;
  isHeader?: boolean;
};

const fmt = (v: number | null): string => {
  if (v === null || v === 0) return "-";
  const abs = Math.abs(v).toLocaleString("en-US");
  return v < 0 ? `(${abs})` : abs;
};

const income: Row[] = [
  { label: "INGRESOS", annual: null, june: null, actual: null, variance: null, pending: null, progress: "", isHeader: true },
  { label: "Membresía", annual: 230000, june: 175650, actual: 71311, variance: -104339, pending: 148689, progress: "32%" },
  { label: "Cuotas Asociados", annual: 220000, june: 114785, actual: 115000, variance: 215, pending: 115000, progress: "50%" },
  { label: "Otros", annual: 0, june: 0, actual: 0, variance: 0, pending: 0, progress: "n/a" },
  { label: "Total ingresos", annual: 450000, june: 290435, actual: 186311, variance: -104124, pending: 263689, progress: "41%", bold: true },
];

const expenses: Row[] = [
  { label: "EGRESOS", annual: null, june: null, actual: null, variance: null, pending: null, progress: "", isHeader: true },
  { label: "Personal", annual: 223079, june: 111540, actual: 114603, variance: -3064, pending: 108476, progress: "51%" },
  { label: "Gastos administrativos", annual: 20493, june: 10247, actual: 11784, variance: -1537, pending: 8709, progress: "58%" },
  { label: "Viáticos", annual: 24000, june: 12000, actual: 17142, variance: -5142, pending: 6858, progress: "71%" },
  { label: "Comunicación y Mercadeo", annual: 15635, june: 6245, actual: 14533, variance: -8288, pending: 1102, progress: "93%" },
  { label: "Servicios Profesionales", annual: 24048, june: 12024, actual: 27601, variance: -15577, pending: -3553, progress: "115%" },
  { label: "Tecnología", annual: 21840, june: 12670, actual: 18324, variance: -5654, pending: 3516, progress: "84%" },
  { label: "Impuestos", annual: 8000, june: 4000, actual: 5999, variance: -1999, pending: 2001, progress: "75%" },
  { label: "Otros Gastos", annual: 400, june: 200, actual: 0, variance: 200, pending: 400, progress: "0%" },
  { label: "Depreciación", annual: 3000, june: 1500, actual: 1751, variance: -251, pending: 1249, progress: "n/a" },
  { label: "Impuesto de Renta", annual: 0, june: 0, actual: 0, variance: 0, pending: 0, progress: "n/a" },
  { label: "Total egresos", annual: 340495, june: 170425, actual: 211738, variance: -41313, pending: 128757, progress: "62%", bold: true },
];

const net: Row = {
  label: "Ingresos menos Gastos",
  annual: 109505,
  june: 120010,
  actual: -25427,
  variance: 145437,
  pending: 134932,
  progress: "-23%",
  bold: true,
};


const rows: Row[] = [...income, ...expenses, net];

const SummaryCard = ({ title, actual, budget, budgetLabel }: { title: string; actual: number; budget: number; budgetLabel: string }) => (
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-semibold">{fmt(actual)}</div>
      <div className="text-xs text-muted-foreground mt-1">{budgetLabel}: {fmt(budget)}</div>
    </CardContent>
  </Card>
);

const BudgetVsRealStatic2026 = () => {
  const { language } = useLanguage();
  const t = (s: string) => tr(s, language);
  const month = t("Junio");
  const monthYear = t("Junio 2026");
  const budgetLabel = `${t("Presupuesto")} ${month}`;
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">{t("Presupuesto vs. Real — 2026")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("Valores en US$")} · {t("Acumulado a")} {monthYear} · {t("Cuadro de referencia (no en tiempo real)")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard title={t("Ingresos")} budgetLabel={budgetLabel} actual={186311} budget={290435} />
        <SummaryCard title={t("Egresos")} budgetLabel={budgetLabel} actual={211738} budget={170425} />
        <SummaryCard title={t("Ingresos menos Egresos")} budgetLabel={budgetLabel} actual={-25427} budget={120010} />

      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[hsl(var(--primary))] text-primary-foreground">
                  <th className="border border-border p-2 text-left font-semibold">{t("Cuenta")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Presupuesto Total Anual")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{budgetLabel}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Acumulado")} {month}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Variación")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Pendiente Ejecución")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("% Avance")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  if (r.isHeader) {
                    return (
                      <tr key={i} className="bg-muted">
                        <td className="border border-border p-2 font-bold" colSpan={7}>{t(r.label)}</td>
                      </tr>
                    );
                  }
                  const cls = r.bold ? "font-bold bg-muted/60" : "";
                  return (
                    <tr key={i} className={`${cls} hover:bg-muted/40`}>
                      <td className={`border border-border p-2 ${r.bold ? "" : "pl-6"}`}>{t(r.label)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.annual)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.june)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.actual)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.variance)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.pending)}</td>
                      <td className="border border-border p-2 text-right">{r.progress || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetVsRealStatic2026;
