// Diccionario de traducción del Panel 2026 (ES -> EN).
// Se usa junto con useLanguage() para que el botón ES | EN traduzca todo el panel.

const DICTIONARY: Record<string, string> = {
  // Encabezados de página / pestañas
  "Panel Financiero 2026": "2026 Financial Dashboard",
  "Asociación Horizonte Positivo": "Asociación Horizonte Positivo",
  "Estado de Posición Financiera": "Statement of Financial Position",
  "Estado de Resultados": "Income Statement",
  "Presupuesto vs. Real": "Budget vs. Actual",
  "ER Proyección": "Projected Income Statement",
  "Indicadores (KPIs)": "Key Indicators (KPIs)",

  // Balance
  "Valores en US$": "Amounts in US$",
  "Comparativo": "Comparison",
  "Diciembre 2025": "December 2025",
  "ACTIVOS": "ASSETS",
  "PASIVOS": "LIABILITIES",
  "TOTAL ACTIVOS": "TOTAL ASSETS",
  "TOTAL PASIVO Y PATRIMONIO": "TOTAL LIABILITIES AND EQUITY",
  "Patrimonio Neto": "Equity",
  "Cuenta Colones Bac San Jose": "Colones Account - BAC San José",
  "Cuenta Dólares Bac San Jose": "US Dollar Account - BAC San José",
  "Caja General": "Petty Cash",
  "Total Caja y Bancos": "Total Cash and Banks",
  "Cuentas por Cobrar": "Accounts Receivable",
  "Cuenta por Cobrar BNCR": "Accounts Receivable BNCR",
  "Otras Cuentas por Cobrar": "Other Accounts Receivable",
  "Total Cuenta por cobrar": "Total Accounts Receivable",
  "Impuesto de Renta Diferido": "Deferred Income Tax",
  "Anticipo de Renta": "Prepaid Income Tax",
  "Total Activo Corriente": "Total Current Assets",
  "Mobiliario y Equipo": "Furniture and Equipment",
  "Equipo de Cómputo": "Computer Equipment",
  "Depreciación Acumulada": "Accumulated Depreciation",
  "Total Activo Fijo": "Total Fixed Assets",
  "Cuentas por Pagar": "Accounts Payable",
  "Impuestos por Pagar (IVA)": "Taxes Payable (VAT)",
  "Impuesto de Renta": "Income Tax",
  "Gastos Acumulados por Pagar": "Accrued Expenses Payable",
  "Otras cuentas por pagar": "Other Accounts Payable",
  "Total Pasivo Corriente": "Total Current Liabilities",
  "Total Pasivo": "Total Liabilities",
  "Resultados Acumulados": "Retained Earnings",
  "Ajuste por traducción": "Translation Adjustment",
  "Ingresos menos Gastos, del año": "Income less Expenses, for the year",
  "Total Patrimonio Neto": "Total Equity",

  // Posición financiera / patrimonio
  "Posición Financiera": "Financial Position",
  "Distribución por categorías principales (US$)": "Breakdown by main categories (US$)",
  "Activos": "Assets",
  "Pasivos": "Liabilities",
  "Patrimonio": "Equity",
  "Movimiento del Patrimonio": "Equity Movement",
  "Evolución del patrimonio neto": "Net equity trend",
  "Crecimiento Total": "Total Growth",
  "Período": "Period",

  // Estado de resultados
  "Estado de Resultados 2026": "2026 Income Statement",
  "Ingresos vs Egresos": "Income vs Expenses",
  "Resumen Detallado": "Detailed Summary",
  "Detalle:": "Detail:",
  "Ingresos": "Income",
  "Egresos": "Expenses",
  "Resultado Neto": "Net Result",
  "Ingresos menos Gastos": "Income less Expenses",
  "Ingresos menos Egresos": "Income less Expenses",
  "Total ingresos": "Total income",
  "Total egresos": "Total expenses",

  // Partidas
  "Cuotas Asociados": "Member Fees",
  "Comunidad": "Community",
  "Membresía": "Membership",
  "Ingreso Renta Diferido": "Deferred Income Tax Revenue",
  "Ingreso por impuesto sobre la renta diferido": "Deferred income tax revenue",
  "Otros": "Other",
  "Personal": "Personnel",
  "Gastos administrativos": "Administrative expenses",
  "Gastos Administrativos": "Administrative Expenses",
  "Viáticos": "Travel expenses",
  "Viáticos y Giras": "Travel and Field Visits",
  "Representación": "Representation",
  "Comunicación y Mercadeo": "Communication and Marketing",
  "Eventos": "Events",
  "Servicios Profesionales": "Professional Services",
  "Tecnología": "Technology",
  "Impuestos": "Taxes",
  "Otros Gastos": "Other Expenses",
  "Otros Gastos / Patente / IVA": "Other Expenses / License / VAT",
  "Depreciación": "Depreciation",

  // KPIs
  "Acumulado a": "Accumulated through",
  "del presupuesto acumulado": "of the accumulated budget",
  "Resultado positivo": "Positive result",
  "Pérdida": "Loss",
  "Crecimiento Patrimonio": "Equity Growth",
  "Razón de Liquidez": "Liquidity Ratio",
  "Activo Cte / Pasivo Cte": "Current Assets / Current Liabilities",
  "Excelente liquidez": "Excellent liquidity",
  "Liquidez adecuada": "Adequate liquidity",
  "Variación Activos": "Assets Change",
  "Dic 2025": "Dec 2025",

  // Presupuesto vs real
  "Presupuesto vs. Real — 2026": "Budget vs. Actual — 2026",
  "Cuadro de referencia (no en tiempo real)": "Reference table (not real time)",
  "Cuenta": "Account",
  "Presupuesto Total Anual": "Total Annual Budget",
  "Proyección Diciembre": "December Projection",
  "Acum. Real": "Actual Accum.",
  "Presupuesto": "Budget",
  "Acumulado": "Accumulated",
  "Variación": "Variance",
  "Pendiente Ejecución": "Pending Execution",
  "% Avance": "% Progress",
  "INGRESOS": "INCOME",
  "EGRESOS": "EXPENSES",

  // Proyección
  "Estado de Resultados con Proyección — 2026": "Income Statement with Projection — 2026",
  "Real": "Actual",
  "Proyección": "Projection",
  "Detalle mensual": "Monthly detail",
  "Total Jul-Dic": "Total Jul-Dec",
  "Total Ago-Dic": "Total Aug-Dec",
  "Total Proyección": "Total Projection",
  "Presup. Original": "Original Budget",
  "Colapsar meses de": "Collapse months of",
  "Expandir meses de": "Expand months of",

  // KPIs / membresías
  "Asociados": "Members",
  "Contratos": "Contracts",
  "Distribución de asociados": "Members breakdown",
  "Distribución de contratos": "Contracts breakdown",
  "Total": "Total",
  "Empresas": "Companies",
  "Pago completo": "Paid in full",
  "Gestión de cobro": "In collection",
  "Sin facturar": "Not invoiced",
  "Detenido": "On hold",
  "Facturado": "Invoiced",
  "facturado": "invoiced",
  "En curso": "In progress",
  "Listo": "Done",
  "Por iniciar proceso": "Process not started",
};

const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Setiembre", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const MONTHS_EN: Record<string, string> = {
  Enero: "January", Febrero: "February", Marzo: "March", Abril: "April",
  Mayo: "May", Junio: "June", Julio: "July", Agosto: "August",
  Setiembre: "September", Septiembre: "September", Octubre: "October",
  Noviembre: "November", Diciembre: "December",
};

const MONTHS_SHORT_EN: Record<string, string> = {
  Ene: "Jan", Feb: "Feb", Mar: "Mar", Abr: "Apr", May: "May", Jun: "Jun",
  Jul: "Jul", Ago: "Aug", Set: "Sep", Sep: "Sep", Oct: "Oct", Nov: "Nov", Dic: "Dec",
};

export type PanelLanguage = "es" | "en";

/** Traduce una etiqueta del panel. Si no hay traducción, devuelve el original. */
export const tr = (text: string, language: PanelLanguage): string => {
  if (language === "es") return text;
  if (DICTIONARY[text]) return DICTIONARY[text];

  // Períodos tipo "Julio 2026"
  const monthYear = text.match(/^([A-Za-zÁÉÍÓÚáéíóú]+)\s+(\d{4})$/);
  if (monthYear && MONTHS_EN[monthYear[1]]) {
    return `${MONTHS_EN[monthYear[1]]} ${monthYear[2]}`;
  }

  // Meses sueltos y rangos abreviados ("Ene–Jun", "Jul–Dic")
  if (MONTHS_ES.includes(text)) return MONTHS_EN[text];
  const range = text.match(/^([A-Za-zÁÉÍÓÚáéíóú]{3})[–-]([A-Za-zÁÉÍÓÚáéíóú]{3})$/);
  if (range && MONTHS_SHORT_EN[range[1]] && MONTHS_SHORT_EN[range[2]]) {
    return `${MONTHS_SHORT_EN[range[1]]}–${MONTHS_SHORT_EN[range[2]]}`;
  }

  return text;
};

/** Devuelve solo el mes de un período tipo "Julio 2026". */
export const trMonthOnly = (period: string, language: PanelLanguage): string =>
  tr(period.split(" ")[0], language);
