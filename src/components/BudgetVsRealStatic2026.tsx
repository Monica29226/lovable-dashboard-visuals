import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { tr } from "@/lib/panel2026I18n";

type Row = {
  label: string;
  annual: number | null;
  projection: number | null;
  budget: number | null;
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
  { label: "INGRESOS", annual: null, projection: null, budget: null, actual: null, variance: null, pending: null, progress: "", isHeader: true },
  { label: "Membresía", annual: 230000, projection: 240000, budget: 190650, actual: 104364, variance: -86286, pending: 115636, progress: "47%" },
  { label: "Cuotas Asociados", annual: 220000, projection: 230000, budget: 128585, actual: 130000, variance: 1415, pending: 100000, progress: "57%" },
  { label: "Otros", annual: 0, projection: 0, budget: 0, actual: 0, variance: 0, pending: 0, progress: "n/a" },
  { label: "Total ingresos", annual: 450000, projection: 470000, budget: 319235, actual: 234364, variance: -84870, pending: 215636, progress: "52%", bold: true },
];

const expenses: Row[] = [
  { label: "EGRESOS", annual: null, projection: null, budget: null, actual: null, variance: null, pending: null, progress: "", isHeader: true },
  { label: "Personal", annual: 223079, projection: 226245, budget: 130129, actual: 134029, variance: -3900, pending: 89050, progress: "60%" },
  { label: "Gastos administrativos", annual: 20493, projection: 21682, budget: 11954, actual: 13144, variance: -1189, pending: 7349, progress: "64%" },
  { label: "Viáticos", annual: 24000, projection: 30922, budget: 14000, actual: 20922, variance: -6922, pending: 3078, progress: "87%" },
  { label: "Comunicación y Mercadeo", annual: 15635, projection: 31247, budget: 6395, actual: 22007, variance: -15612, pending: -6372, progress: "141%" },
  { label: "Servicios Profesionales", annual: 24048, projection: 31017, budget: 14028, actual: 20997, variance: -6969, pending: 3051, progress: "87%" },
  { label: "Tecnología", annual: 21840, projection: 28637, budget: 13865, actual: 20662, variance: -6797, pending: 1178, progress: "95%" },
  { label: "Impuestos", annual: 8000, projection: 9147, budget: 5200, actual: 6347, variance: -1147, pending: 1653, progress: "79%" },
  { label: "Otros Gastos", annual: 400, projection: 200, budget: 200, actual: 0, variance: 200, pending: 400, progress: "0%" },
  { label: "Depreciación", annual: 3000, projection: 3320, budget: 1750, actual: 2070, variance: -320, pending: 930, progress: "n/a" },
  { label: "Impuesto de Renta", annual: 0, projection: 0, budget: 0, actual: 0, variance: 0, pending: 0, progress: "n/a" },
  { label: "Total egresos", annual: 340495, projection: 382417, budget: 197522, actual: 240178, variance: -42656, pending: 100318, progress: "71%", bold: true },
];

const net: Row = {
  label: "Ingresos menos Gastos",
  annual: 109505,
  projection: 87583,
  budget: 121713,
  actual: -5813,
  variance: 127526,
  pending: 115318,
  progress: "-5%",
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
  const month = t("Julio");
  const monthYear = t("Julio 2026");
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
        <SummaryCard title={t("Ingresos")} budgetLabel={budgetLabel} actual={234364} budget={319235} />
        <SummaryCard title={t("Egresos")} budgetLabel={budgetLabel} actual={240178} budget={197522} />
        <SummaryCard title={t("Ingresos menos Egresos")} budgetLabel={budgetLabel} actual={-5813} budget={121713} />

      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[hsl(var(--primary))] text-primary-foreground">
                  <th className="border border-border p-2 text-left font-semibold">{t("Cuenta")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Presupuesto Total Anual")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Proyección Diciembre")}</th>
                  <th className="border border-border p-2 text-right font-semibold">{budgetLabel}</th>
                  <th className="border border-border p-2 text-right font-semibold">{t("Acum. Real")} {month}</th>
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
                        <td className="border border-border p-2 font-bold" colSpan={8}>{t(r.label)}</td>
                      </tr>
                    );
                  }
                  const cls = r.bold ? "font-bold bg-muted/60" : "";
                  return (
                    <tr key={i} className={`${cls} hover:bg-muted/40`}>
                      <td className={`border border-border p-2 ${r.bold ? "" : "pl-6"}`}>{t(r.label)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.annual)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.projection)}</td>
                      <td className="border border-border p-2 text-right">{fmt(r.budget)}</td>
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
