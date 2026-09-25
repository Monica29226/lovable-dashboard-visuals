-- Muestra "Resultados por Proyecto" (P&L por Clases de QuickBooks) solo en las
-- empresas que llevan proyectos por Clase. Aplicada en producción el 2026-09-25.
alter table public.quickbooks_companies add column if not exists uses_projects boolean not null default false;
comment on column public.quickbooks_companies.uses_projects is 'Muestra "Resultados por Proyecto" (P&L por Clases de QuickBooks) para esta empresa.';
