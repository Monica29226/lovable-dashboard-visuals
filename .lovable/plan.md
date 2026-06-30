Plan: Migrate Panel 2026 to synced QuickBooks data

## Goal
Make the Panel 2026 dashboard (/panel-2026) for Horizonte Positivo read current financial data from the synced QuickBooks tables (`quickbooks_balance_sheet` and `quickbooks_profit_loss`), store historical 2022-2025 data in the database, and display everything in USD using a per-company exchange rate.

## User decisions
- Scope: Panel 2026 first.
- Historical data: migrate 2022-2025 into a new database table.
- Currency: auto-detect QuickBooks functional currency and convert to USD for display.

## Current state
- `src/pages/Index2026.tsx` and its child components import static data from `src/data/financialData2026.ts`, `src/data/balanceSheetData.ts`, and `src/data/incomeStatementData.ts`.
- `CompanyQuickBooksDashboard` already reads from `quickbooks_balance_sheet` and `quickbooks_profit_loss` for other companies.
- Horizonte Positivo is currently `is_connected = false` in `quickbooks_companies`, the stored token has expired, and the existing synced rows have `total_equity = 0`.
- `quickbooks_companies.moneda_funcional` for Horizonte is `CRC`; the existing static dashboard is in USD.

## Implementation steps

### 1. Restore and verify QuickBooks sync for Horizonte
- Reconnect or refresh the QuickBooks token for Horizonte and set `is_connected = true` once a valid connection is confirmed.
- Debug the balance sync extraction in `quickbooks-sync-balance` so that `total_equity` is correctly captured and stored.
- Run an on-demand sync for Horizonte and confirm the latest rows in `quickbooks_balance_sheet` and `quickbooks_profit_loss` have correct totals.
- No code changes are required if the token can be refreshed; otherwise the OAuth flow will be reused.

### 2. Database schema for historical data and currency conversion
Add a new table `company_financial_history` and two new columns on `quickbooks_companies` for display currency and exchange rate.

```sql
CREATE TABLE public.company_financial_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.quickbooks_companies(id) ON DELETE CASCADE,
  year integer NOT NULL,
  period text NOT NULL,
  report_type text NOT NULL,
  data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_financial_history TO authenticated;
GRANT ALL ON public.company_financial_history TO service_role;
ALTER TABLE public.company_financial_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access history for their companies" ON public.company_financial_history FOR ALL USING (public.user_has_company_access(company_id)) WITH CHECK (public.user_has_company_access(company_id));

ALTER TABLE public.quickbooks_companies
  ADD COLUMN IF NOT EXISTS display_currency text,
  ADD COLUMN IF NOT EXISTS exchange_rate numeric DEFAULT 1;
GRANT UPDATE (display_currency, exchange_rate) ON public.quickbooks_companies TO authenticated;
```

Backfill `company_financial_history` with the 2022-2025 values from `src/data/balanceSheetData.ts` and `src/data/incomeStatementData.ts`, including the historical patrimony, Dec 2024, Dec 2025, and 2025 income statement.

### 3. Currency auto-detection
- Create an edge function `quickbooks-company-info` that calls QuickBooks to read `CurrencyRef` and stores the value in `quickbooks_companies.moneda_funcional`.
- The dashboard will read `moneda_funcional`, `display_currency`, and `exchange_rate` from `quickbooks_companies`.
- Create a `formatCurrency(amount, currencyCode)` helper that formats USD values and, when needed, converts CRC to USD using `exchange_rate`.
- Default `display_currency` for Horizonte to `USD` and set a sensible exchange rate (e.g., 505) until a better source is configured.

### 4. Dashboard data layer
Create two hooks:
- `src/hooks/useCompanyFinancialData.ts`: fetches the latest synced balance and P&L for the selected company, applies the exchange rate, and returns normalized totals.
- `src/hooks/useCompanyFinancialHistory.ts`: fetches the historical series from `company_financial_history` for the selected company.

Both hooks expose the data in the same shape used by the existing static components so child components can be updated minimally.

### 5. Refactor Panel 2026 page and components
- `src/pages/Index2026.tsx`: for Horizonte, use the new hooks and pass the data into `DashboardContent2026`.
- `DashboardContent2026`: accept data props and currency/formatting helpers.
- Update the following components to use props instead of static imports:
  - `KPICards2026`: use synced totals and historical values for growth comparisons.
  - `FinancialPositionChart2026`: use synced balance totals.
  - `IncomeExpensesChart2026`: parse income/expense breakdown from the synced P&L `raw_data` when possible, otherwise fall back to the historical detail table.
  - `BalanceSheet2026`: build the table from the synced balance `raw_data` and append the historical Dec 2025 column from `company_financial_history`.
  - `PatrimonyMovementChart2026`: build the series from `company_financial_history` and append the current synced equity.
- Keep `MembershipCharts2026` unchanged because membership counts are not available in QuickBooks.

### 6. Fallback and UX
- If Horizonte is not connected or has no synced data, display the existing static data with a clear badge and a prompt to sync.
- Add a "Sincronizar ahora" button on the dashboard that invokes `quickbooks-sync-all` and refreshes the dashboard data.

### 7. Validation
- Compare the dashboard totals against the `/sincronizacion-quickbooks` page.
- Verify USD formatting and exchange-rate conversion.
- Confirm historical continuity from 2022 through the latest sync.
- After Panel 2026 is stable, repeat the same conversion for Panel 2025.

## Outcome
Panel 2026 will show live QuickBooks data for the current period, historical data from the database, and consistent USD formatting. Once validated, the same approach can be applied to Panel 2025.