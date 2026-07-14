// Central rules to identify special companies with curated dashboards.
// - Horizonte Positivo: the full curated dashboard (panels, budget, KPIs, projections).
// - Enfoque a la Familia: its own curated financial dashboard fed by live QuickBooks data.
// Every other company is QuickBooks-only (Balance Sheet and Income Statement) and must
// never inherit a curated company's fixed data.

export const HORIZONTE_NAME = "Horizonte Positivo";
export const ENFOQUE_NAME = "Enfoque a la Familia";

export const isHorizonte = (companyName?: string | null): boolean =>
  (companyName ?? "").trim() === HORIZONTE_NAME;

export const isEnfoque = (companyName?: string | null): boolean => {
  const name = (companyName ?? "").trim().toLowerCase();
  return name === ENFOQUE_NAME.toLowerCase() || name.includes("enfoque");
};

export const isRaci = (companyName?: string | null): boolean =>
  (companyName ?? "").trim().toLowerCase().includes("raci");

export const isDento = (companyName?: string | null): boolean => {
  const name = (companyName ?? "").trim().toLowerCase();
  return name.includes("dento") || name.includes("dentorori");
};
