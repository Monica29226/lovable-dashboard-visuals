// Datos financieros de "Enfoque a la Familia" — cierre a julio 2026.
// Fuente: estados financieros de cierre (balance y estado de resultados comparativos).
// NO proviene de QuickBooks. Para el próximo cierre, actualizar SOLO este archivo.
// Pendiente de recibir: presupuesto acumulado a julio (total y por línea),
// composición del efectivo por instrumento y por moneda al 31 de julio.

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
  /** null = presupuesto pendiente de recibir para el período. */
  budget: number | null;
  unbudgeted?: boolean;
}

export interface BalanceLine {
  label: BiText;
  dec2025: number;
  jul2026: number;
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

export type Tone = "neutral" | "brand" | "green" | "red" | "amber";

export interface FiveCard {
  label: BiText;
  value: number;
  note: BiText;
  featured?: boolean;
}

export interface WaterfallRow {
  label: BiText;
  detail: BiText;
  offsetPct: number;
  widthPct: number;
  value: number;
  tone: Tone;
  emphasis?: "total";
}

export interface TrendRow {
  label: BiText;
  value: number;
  tag: BiText | null;
  strong?: boolean;
}

export interface BulletRow {
  label: BiText;
  detail?: BiText;
  barPct: number;
  markPct: number | null;
  value: number;
  pctLabel: BiText;
  tone: Tone;
  barTone?: Tone;
}

export interface BulletTotal {
  label: BiText;
  detail: BiText;
  value: number;
  pctLabel: BiText;
  tone: Tone;
}

const t = (es: string, en: string): BiText => ({ es, en });


export const enfoqueData = {
  meta: {
    periodBadge: t("Fuente: cierre contable · jul-2026", "Source: closing statements · Jul-2026"),
    currencyNote: t(
      "Acumulado enero–julio 2026 · Montos expresados en colones",
      "Accumulated January–July 2026 · Amounts expressed in colones"
    ),
    annualBudgetBadge: t("Presupuesto anual 124,789,902", "Annual budget 124,789,902"),
    title: t(
      "Dashboard Financiero — Enfoque a la Familia",
      "Financial Dashboard — Focus on the Family"
    ),
    exportPdf: t("Exportar PDF", "Export PDF"),
    printPeriod: t("Acumulado enero–julio 2026", "Accumulated January–July 2026"),
    footer: t(
      "Fuente: estados financieros de cierre de Enfoque (balance y estado de resultados comparativos al 31 de julio de 2026). No proviene de QuickBooks.",
      "Source: Enfoque's closing financial statements (comparative balance sheet and income statement as of 31 July 2026). Not from QuickBooks."
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
    jul2026: t("Jul-2026", "Jul-2026"),
    y2024: t("2024", "2024"),
    y2025: t("2025", "2025"),
    y2026h1: t("2026 · 7 meses", "2026 · 7 months"),
    overBudget: t("Sobre presupuesto", "Over budget"),
    underBudget: t("Bajo presupuesto", "Under budget"),
    onTrack: t("En línea", "On track"),
    notExecuted: t("Sin ejecutar", "Not executed"),
    unbudgeted: t("No presupuestada", "Not budgeted"),
    noBudget: t("Sin presupuesto", "No budget"),
    pendingBudget: t("Pendiente", "Pending"),
    share: t("Participación", "Share"),
  },

  summary: {
    /* 1. Los siete meses en cinco cifras */
    fiveTitle: t("El período en cinco cifras", "The period in five figures"),
    fivePeriod: t("Enero – julio 2026 · en colones", "January – July 2026 · in colones"),
    fiveCards: [
      {
        label: t("Ingresos", "Income"),
        value: 64541273,
        note: t(
          "Presupuesto acumulado a julio pendiente de actualización",
          "Budget to date for July pending update"
        ),
        featured: true,
      },
      {
        label: t("Gastos", "Expenses"),
        value: 68941936,
        note: t(
          "Presupuesto acumulado a julio pendiente de actualización",
          "Budget to date for July pending update"
        ),
      },
      {
        label: t("Resultado del período", "Result for the period"),
        value: -14101522,
        note: t(
          "Operación (4,400,663) · diferencial cambiario (9,700,859)",
          "Operations (4,400,663) · exchange rate difference (9,700,859)"
        ),
      },
      {
        label: t("Efectivo disponible", "Cash available"),
        value: 147187888,
        note: t(
          "62.6 % del activo · cobertura en meses pendiente de actualización",
          "62.6% of assets · months of coverage pending update"
        ),
      },
      {
        label: t("Patrimonio neto", "Net equity"),
        value: 178242834,
        note: t(
          "(14,101,522) en el período · 75.8 % del activo",
          "(14,101,522) in the period · 75.8% of assets"
        ),
      },
    ] as FiveCard[],
    readingCard: t(
      "La operación mejora por tercer año seguido: en siete meses la pérdida operativa es poco más de la mitad de la de todo 2025. Lo que deteriora el resultado es el tipo de cambio, no la gestión.",
      "Operations improve for the third year running: in seven months the operating loss is just over half that of all of 2025. What worsens the result is the exchange rate, not management."
    ),

    /* 2. Cascada */
    waterfall: {
      title: t("Cómo se llega al resultado del período", "How the result for the period comes about"),
      subtitle: t(
        "La pérdida tiene dos componentes que conviene no confundir.",
        "The loss has two components that should not be confused."
      ),
      rows: [
        {
          label: t("Resultado de la operación", "Operating result"),
          detail: t(
            "Ingresos 64,541,273 menos gastos 68,941,936",
            "Income 64,541,273 less expenses 68,941,936"
          ),
          offsetPct: 0,
          widthPct: 29.9,
          value: -4400663,
          tone: "red",
        },
        {
          label: t("Diferencial cambiario", "Exchange rate difference"),
          detail: t(
            "No presupuestado · la mayor parte del efectivo está en dólares",
            "Not budgeted · most of the cash is held in US dollars"
          ),
          offsetPct: 29.9,
          widthPct: 65.8,
          value: -9700859,
          tone: "amber",
        },
        {
          label: t("Resultado neto del período", "Net result for the period"),
          detail: t(
            "Acumulado al 31 de julio de 2026",
            "Accumulated as of 31 July 2026"
          ),
          offsetPct: 0,
          widthPct: 95.7,
          value: -14101522,
          tone: "red",
          emphasis: "total",
        },
      ] as WaterfallRow[],
      note: t(
        "Casi siete de cada diez colones de la pérdida no vienen de la operación: el tipo de cambio explica 9,700,859 de los 14,101,522. La operación viene mejorando tres años seguidos.",
        "Almost seven out of every ten colones of the loss do not come from operations: the exchange rate explains 9,700,859 of the 14,101,522. Operations have been improving for three years running."
      ),
    },

    /* 3. La operación mejora */
    operatingTrend: {
      title: t(
        "La operación mejora, aunque el resultado no lo parezca",
        "Operations are improving, even if the result does not show it"
      ),
      subtitle: t(
        "Pérdida operativa, sin el efecto del tipo de cambio.",
        "Operating loss, excluding the exchange rate effect."
      ),
      rows: [
        {
          label: t("2024 · año completo", "2024 · full year"),
          value: -16914230,
          tag: null,
        },
        {
          label: t("2025 · año completo", "2025 · full year"),
          value: -8075378,
          tag: t("▼ mejora 8,838,852", "▼ improvement 8,838,852"),
        },
        {
          label: t("2026 · siete meses", "2026 · seven months"),
          value: -4400663,
          tag: t("▼ 55 % de la pérdida de todo 2025", "▼ 55% of the full-year 2025 loss"),
          strong: true,
        },
      ] as TrendRow[],
      emptyTag: t("—", "—"),
    },

    /* 4. Ingresos por categoría */
    incomeByCategory: {
      title: t("Ingresos por categoría", "Income by category"),
      subtitle: t(
        "De dónde vienen los 64,541,273 acumulados a julio. El presupuesto acumulado a julio está pendiente de actualización.",
        "Where the 64,541,273 accumulated to July comes from. The budget to date for July is pending update."
      ),
      rows: [
        {
          label: t("Consulta Especializada", "Specialized Consultation"),
          barPct: 100,
          markPct: null,
          value: 55067986,
          pctLabel: t("85.3 %", "85.3%"),
          tone: "neutral",
        },
        {
          label: t("Capacitación", "Training"),
          barPct: 7.2,
          markPct: null,
          value: 3960144,
          pctLabel: t("6.1 %", "6.1%"),
          tone: "neutral",
        },
        {
          label: t("Soporte Focus", "Focus support"),
          barPct: 5.9,
          markPct: null,
          value: 3240750,
          pctLabel: t("5.0 %", "5.0%"),
          tone: "neutral",
        },
        {
          label: t("Ingresos financieros y otros", "Financial and other income"),
          barPct: 3.5,
          markPct: null,
          value: 1947837,
          pctLabel: t("3.0 %", "3.0%"),
          tone: "neutral",
        },
        {
          label: t("Donaciones", "Donations"),
          barPct: 0.6,
          markPct: null,
          value: 324556,
          pctLabel: t("0.5 %", "0.5%"),
          tone: "neutral",
        },
      ] as BulletRow[],
      total: {
        label: t("Total ingresos", "Total income"),
        detail: t(
          "presupuesto acumulado a julio pendiente de actualización",
          "budget to date for July pending update"
        ),
        value: 64541273,
        pctLabel: t("100 %", "100%"),
        tone: "neutral",
      } as BulletTotal,
      legendActual: t("Real acumulado", "Actual to date"),
      legendBudget: t("Presupuesto acumulado", "Budget to date"),
      legendNoBudget: t(
        "Los porcentajes son participación sobre el total, no ejecución presupuestaria",
        "Percentages show share of total, not budget execution"
      ),
      note: t(
        "Ocho y medio de cada diez colones entran por Consulta Especializada. Capacitación aporta 3,960,144 en siete meses, menos de lo que aportó en todo 2025 (13,233,122).",
        "Eight and a half out of every ten colones come in through Specialized Consultation. Training contributes 3,960,144 in seven months, less than it contributed in all of 2025 (13,233,122)."
      ),
    },

    /* 5. Gastos por categoría */
    expenseByCategory: {
      title: t("Gastos por categoría", "Expenses by category"),
      subtitle: t(
        "En qué se van los 68,941,936 acumulados a julio. El presupuesto acumulado a julio está pendiente de actualización.",
        "Where the 68,941,936 accumulated to July goes. The budget to date for July is pending update."
      ),
      rows: [
        {
          label: t("Personal", "Payroll"),
          detail: t("Salarios y cargas sociales", "Salaries and social charges"),
          barPct: 100,
          markPct: null,
          value: 45643972,
          pctLabel: t("66.2 %", "66.2%"),
          tone: "neutral",
        },
        {
          label: t("Servicios profesionales", "Professional services"),
          barPct: 22.0,
          markPct: null,
          value: 10057367,
          pctLabel: t("14.6 %", "14.6%"),
          tone: "neutral",
        },
        {
          label: t("Instalaciones y tecnología", "Facilities and technology"),
          detail: t(
            "Licencias, mantenimiento y servicios públicos",
            "Licenses, maintenance and utilities"
          ),
          barPct: 12.3,
          markPct: null,
          value: 5604631,
          pctLabel: t("8.1 %", "8.1%"),
          tone: "neutral",
        },
        {
          label: t("Viáticos, charlas y eventos", "Travel, talks and events"),
          barPct: 3.3,
          markPct: null,
          value: 1518218,
          pctLabel: t("2.2 %", "2.2%"),
          tone: "neutral",
        },
        {
          label: t("Depreciación", "Depreciation"),
          barPct: 2.8,
          markPct: null,
          value: 1267766,
          pctLabel: t("1.8 %", "1.8%"),
          tone: "neutral",
        },
        {
          label: t("Financieros", "Financial"),
          barPct: 2.6,
          markPct: null,
          value: 1200454,
          pctLabel: t("1.7 %", "1.7%"),
          tone: "neutral",
        },
        {
          label: t("IVA no soportado", "Unsupported VAT"),
          barPct: 1.8,
          markPct: null,
          value: 826439,
          pctLabel: t("1.2 %", "1.2%"),
          tone: "neutral",
        },
        {
          label: t("Otros gastos", "Other expenses"),
          detail: t("Publicidad y siete líneas menores", "Advertising and seven minor lines"),
          barPct: 6.2,
          markPct: null,
          value: 2823091,
          pctLabel: t("4.1 %", "4.1%"),
          tone: "neutral",
        },
      ] as BulletRow[],
      total: {
        label: t("Total gastos", "Total expenses"),
        detail: t(
          "presupuesto acumulado a julio pendiente de actualización",
          "budget to date for July pending update"
        ),
        value: 68941936,
        pctLabel: t("100 %", "100%"),
        tone: "neutral",
      } as BulletTotal,
      note: t(
        "Dos de cada tres colones de gasto son personal: 45,643,972 entre salarios y cargas sociales. La comparación contra presupuesto queda pendiente hasta recibir el presupuesto acumulado a julio.",
        "Two out of every three colones of spending is payroll: 45,643,972 in salaries and social charges. The comparison against budget is pending until the budget to date for July is received."
      ),
    },
  },


  income: {
    note: t(
      "El faltante contra el presupuesto acumulado a julio (7,748,629) está en Capacitación: quedó 12,849,758 por debajo. Consulta Especializada compensó 5,167,986 por encima de lo presupuestado.",
      "The shortfall against the budget to date for July (7,748,629) sits in Training: it came in 12,849,758 below. Specialized Consultation offset 5,167,986 above budget."
    ),
    // Ordenado por tamaño de la desviación contra el presupuesto acumulado.
    lines: [
      {
        label: t("Capacitación", "Training"),
        actual: 3960144,
        budgetToDate: 16809902,
        annualBudget: 31409902,
      },
      {
        label: t("Consulta Especializada", "Specialized Consultation"),
        actual: 55067986,
        budgetToDate: 49900000,
        annualBudget: 83800000,
      },
      {
        label: t("Soporte Focus", "Focus support"),
        actual: 3240750,
        budgetToDate: 3480000,
        annualBudget: 5980000,
      },
      {
        label: t("Ingresos financieros y otros", "Financial and other income"),
        actual: 1947837,
        budgetToDate: 2100000,
        annualBudget: 3600000,
      },
      {
        label: t("Donaciones", "Donations"),
        actual: 324556,
        budgetToDate: null,
        annualBudget: null,
      },
    ] as IncomeLine[],
    total: {
      label: t("TOTAL", "TOTAL"),
      actual: 64541273,
      budgetToDate: 72289902,
      annualBudget: 124789902,
    } as IncomeLine,
    compositionTitle: t("Composición del ingreso", "Income composition"),
    compositionSubtitle: t(
      "Los 64,541,273 acumulados a julio",
      "The 64,541,273 accumulated to July"
    ),
    composition: [
      { label: t("Consulta Especializada", "Specialized Consultation"), value: 55067986, share: 85.3 },
      { label: t("Capacitación", "Training"), value: 3960144, share: 6.1 },
      { label: t("Soporte Focus", "Focus support"), value: 3240750, share: 5.0 },
      { label: t("Ingresos financieros y otros", "Financial and other income"), value: 1947837, share: 3.0 },
      { label: t("Donaciones", "Donations"), value: 324556, share: 0.5 },
    ] as CompositionItem[],
    compositionNote: t(
      "Más de ocho de cada diez colones entran por una sola línea. La concentración sube respecto de 2025, cuando Consulta Especializada representó 74 % del ingreso.",
      "More than eight out of every ten colones come in through a single line. Concentration is higher than in 2025, when Specialized Consultation represented 74% of income."
    ),
  },

  expenses: {
    note: t(
      "Real contra presupuesto acumulado al 31 de julio de 2026. El gasto total cerró en 98 % del presupuesto (68,941,936 contra 70,142,774). Depreciación no tiene presupuesto asignado.",
      "Actual against budget to date as of 31 July 2026. Total spending closed at 98% of budget (68,941,936 against 70,142,774). Depreciation has no assigned budget."
    ),
    lines: [
      { label: t("Servicios profesionales", "Professional services"), actual: 10057367, budget: 11232200 },
      { label: t("Depreciación", "Depreciation"), actual: 1267766, budget: null, unbudgeted: true },
      { label: t("Financieros", "Financial"), actual: 1200454, budget: 1925000 },
      { label: t("Otros gastos", "Other expenses"), actual: 826439, budget: 350000 },
      { label: t("Promoción y publicidad", "Promotion and advertising"), actual: 870843, budget: 1400000 },
      { label: t("Cargas sociales", "Social charges"), actual: 13683616, budget: 13332507 },
      { label: t("Salarios", "Salaries"), actual: 31960356, budget: 32329067 },
      { label: t("Licencias", "Licenses"), actual: 2143433, budget: 1750000 },
      { label: t("Servicios públicos", "Utilities"), actual: 1607557, budget: 1925000 },
      { label: t("Viáticos internacionales", "International travel"), actual: 1518218, budget: 1250000 },
      { label: t("Suministros", "Supplies"), actual: 527520, budget: 700000 },
      { label: t("Viáticos nacionales", "Domestic travel"), actual: 0, budget: 700000 },
      { label: t("Seguros", "Insurance"), actual: 40600, budget: 154000 },
      { label: t("Beneficios (capacitación y paseo)", "Benefits (training and outing)"), actual: 824453, budget: 700000 },
      { label: t("Mantenimiento y seguridad", "Maintenance and security"), actual: 1853641, budget: 1750000 },
      { label: t("Impuestos municipales", "Municipal taxes"), actual: 344788, budget: 400000 },
      { label: t("Donaciones", "Donations"), actual: 150000, budget: 175000 },
      { label: t("Mensajería", "Messaging"), actual: 64887, budget: 70000 },
    ] as ExpenseLine[],
    total: {
      label: t("TOTAL", "TOTAL"),
      actual: 68941936,
      budget: 70142774,
    } as ExpenseLine,
  },

  balance: {
    /* 1. Dónde está el efectivo */
    cashLocation: {
      title: t("Dónde está el efectivo: bancos e inversiones", "Where the cash is: banks and investments"),
      subtitle: t(
        "Total 147,187,888 al 31 de julio de 2026 · 62.6 % del activo",
        "Total 147,187,888 as of 31 July 2026 · 62.6% of assets"
      ),
      centerValue: "85.1 %",
      centerLabel: t("en inversiones", "in investments"),
      investPct: 85.1,
      bankPct: 14.9,
      legend: [
        {
          label: t("Inversiones a plazo", "Term investments"),
          value: 137706308,
          share: 85.1,
        },
        {
          label: t("Cuentas bancarias y cajas", "Bank accounts and cash on hand"),
          value: 24198162,
          share: 14.9,
        },
      ],
      currencyLine: t(
        "Por moneda: dólares 65.4 % · colones 34.6 % (detalle a junio 2026)",
        "By currency: US dollars 65.4% · colones 34.6% (detail as of June 2026)"
      ),
      warning: t(
        "Pendiente de actualización: el desglose entre inversiones, bancos y monedas corresponde al detalle de cuentas de junio 2026, cuyo total (161,904,470) no coincide con el efectivo del balance. El monto del balance al 31 de julio es 147,187,888 y ese es el dato firme; las proporciones son de referencia hasta que contabilidad envíe el detalle de julio.",
        "Pending update: the split between investments, banks and currencies comes from the June 2026 account detail, whose total (161,904,470) does not match the cash on the balance sheet. The balance sheet figure as of 31 July is 147,187,888 and that is the firm number; the proportions are indicative until accounting sends the July detail."
      ),
    },

    /* 2. Patrimonio propio */
    ownEquity: {
      title: t("Patrimonio propio", "Own equity"),
      value: "75.8 %",
      subtitle: t(
        "Del activo está financiado con patrimonio propio · sin deuda bancaria",
        "Of assets is financed with own equity · no bank debt"
      ),
      tag: t("Patrimonio 178,242,834", "Equity 178,242,834"),
      note: t(
        "Bajó 14,101,522 en el período, exactamente la pérdida acumulada a julio.",
        "Down 14,101,522 in the period, exactly the loss accumulated to July."
      ),
    },

    /* 3. Composición del pasivo */
    liabilityComposition: {
      title: t("Composición del pasivo", "Liability composition"),
      subtitle: t(
        "A quién le debe la Asociación. Pasivo total 56,812,564.",
        "Who the Association owes. Total liabilities 56,812,564."
      ),
      rows: [
        {
          label: t("Provisiones laborales", "Labor provisions"),
          detail: t(
            "Aguinaldo, vacaciones y cesantía acumulados con el personal",
            "Christmas bonus, vacation and severance accrued with staff"
          ),
          barPct: 100,
          markPct: null,
          value: 35208052,
          pctLabel: t("62.0 %", "62.0%"),
          tone: "neutral",
        },
        {
          label: t("Cuentas por pagar", "Accounts payable"),
          detail: t(
            "Proveedores y servicios pendientes de pago",
            "Suppliers and services pending payment"
          ),
          barPct: 41.3,
          markPct: null,
          value: 14524529,
          pctLabel: t("25.6 %", "25.6%"),
          tone: "neutral",
        },
        {
          label: t("Retenciones por pagar", "Withholdings payable"),
          detail: t(
            "Retenido a empleados y proveedores, pendiente de enterar",
            "Withheld from employees and suppliers, pending remittance"
          ),
          barPct: 11.1,
          markPct: null,
          value: 3914303,
          pctLabel: t("6.9 %", "6.9%"),
          tone: "neutral",
        },
        {
          label: t("Impuestos por pagar", "Taxes payable"),
          detail: t("IVA y otros tributos pendientes", "VAT and other pending taxes"),
          barPct: 9.0,
          markPct: null,
          value: 3165680,
          pctLabel: t("5.6 %", "5.6%"),
          tone: "neutral",
        },
      ] as BulletRow[],
      total: {
        label: t("Total pasivo", "Total liabilities"),
        detail: t("sin deuda bancaria", "no bank debt"),
        value: 56812564,
        pctLabel: t("100 %", "100%"),
        tone: "neutral",
      } as BulletTotal,
      note: t(
        "El pasivo está concentrado en provisiones laborales: obligación acumulada por aguinaldo, vacaciones y cesantía. No hay deuda bancaria.",
        "Liabilities are concentrated in labor provisions: accrued obligations for Christmas bonus, vacation and severance. There is no bank debt."
      ),
    },

    /* 4. Qué cambió en el período */
    liabilityChange: {
      title: t("Qué cambió en el período", "What changed during the period"),
      subtitle: t(
        "El pasivo creció 7,933,927. De dónde vino ese aumento.",
        "Liabilities grew 7,933,927. Where that increase came from."
      ),
      rows: [
        {
          label: t("Provisiones laborales", "Labor provisions"),
          barPct: 100,
          markPct: null,
          value: 8299998,
          pctLabel: t("105 %", "105%"),
          tone: "red",
          barTone: "amber",
        },
        {
          label: t("Impuestos por pagar", "Taxes payable"),
          barPct: 11.4,
          markPct: null,
          value: 943201,
          pctLabel: t("12 %", "12%"),
          tone: "neutral",
        },
        {
          label: t("Retenciones por pagar", "Withholdings payable"),
          barPct: 0.3,
          markPct: null,
          value: 26914,
          pctLabel: t("0.3 %", "0.3%"),
          tone: "neutral",
        },
        {
          label: t("Cuentas por pagar", "Accounts payable"),
          barPct: 16.1,
          markPct: null,
          value: -1336187,
          pctLabel: t("bajó", "decreased"),
          tone: "green",
          barTone: "green",
        },
      ] as BulletRow[],
      total: {
        label: t("Aumento del pasivo", "Increase in liabilities"),
        detail: t("de 48,878,637 a 56,812,564", "from 48,878,637 to 56,812,564"),
        value: 7933927,
        pctLabel: t("+16 %", "+16%"),
        tone: "amber",
      } as BulletTotal,
      note: t(
        "Todo el aumento del pasivo son provisiones laborales: crecieron 8,299,998 (+31 %) y superan el aumento neto porque las cuentas por pagar bajaron 1,336,187. La Asociación no se endeudó: acumuló obligación con su personal.",
        "The entire increase in liabilities is labor provisions: they grew 8,299,998 (+31%) and exceed the net increase because accounts payable went down 1,336,187. The Association did not take on debt: it accrued obligations with its staff."
      ),
    },

    /* 5. Tabla comparativa de respaldo */
    tableTitle: t(
      "Estado de posición financiera comparativo",
      "Comparative statement of financial position"
    ),
    tableSubtitle: t(
      "El detalle completo, para quien quiera verificar las cifras de arriba.",
      "The full detail, for anyone who wants to verify the figures above."
    ),
    lines: [
      { label: t("Efectivo y equivalentes", "Cash and equivalents"), dec2025: 152726148, jul2026: 147187888 },
      { label: t("Cuentas por cobrar", "Accounts receivable"), dec2025: 0, jul2026: 638430 },
      { label: t("Inventarios de libros", "Book inventory"), dec2025: 0, jul2026: 0 },
      { label: t("Propiedad planta y equipo", "Property, plant and equipment"), dec2025: 88496846, jul2026: 87229080 },
      { label: t("Total activos", "Total assets"), dec2025: 241222993, jul2026: 235055398, emphasis: "total" },
      { label: t("Cuentas por pagar", "Accounts payable"), dec2025: 15860716, jul2026: 14524529 },
      { label: t("Retenciones por pagar", "Withholdings payable"), dec2025: 3887389, jul2026: 3914303 },
      { label: t("Impuestos por pagar", "Taxes payable"), dec2025: 2222479, jul2026: 3165680 },
      { label: t("Provisiones laborales LP", "Long-term labor provisions"), dec2025: 26908054, jul2026: 35208052 },
      { label: t("Total pasivos", "Total liabilities"), dec2025: 48878637, jul2026: 56812564, emphasis: "total" },
      { label: t("Excedentes acumulados", "Accumulated surplus"), dec2025: 201504859, jul2026: 192344356 },
      { label: t("Resultado del período", "Result for the period"), dec2025: -9160503, jul2026: -14101522 },
      { label: t("Patrimonio neto", "Net equity"), dec2025: 192344356, jul2026: 178242834, emphasis: "total" },
    ] as BalanceLine[],
    tableWarning: t(
      "El balance al 31 de julio de 2026 cuadra: activo 235,055,398 igual a pasivo 56,812,564 más patrimonio 178,242,834. Queda pendiente el detalle de efectivo por instrumento y por moneda al corte de julio.",
      "The balance sheet as of 31 July 2026 balances: assets 235,055,398 equal liabilities 56,812,564 plus equity 178,242,834. The cash detail by instrument and by currency as of July is still pending."
    ),
  },


  results: {
    warning: t(
      "La columna 2026 son siete meses (al 31 de julio); 2024 y 2025 son años completos. No debe leerse como una caída.",
      "The 2026 column covers seven months (to 31 July); 2024 and 2025 are full years. It should not be read as a decline."
    ),
    structural: {
      title: t("El cambio estructural de los ingresos", "The structural shift in income"),
      rows: [
        {
          label: t("Capacitación", "Training"),
          y2024: 23861314,
          y2025: 13233122,
          y2026h1: 3960144,
        },
        {
          label: t("Consulta Especializada", "Specialized Consultation"),
          y2024: 64911652,
          y2025: 83165837,
          y2026h1: 55067986,
        },
      ] as ComparativeLine[],
      shareRow: {
        label: t("Peso de Consulta en el total", "Consultation's share of total"),
        y2024: 64,
        y2025: 74,
        y2026h1: 85,
      },
      note: t(
        "Esto no es un mal período, es una tendencia de tres años. Al ritmo de los siete meses, Capacitación cerraría 2026 cerca de 6,788,818 contra los 23,861,314 de 2024.",
        "This is not a bad period, it is a three-year trend. At the seven-month pace, Training would close 2026 near 6,788,818 against 23,861,314 in 2024."
      ),
    },
    incomeTitle: t("Ingresos comparativos", "Comparative income"),
    incomeRows: [
      { label: t("Consulta Especializada", "Specialized Consultation"), y2024: 64911652, y2025: 83165837, y2026h1: 55067986 },
      { label: t("Capacitación", "Training"), y2024: 23861314, y2025: 13233122, y2026h1: 3960144 },
      { label: t("Donación Focus", "Focus donation"), y2024: 6055630, y2025: 6000000, y2026h1: 3240750 },
      { label: t("Ingresos financieros", "Financial income"), y2024: 6207315, y2025: 5131374, y2026h1: null },
      { label: t("Otros ingresos", "Other income"), y2024: null, y2025: null, y2026h1: 1947837 },
      { label: t("Otras donaciones", "Other donations"), y2024: 783360, y2025: 4606715, y2026h1: 324556 },
      { label: t("Libros", "Books"), y2024: 61700, y2025: null, y2026h1: null },
      { label: t("TOTAL", "TOTAL"), y2024: 101880971, y2025: 112137047, y2026h1: 64541273, emphasis: "total" },
    ] as ComparativeLine[],
    incomeWarning: t(
      "Lo que en 2024 y 2025 se llamó Ingresos financieros aparece en 2026 como Otros ingresos. Es la misma plata con otro rótulo — hay que unificar el nombre antes de graficar la tendencia.",
      "What was called Financial income in 2024 and 2025 appears in 2026 as Other income. It is the same money under a different label — the naming must be unified before charting the trend."
    ),
    expenseTitle: t("Gastos comparativos", "Comparative expenses"),
    expenseRows: [
      { label: t("Salarios", "Salaries"), y2024: 50295313, y2025: 53684408, y2026h1: 31960356 },
      { label: t("Cargas sociales", "Social charges"), y2024: 20704997, y2025: 22870651, y2026h1: 13683616 },
      { label: t("Servicios profesionales", "Professional services"), y2024: 22376176, y2025: 17240163, y2026h1: 10057367 },
      { label: t("Publicidad y donación Focus BD", "Advertising and Focus BD donation"), y2024: 1124577, y2025: 3572563, y2026h1: 870843 },
      { label: t("Licencias y mant. local", "Licenses and local maintenance"), y2024: 4848169, y2025: 3363671, y2026h1: 2143433 },
      { label: t("Servicios públicos", "Utilities"), y2024: 3556237, y2025: 3108939, y2026h1: 1607557 },
      { label: t("Viáticos internacionales", "International travel"), y2024: 2511597, y2025: 2851408, y2026h1: null },
      { label: t("Viáticos / charlas y eventos", "Travel / talks and events"), y2024: 1907171, y2025: null, y2026h1: 1518218 },
      { label: t("Depreciación", "Depreciation"), y2024: 3014745, y2025: 2403964, y2026h1: 1267766 },
      { label: t("Mantenimiento y seguridad", "Maintenance and security"), y2024: 2161532, y2025: 2216143, y2026h1: 1853641 },
      { label: t("IVA no soportado", "Unsupported VAT"), y2024: 1377318, y2025: 2160622, y2026h1: 826439 },
      { label: t("Financieros", "Financial"), y2024: 1251461, y2025: 1854120, y2026h1: 1200454 },
      { label: t("Suministros", "Supplies"), y2024: 1064559, y2025: 1804040, y2026h1: 527520 },
      { label: t("Beneficios", "Benefits"), y2024: 753294, y2025: 1182666, y2026h1: 824453 },
      { label: t("Impuestos y multas", "Taxes and fines"), y2024: 644002, y2025: 781758, y2026h1: 344788 },
      { label: t("Venta de activos", "Asset disposal"), y2024: null, y2025: 598348, y2026h1: null },
      { label: t("Donaciones", "Donations"), y2024: 1024000, y2025: 411000, y2026h1: 150000 },
      { label: t("Seguros", "Insurance"), y2024: 34800, y2025: 69600, y2026h1: 40600 },
      { label: t("Transporte y mensajería", "Transport and messaging"), y2024: 83551, y2025: 38361, y2026h1: 64887 },
      { label: t("Libros", "Books"), y2024: 61700, y2025: null, y2026h1: null },
      { label: t("TOTAL", "TOTAL"), y2024: 118795200, y2025: 120212426, y2026h1: 68941936, emphasis: "total" },
    ] as ComparativeLine[],
    expenseWarning: t(
      "Los viáticos se registran en Viáticos internacionales en 2024-2025 y en Viáticos / charlas y eventos en 2026. Sumadas son comparables; separadas, no.",
      "Travel is recorded under International travel in 2024-2025 and under Travel / talks and events in 2026. Added together they are comparable; separately they are not."
    ),
    bridgeTitle: t("De la operación al resultado, tres años", "From operations to result, three years"),
    bridgeRows: [
      { label: t("Ingresos menos gastos", "Income less expenses"), y2024: -16914230, y2025: -8075378, y2026h1: -4400663 },
      { label: t("Diferencial cambiario", "Exchange rate difference"), y2024: -4415477, y2025: -1085124, y2026h1: -9700859 },
      { label: t("Resultado neto", "Net result"), y2024: -21329707, y2025: -9160503, y2026h1: -14101522, emphasis: "total" },
    ] as ComparativeLine[],
    bridgeNote: t(
      "La operación viene mejorando tres años seguidos: la pérdida operativa pasó de 16,914,230 a 8,075,378 y va en 4,400,663 a julio de 2026. Lo que empeoró el resultado fue el tipo de cambio: en siete meses costó 9,700,859, más que 2024 y 2025 juntos (5,500,601).",
      "Operations have improved three years running: the operating loss went from 16,914,230 to 8,075,378 and stands at 4,400,663 through July 2026. What worsened the result was the exchange rate: in seven months it cost 9,700,859, more than 2024 and 2025 combined (5,500,601)."
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
