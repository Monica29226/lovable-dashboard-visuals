// Central rule to identify the special "Horizonte Positivo" company.
// Horizonte is the only client with the full curated dashboard (panels, budget,
// KPIs, projections, etc). Every other company is QuickBooks-only (Balance Sheet
// and Income Statement) and must never inherit Horizonte's fixed data.

export const HORIZONTE_NAME = "Horizonte Positivo";

export const isHorizonte = (companyName?: string | null): boolean =>
  (companyName ?? "").trim() === HORIZONTE_NAME;
