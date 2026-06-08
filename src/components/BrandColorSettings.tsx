import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompany } from "@/contexts/CompanyContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Palette, Check, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// Curated accent swatches (HSL token strings) for the white-label palette.
const SWATCHES: { name: string; value: string }[] = [
  { name: "Royal", value: "218 92% 24%" },
  { name: "Océano", value: "199 89% 32%" },
  { name: "Esmeralda", value: "154 54% 32%" },
  { name: "Oro", value: "39 39% 45%" },
  { name: "Terracota", value: "14 60% 45%" },
  { name: "Vino", value: "353 51% 40%" },
  { name: "Violeta", value: "262 52% 47%" },
  { name: "Grafito", value: "235 12% 30%" },
];

export const BrandColorSettings = () => {
  const { selectedCompanyId, companies, loadCompanies } = useCompany();
  const { isAdmin } = useIsAdmin();
  const selected = companies.find((c) => c.id === selectedCompanyId);
  const [color, setColor] = useState<string>("218 92% 24%");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    if (selected?.accent_color) setColor(selected.accent_color);
  }, [selected?.accent_color]);

  // Live preview on the document while the picker is open.
  useEffect(() => {
    document.documentElement.style.setProperty("--co", color);
    document.documentElement.style.setProperty("--co-soft", color);
  }, [color]);

  if (!isAdmin || !selected) return null;

  const handleSave = async () => {
    setSaving(true);
    setSavedMsg(false);
    const { error } = await supabase
      .from("quickbooks_companies")
      .update({ accent_color: color })
      .eq("id", selected.id);
    setSaving(false);
    if (error) {
      toast.error("No se pudo guardar el color");
      return;
    }
    await loadCompanies();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 4000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Palette className="w-5 h-5" /> Marca y colores
        </CardTitle>
        <CardDescription>
          Color de acento de <span className="font-medium text-foreground">{selected.company_name}</span>. Pinta KPIs, gráficos y botones de su panel.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Color de acento</Label>
          <div className="mt-3 flex flex-wrap gap-3">
            {SWATCHES.map((s) => {
              const active = s.value === color;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setColor(s.value)}
                  title={s.name}
                  className={`relative h-10 w-10 rounded-full border-2 transition-all ${active ? "border-foreground scale-110" : "border-line"}`}
                  style={{ backgroundColor: `hsl(${s.value})` }}
                >
                  {active && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live preview */}
        <div className="rounded-lg border border-line bg-paper p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Vista previa</div>
          <div className="flex items-center gap-3">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: `hsl(${color})` }} />
            <Button type="button" style={{ backgroundColor: `hsl(${color})` }} className="text-white hover:opacity-90">
              Botón
            </Button>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: `hsl(${color})` }}
            >
              Badge
            </span>
            <span className="font-display text-2xl tabular-nums" style={{ color: `hsl(${color})` }}>
              ₡ 1.250.000,00
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
          {savedMsg && (
            <div className="flex items-center gap-2 rounded-md bg-success-bg px-3 py-2 text-sm text-success">
              <ShieldCheck className="h-4 w-4" />
              Cambios guardados · el panel se actualizó con la nueva marca
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandColorSettings;
