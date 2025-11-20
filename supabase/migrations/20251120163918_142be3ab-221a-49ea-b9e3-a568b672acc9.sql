-- Agregar campo display_order a budget_2026 para mantener el orden del Excel
ALTER TABLE budget_2026 
ADD COLUMN display_order INTEGER;

-- Crear índice para mejorar el rendimiento en consultas ordenadas
CREATE INDEX idx_budget_2026_display_order ON budget_2026(display_order);