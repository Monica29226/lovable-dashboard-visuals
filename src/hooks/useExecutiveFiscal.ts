import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FiscalCredits, TaxBracket } from "@/lib/executiveProjection";

export const DEFAULT_TAXPAYER_PROFILE = "persona_fisica_lucrativa";
export const DEFAULT_COUNTRY = "CR";

export interface FiscalSettingsRow {
  id: string;
  company_id: string;
  fiscal_period: string;
  taxpayer_type: string | null;
  calculation_rule: string;
  config: Record<string, unknown> | null;
  manual_adjustments: number;
  partial_payments: number;
  notes: string | null;
}

/** Tramos configurables por país, período y perfil de contribuyente. */
export function useTaxBrackets(fiscalPeriod: string, profile: string, country = DEFAULT_COUNTRY) {
  return useQuery({
    queryKey: ["tax-brackets", country, fiscalPeriod, profile],
    queryFn: async (): Promise<TaxBracket[]> => {
      const { data, error } = await supabase
        .from("tax_brackets")
        .select("id, lower_limit, upper_limit, rate")
        .eq("country", country)
        .eq("fiscal_period", fiscalPeriod)
        .eq("taxpayer_profile", profile)
        .eq("active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((b) => ({
        id: b.id,
        lower_limit: Number(b.lower_limit),
        upper_limit: b.upper_limit === null ? null : Number(b.upper_limit),
        rate: Number(b.rate),
      }));
    },
  });
}

/** Ajustes fiscales, anticipos, retenciones y otros créditos por empresa y período. */
export function useFiscalSettings(companyId: string, fiscalPeriod: string) {
  return useQuery({
    queryKey: ["fiscal-settings", companyId, fiscalPeriod],
    enabled: !!companyId,
    queryFn: async (): Promise<FiscalSettingsRow | null> => {
      const { data, error } = await supabase
        .from("tax_estimate_settings")
        .select("*")
        .eq("company_id", companyId)
        .eq("fiscal_period", fiscalPeriod)
        .maybeSingle();
      if (error) throw error;
      return (data as unknown as FiscalSettingsRow) ?? null;
    },
  });
}

export function creditsFromSettings(row: FiscalSettingsRow | null | undefined): FiscalCredits {
  const config = (row?.config ?? {}) as Record<string, unknown>;
  return {
    fiscalAdjustments: Number(row?.manual_adjustments ?? 0),
    advances: Number(row?.partial_payments ?? 0),
    withholdings: Number((config.withholdings as number) ?? 0),
    otherCredits: Number((config.other_credits as number) ?? 0),
  };
}

export function useSaveFiscalCredits(companyId: string, fiscalPeriod: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FiscalCredits & { notes?: string | null; profile?: string }) => {
      const { data: existing } = await supabase
        .from("tax_estimate_settings")
        .select("id, config")
        .eq("company_id", companyId)
        .eq("fiscal_period", fiscalPeriod)
        .maybeSingle();

      const config = {
        ...((existing?.config as Record<string, unknown>) ?? {}),
        country: DEFAULT_COUNTRY,
        withholdings: payload.withholdings,
        other_credits: payload.otherCredits,
      };

      const row = {
        company_id: companyId,
        fiscal_period: fiscalPeriod,
        taxpayer_type: payload.profile ?? DEFAULT_TAXPAYER_PROFILE,
        calculation_rule: "brackets_config",
        config,
        manual_adjustments: payload.fiscalAdjustments,
        partial_payments: payload.advances,
        notes: payload.notes ?? null,
      };

      const { error } = existing?.id
        ? await supabase.from("tax_estimate_settings").update(row).eq("id", existing.id)
        : await supabase.from("tax_estimate_settings").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fiscal-settings", companyId, fiscalPeriod] });
    },
  });
}
