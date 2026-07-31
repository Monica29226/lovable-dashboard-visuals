// Datos financieros de "Enfoque a la Familia" — cierre a junio 2026.
// Fuente: libro de cierre mensual (hoja B 2 Result y estados comparativos).
// NO proviene de QuickBooks. Para el próximo cierre, actualizar SOLO este archivo.

export type Lang = "ES" | "EN";

export interface BiText {
  es: string;
  en: string;
}

export interface HeadlinePanel {
  label: BiText;
  value: number;
  note: BiText;
}

export interface KpiItem {
  label: BiText;
  value: string;
  note: BiText;
}

export interface MonthlyNetItem {
  month: BiText;
  value: number;
}

export interface IncomeLine {
  label: BiText;
  actual: number;
  budgetToDate: number | null;
  annualBudget: number | null;
}

export interface CompositionItem {
  label: BiText;
  value: number;
  share: number;
}

export interface ExpenseLine {
  label: BiText;
  actual: number;
  budget: number;
  unbudgeted?: boolean;
}

export interface BalanceLine {
  label: BiText;
  dec2025: number;
  jun2026: number;
  emphasis?: "total" | "subtotal";
}

export interface ComparativeLine {
  label: BiText;
  y2024: number | null;
  y2025: number | null;
  y2026h1: number | null;
  emphasis?: "total";
}

export interface FocusFundLine {
  label: BiText;
  value: number;
  emphasis?: "total";
}

const t = (es: string, en: string): BiText => ({ es, en });

export const enfoqueData = {
  meta: {
    periodBadge: t("Fuente: Excel de cierre · jun-2026", "Source: closing workbook · Jun-2026"),
    currencyNote: t("Montos expresados en colones", "Amounts expressed in colones"),
    annualBudgetBadge: t("Presupuesto anual 124,789,902", "Annual budget 124,789,902"),
    title: t(
      "Dashboard Financiero — Enfoque a la Familia",
      "Financial Dashboard — Focus on the Family"
    ),
    exportPdf: t("Exportar PDF", "Export PDF"),
    printPeriod: t("Acumulado enero–junio 2026", "Accumulated January–June 2026"),
    footer: t(
      "Fuente: libro de cierre mensual de Enfoque (hoja B 2 Result y estados comparativos). No proviene de QuickBooks.",
      "Source: Enfoque's monthly closing workbook (sheet B 2 Result and comparative statements). Not from QuickBooks."
    ),

  },

  tabs: {
    summary: t("Resumen", "Summary"),
    income: t("Ingresos", "Income"),
    expenses: t("Gastos", "Expenses"),
    balance: t("Balance", "Balance sheet"),
    results: t("Resultados", "Results"),
  },

  labels: {
    line: t("Línea", "Line"),
    actual: t("Real", "Actual"),
    budget: t("Presupuesto", "Budget"),
    budgetToDate: t("Presupuesto acumulado", "Budget to date"),
    annualBudget: t("Presupuesto anual", "Annual budget"),
    variance: t("Desviación", "Variance"),
    status: t("Estado", "Status"),
    total: t("TOTAL", "TOTAL"),
    account: t("Cuenta", "Account"),
    dec2025: t("Dic-2025", "Dec-2025"),
    jun2026: t("Jun-2026", "Jun-2026"),
    y2024: t("2024", "2024"),
    y2025: t("2025", "2025"),
    y2026h1: t("2026 · 6 meses", "2026 · 6 months"),
    overBudget: t("Sobre presupuesto", "Over budget"),
    underBudget: t("Bajo presupuesto", "Under budget"),
    onTrack: t("En línea", "On track"),
    notExecuted: t("Sin ejecutar", "Not executed"),
    unbudgeted: t("No presupuestada", "Not budgeted"),
    noBudget: t("Sin presupuesto", "No budget"),
    share: t("Participación", "Share"),
  },

  summary: {
    headline: [
      {
        label: t("Resultado de la operación", "Operating result"),
        value: -4510992,
        note: t(
          "Ingresos 54,956,775 menos gastos 59,467,766",
          "Income 54,956,775 less expenses 59,467,766"
        ),
      },
      {
        label: t("Diferencial cambiario", "Exchange rate difference"),
        value: -8894912,
        note: t(
          "No estaba presupuestado. El 65 % del efectivo está en dólares.",
          "Not budgeted. 65% of cash is held in US dollars."
        ),
      },
      {
        label: t("Resultado neto del período", "Net result for the period"),
        value: -13405904,
        note: t(
          "Presupuestado para el semestre: 657,296",
          "Budgeted for the half-year: 657,296"
        ),
      },
    ] as HeadlinePanel[],
    headlineNote: t(
      "Dos tercios de la pérdida no vienen de la operación. El tipo de cambio explica 8,894,912 de los 13,405,904.",
      "Two thirds of the loss does not come from operations. Exchange rates explain 8,894,912 of the 13,405,904."
    ),
    kpis: [
      {
        label: t("Ingresos vs presupuesto", "Income vs budget"),
        value: "91 %",
        note: t("54,956,775 de 60,689,902", "54,956,775 of 60,689,902"),
      },
      {
        label: t("Gastos vs presupuesto", "Expenses vs budget"),
        value: "99 %",
        note: t("59,467,766 de 60,032,606", "59,467,766 of 60,032,606"),
      },
      {
        label: t("Efectivo disponible", "Cash available"),
        value: "146,920,464",
        note: t("≈14.8 meses de operación", "≈14.8 months of operations"),
      },
      {
        label: t("Patrimonio neto", "Net equity"),
        value: "178,938,452",
        note: t("(13,405,904) en el semestre", "(13,405,904) in the half-year"),
      },
    ] as KpiItem[],
    monthlyNetTitle: t("Resultado neto mes a mes", "Net result month by month"),
    monthlyNetNote: t(
      "Junio fue el primer mes con resultado positivo del año.",
      "June was the first month of the year with a positive result."
    ),
    monthlyNet: [
      { month: t("Ene", "Jan"), value: -2388654 },
      { month: t("Feb", "Feb"), value: -3739263 },
      { month: t("Mar", "Mar"), value: -989317 },
      { month: t("Abr", "Apr"), value: -3647109 },
      { month: t("May", "May"), value: -2768206 },
      { month: t("Jun", "Jun"), value: 126645 },
    ] as MonthlyNetItem[],
  },

  income: {
    note: t(
      "El faltante está en una sola línea. Capacitación quedó 9,949,536 por debajo de lo presupuestado — más que el faltante total de ingresos (5,733,127), porque Consulta Especializada compensó 4,256,714.",
      "The shortfall sits in a single line. Training came in 9,949,536 below budget — more than the total income shortfall (5,733,127), because Specialized Consultation offset 4,256,714."
    ),
    // Ordenado por tamaño de la desviación contra el presupuesto acumulado.
    lines: [
      {
        label: t("Capacitación", "Training"),
        actual: 3860366,
        budgetToDate: 13809902,
        annualBudget: 31409902,
      },
      {
        label: t("Consulta Especializada", "Specialized Consultation"),
        actual: 46356714,
        budgetToDate: 42100000,
        annualBudget: 83800000,
      },
      {
        label: t("Donaciones", "Donations"),
        actual: 324556,
        budgetToDate: null,
        annualBudget: null,
      },
      {
        label: t("Ingresos financieros", "Financial income"),
        actual: 1610388,
        budgetToDate: 1800000,
        annualBudget: 3600000,
      },
      {
        label: t("Soporte Focus", "Focus support"),
        actual: 2804750,
        budgetToDate: 2980000,
        annualBudget: 5980000,
      },
    ] as IncomeLine[],
    total: {
      label: t("TOTAL", "TOTAL"),
      actual: 54956775,
      budgetToDate: 60689902,
      annualBudget: 124789902,
    } as IncomeLine,
    compositionTitle: t("Composición del ingreso", "Income composition"),
    compositionSubtitle: t("Los 54,956,775 del semestre", "The 54,956,775 of the half-year"),
    composition: [
      { label: t("Consulta Especializada", "Specialized Consultation"), value: 46356714, share: 84.4 },
      { label: t("Capacitación", "Training"), value: 3860366, share: 7.0 },
      { label: t("Soporte Focus", "Focus support"), value: 2804750, share: 5.1 },
      { label: t("Ingresos financieros", "Financial income"), value: 1610388, share: 2.9 },
      { label: t("Donaciones", "Donations"), value: 324556, share: 0.6 },
    ] as CompositionItem[],
    compositionNote: t(
      "Ocho de cada diez colones entran por una sola línea. Dentro de ella, Administración de Servicios Especialistas aporta 30,797,949 y Psicología 15,558,766.",
      "Eight out of every ten colones come in through a single line. Within it, Specialist Services Administration contributes 30,797,949 and Psychology 15,558,766."
    ),
  },

  expenses: {
    note: t(
      "El gasto no es el problema del semestre: cerró en 99 % del presupuesto.",
      "Spending is not the issue this half-year: it closed at 99% of budget."
    ),
    lines: [
      { label: t("Servicios profesionales", "Professional services"), actual: 8637367, budget: 9627600 },
      { label: t("Viáticos nacionales", "Domestic travel"), actual: 0, budget: 600000 },
      { label: t("Financieros", "Financial"), actual: 974264, budget: 1650000 },
      { label: t("Promoción y publicidad", "Promotion and advertising"), actual: 660168, budget: 1200000 },
      { label: t("Viáticos internacionales", "International travel"), actual: 1576904, budget: 1100000 },
      { label: t("IVA no soportado", "Unsupported VAT"), actual: 731841, budget: 300000 },
      { label: t("Licencias", "Licenses"), actual: 1881234, budget: 1500000 },
      { label: t("Mantenimiento y seguridad", "Maintenance and security"), actual: 1821691, budget: 1500000 },
      { label: t("Cargas sociales", "Social charges"), actual: 11594581, budget: 11376624 },
      { label: t("Salarios", "Salaries"), actual: 27409514, budget: 27586382 },
      { label: t("Servicios públicos", "Utilities"), actual: 1484597, budget: 1650000 },
      { label: t("Depreciación", "Depreciation"), actual: 1089365, budget: 0, unbudgeted: true },
      { label: t("Beneficios", "Benefits"), actual: 557054, budget: 600000 },
      { label: t("Suministros", "Supplies"), actual: 479711, budget: 600000 },
      { label: t("Seguros", "Insurance"), actual: 34800, budget: 132000 },
      { label: t("Mensajería", "Messaging"), actual: 64887, budget: 60000 },
      { label: t("Donaciones", "Donations"), actual: 125000, budget: 150000 },
      { label: t("Impuestos municipales", "Municipal taxes"), actual: 344788, budget: 400000 },
    ] as ExpenseLine[],
    total: {
      label: t("TOTAL", "TOTAL"),
      actual: 59467766,
      budget: 60032606,
    } as ExpenseLine,
  },

  balance: {
    cards: [
      {
        label: t("Total activos", "Total assets"),
        value: 235708638,
        note: t("(5,514,355) vs dic-2025", "(5,514,355) vs Dec-2025"),
      },
      {
        label: t("Total pasivos", "Total liabilities"),
        value: 56770176,
        note: t("7,891,538 más, +16 %", "7,891,538 more, +16%"),
      },
      {
        label: t("Patrimonio neto", "Net equity"),
        value: 178938452,
        note: t("(13,405,904)", "(13,405,904)"),
      },
    ] as HeadlinePanel[],
    tableTitle: t(
      "Estado de posición financiera comparativo",
      "Comparative statement of financial position"
    ),
    lines: [
      { label: t("Efectivo y equivalentes", "Cash and equivalents"), dec2025: 152726148, jun2026: 146920464 },
      { label: t("Cuentas por cobrar", "Accounts receivable"), dec2025: 0, jun2026: 813280 },
      { label: t("Inventarios de libros", "Book inventory"), dec2025: 0, jun2026: 567413 },
      { label: t("Propiedad planta y equipo", "Property, plant and equipment"), dec2025: 88496846, jun2026: 87407480 },
      { label: t("Total activos", "Total assets"), dec2025: 241222993, jun2026: 235708638, emphasis: "total" },
      { label: t("Cuentas por pagar", "Accounts payable"), dec2025: 15860716, jun2026: 15120275 },
      { label: t("Retenciones por pagar", "Withholdings payable"), dec2025: 3887389, jun2026: 3928909 },
      { label: t("Impuestos por pagar", "Taxes payable"), dec2025: 2222479, jun2026: 3235902 },
      { label: t("Provisiones laborales LP", "Long-term labor provisions"), dec2025: 26908054, jun2026: 34485090 },
      { label: t("Total pasivos", "Total liabilities"), dec2025: 48878637, jun2026: 56770176, emphasis: "total" },
      { label: t("Excedentes acumulados", "Accumulated surplus"), dec2025: 201504859, jun2026: 192344356 },
      { label: t("Resultado del período", "Result for the period"), dec2025: -9160503, jun2026: -13405904 },
      { label: t("Patrimonio neto", "Net equity"), dec2025: 192344356, jun2026: 178938452, emphasis: "total" },
    ] as BalanceLine[],
    cash: {
      title: t("Efectivo y su moneda", "Cash and its currency"),
      amount: 146920464,
      changeLabel: t("Bajó 5,805,684 en el semestre", "Down 5,805,684 in the half-year"),
      usdShare: 65,
      crcShare: 35,
      usdLabel: t("Dólares", "US dollars"),
      crcLabel: t("Colones", "Colones"),
      note: t(
        "Con dos tercios del efectivo en dólares, cada movimiento del tipo de cambio pega directo en el resultado: de ahí los 8,894,912 de diferencial cambiario del semestre.",
        "With two thirds of cash held in dollars, every exchange rate move hits the result directly: hence the 8,894,912 exchange difference for the half-year."
      ),
      warning: t(
        "Dato por actualizar — la proporción sale de una hoja cuyo total (161,904,470) no coincide ni con dic-2025 (152,726,148) ni con jun-2026 (146,920,464).",
        "Data pending update — the split comes from a sheet whose total (161,904,470) matches neither Dec-2025 (152,726,148) nor Jun-2026 (146,920,464)."
      ),
    },
    growth: {
      title: t("Lo que más crece del balance", "The fastest growing balance sheet item"),
      label: t("Provisiones laborales LP", "Long-term labor provisions"),
      from: 26908054,
      to: 34485090,
      pct: 28,
      note: t(
        "Crece 7,577,036 en seis meses y explica casi todo el aumento del pasivo.",
        "Grows 7,577,036 in six months and explains almost all of the increase in liabilities."
      ),
    },
    coverage: {
      title: t("Cobertura del efectivo", "Cash coverage"),
      months: 14.8,
      note: t(
        "14.8 meses de operación cubiertos: efectivo 146,920,464 sobre gasto operativo mensual promedio 9,911,294.",
        "14.8 months of operations covered: cash 146,920,464 over average monthly operating expense 9,911,294."
      ),
    },
  },

  results: {
    warning: t(
      "La columna 2026 son seis meses; 2024 y 2025 son años completos. No debe leerse como una caída.",
      "The 2026 column covers six months; 2024 and 2025 are full years. It should not be read as a decline."
    ),
    structural: {
      title: t("El cambio estructural de los ingresos", "The structural shift in income"),
      rows: [
        {
          label: t("Capacitación", "Training"),
          y2024: 23861314,
          y2025: 13233122,
          y2026h1: 3860366,
        },
        {
          label: t("Consulta Especializada", "Specialized Consultation"),
          y2024: 64911652,
          y2025: 83165837,
          y2026h1: 46356714,
        },
      ] as ComparativeLine[],
      shareRow: {
        label: t("Peso de Consulta en el total", "Consultation's share of total"),
        y2024: 64,
        y2025: 74,
        y2026h1: 84,
      },
      note: t(
        "Esto no es un mal semestre, es una tendencia de tres años. Al ritmo actual, Capacitación cerraría 2026 cerca de 7,720,732 contra los 23,861,314 de 2024.",
        "This is not a bad half-year, it is a three-year trend. At the current pace, Training would close 2026 near 7,720,732 against 23,861,314 in 2024."
      ),
    },
    incomeTitle: t("Ingresos comparativos", "Comparative income"),
    incomeRows: [
      { label: t("Consulta Especializada", "Specialized Consultation"), y2024: 64911652, y2025: 83165837, y2026h1: 46356714 },
      { label: t("Capacitación", "Training"), y2024: 23861314, y2025: 13233122, y2026h1: 3860366 },
      { label: t("Donación Focus", "Focus donation"), y2024: 6055630, y2025: 6000000, y2026h1: 2804750 },
      { label: t("Ingresos financieros", "Financial income"), y2024: 6207315, y2025: 5131374, y2026h1: null },
      { label: t("Otros ingresos", "Other income"), y2024: null, y2025: null, y2026h1: 1610388 },
      { label: t("Otras donaciones", "Other donations"), y2024: 783360, y2025: 4606715, y2026h1: 324556 },
      { label: t("Libros", "Books"), y2024: 61700, y2025: null, y2026h1: null },
      { label: t("TOTAL", "TOTAL"), y2024: 101880971, y2025: 112137047, y2026h1: 54956775, emphasis: "total" },
    ] as ComparativeLine[],
    incomeWarning: t(
      "Lo que en 2024 y 2025 se llamó Ingresos financieros aparece en 2026 como Otros ingresos. Es la misma plata con otro rótulo — hay que unificar el nombre antes de graficar la tendencia.",
      "What was called Financial income in 2024 and 2025 appears in 2026 as Other income. It is the same money under a different label — the naming must be unified before charting the trend."
    ),
    expenseTitle: t("Gastos comparativos", "Comparative expenses"),
    expenseRows: [
      { label: t("Salarios", "Salaries"), y2024: 50295313, y2025: 53684408, y2026h1: 27409514 },
      { label: t("Cargas sociales", "Social charges"), y2024: 20704997, y2025: 22870651, y2026h1: 11594581 },
      { label: t("Servicios profesionales", "Professional services"), y2024: 22376176, y2025: 17240163, y2026h1: 8637367 },
      { label: t("Publicidad y donación Focus BD", "Advertising and Focus BD donation"), y2024: 1124577, y2025: 3572563, y2026h1: 660168 },
      { label: t("Licencias y mant. local", "Licenses and local maintenance"), y2024: 4848169, y2025: 3363671, y2026h1: 1881234 },
      { label: t("Servicios públicos", "Utilities"), y2024: 3556237, y2025: 3108939, y2026h1: 1484597 },
      { label: t("Viáticos internacionales", "International travel"), y2024: 2511597, y2025: 2851408, y2026h1: null },
      { label: t("Viáticos / charlas y eventos", "Travel / talks and events"), y2024: 1907171, y2025: null, y2026h1: 1576904 },
      { label: t("Depreciación", "Depreciation"), y2024: 3014745, y2025: 2403964, y2026h1: 1089365 },
      { label: t("Mantenimiento y seguridad", "Maintenance and security"), y2024: 2161532, y2025: 2216143, y2026h1: 1821691 },
      { label: t("IVA no soportado", "Unsupported VAT"), y2024: 1377318, y2025: 2160622, y2026h1: 731841 },
      { label: t("Financieros", "Financial"), y2024: 1251461, y2025: 1854120, y2026h1: 974264 },
      { label: t("Suministros", "Supplies"), y2024: 1064559, y2025: 1804040, y2026h1: 479711 },
      { label: t("Beneficios", "Benefits"), y2024: 753294, y2025: 1182666, y2026h1: 557054 },
      { label: t("Impuestos y multas", "Taxes and fines"), y2024: 644002, y2025: 781758, y2026h1: 344788 },
      { label: t("Venta de activos", "Asset disposal"), y2024: null, y2025: 598348, y2026h1: null },
      { label: t("Donaciones", "Donations"), y2024: 1024000, y2025: 411000, y2026h1: 125000 },
      { label: t("Seguros", "Insurance"), y2024: 34800, y2025: 69600, y2026h1: 34800 },
      { label: t("Transporte y mensajería", "Transport and messaging"), y2024: 83551, y2025: 38361, y2026h1: 64887 },
      { label: t("Libros", "Books"), y2024: 61700, y2025: null, y2026h1: null },
      { label: t("TOTAL", "TOTAL"), y2024: 118795200, y2025: 120212426, y2026h1: 59467766, emphasis: "total" },
    ] as ComparativeLine[],
    expenseWarning: t(
      "Los viáticos se registran en Viáticos internacionales en 2024-2025 y en Viáticos / charlas y eventos en 2026. Sumadas son comparables; separadas, no.",
      "Travel is recorded under International travel in 2024-2025 and under Travel / talks and events in 2026. Added together they are comparable; separately they are not."
    ),
    bridgeTitle: t("De la operación al resultado, tres años", "From operations to result, three years"),
    bridgeRows: [
      { label: t("Ingresos menos gastos", "Income less expenses"), y2024: -16914230, y2025: -8075378, y2026h1: -4510992 },
      { label: t("Diferencial cambiario", "Exchange rate difference"), y2024: -4415477, y2025: -1085124, y2026h1: -8894912 },
      { label: t("Resultado neto", "Net result"), y2024: -21329707, y2025: -9160503, y2026h1: -13405904, emphasis: "total" },
    ] as ComparativeLine[],
    bridgeNote: t(
      "La operación viene mejorando tres años seguidos: la pérdida operativa pasó de 16,914,230 a 8,075,378 y va en 4,510,992 a mitad de 2026. Lo que empeoró el resultado fue el tipo de cambio: en seis meses costó 8,894,912, más que 2024 y 2025 juntos (5,500,601).",
      "Operations have improved three years running: the operating loss went from 16,914,230 to 8,075,378 and stands at 4,510,992 halfway through 2026. What worsened the result was the exchange rate: in six months it cost 8,894,912, more than 2024 and 2025 combined (5,500,601)."
    ),
    focusTitle: t("Fondos administrados de FOCUS", "FOCUS administered funds"),
    focusSubtitle: t("Cuenta 9101 — netean exactamente cero", "Account 9101 — nets exactly zero"),
    focusRows: [
      { label: t("Donaciones FOCUS", "FOCUS donations"), value: 39420573 },
      { label: t("Salarios financiados", "Funded salaries"), value: -28059345 },
      { label: t("Cargas sociales financiadas", "Funded social charges"), value: -7528322 },
      { label: t("Aguinaldo y cesantía", "Christmas bonus and severance"), value: -3832906 },
      { label: t("Efecto neto en el resultado", "Net effect on the result"), value: 0, emphasis: "total" },
    ] as FocusFundLine[],
    focusNote: t(
      "No afectan el resultado, pero son operación que la Asociación administra. Se muestran aparte para no distorsionar el resultado ni subestimar la escala.",
      "They do not affect the result, but they are operations the Association administers. They are shown separately so as not to distort the result nor understate the scale."
    ),
  },
};

export type EnfoqueData = typeof enfoqueData;

export const pick = (text: BiText, language: Lang | "es" | "en"): string =>
  language === "EN" || language === "en" ? text.en : text.es;
