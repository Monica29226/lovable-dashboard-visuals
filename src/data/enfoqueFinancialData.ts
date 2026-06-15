// Datos financieros curados de "Enfoque a la Familia" (base 2022-2025).
// Sirven como respaldo/base del dashboard cuando QuickBooks no está conectado.

export type Lang = "ES" | "EN";

export const getEnfoqueFinancialData = (language: Lang) => {
  const es = language === "ES";

  const financialSummary = {
    accumulatedIncome2025: 75061203,
    accumulatedExpenses2025: 78892097,
    netResult2025: -3830894,
    exchangeDifferential2025: -1705330,
    netResultWithExchange2025: -5536225,
    annualBudget: 78185483,
  };

  const incomeComparison = [
    { year: 2022, income: 121450000, variation: 0 },
    { year: 2023, income: 115200000, variation: -5.1 },
    { year: 2024, income: 101880971, variation: -11.6 },
    { year: 2025, income: 75061203, variation: -26.3, accumulated: true },
  ];

  const expenseComparison = [
    { year: 2022, expenses: 118300000, variation: 0 },
    { year: 2023, expenses: 119850000, variation: 1.3 },
    { year: 2024, expenses: 118795200, variation: -0.9 },
    { year: 2025, expenses: 78892097, variation: -33.6, accumulated: true },
  ];

  const incomeDetail2025 = [
    { concept: es ? "Donación Focus" : "Focus Donation", amount: 4000000, budget: 6055630 },
    { concept: es ? "Capacitación" : "Training", amount: 10009048, budget: 23861314 },
    { concept: es ? "Consulta Especializada" : "Specialized Consultation", amount: 57423967, budget: 64911652 },
    { concept: es ? "Otras Donaciones" : "Other Donations", amount: 0, budget: 783360 },
    { concept: es ? "Libros" : "Books", amount: 0, budget: 61700 },
    { concept: es ? "Ingresos Financieros" : "Financial Income", amount: 3628188, budget: 6207315 },
  ];

  const expenseDetail2025 = [
    { concept: es ? "Salarios" : "Salaries", amount: 35656589, budget: 50295313 },
    { concept: es ? "Cargas Sociales" : "Social Charges", amount: 14953993, budget: 20104990 },
    { concept: es ? "Servicios Profesionales" : "Professional Services", amount: 11410163, budget: 22376176 },
    { concept: es ? "Beneficios" : "Benefits", amount: 371249, budget: 753294 },
    { concept: es ? "Suministros" : "Supplies", amount: 603100, budget: 1064559 },
    { concept: es ? "Servicios Públicos" : "Public Services", amount: 713938, budget: 336237 },
    { concept: es ? "Seguros" : "Insurance", amount: 46400, budget: 34800 },
    { concept: es ? "Viáticos Internacionales" : "International Travel", amount: 2471077, budget: 2511597 },
    { concept: es ? "Transporte, Mensajería" : "Transport, Messaging", amount: 50561, budget: 83551 },
    { concept: es ? "Publicidad, donación Focus BD" : "Advertising, Focus BD donation", amount: 3150636, budget: 1112571 },
    { concept: es ? "Mantenimiento y Seguridad" : "Maintenance and Security", amount: 375466, budget: 2161532 },
    { concept: es ? "Donaciones" : "Donations", amount: 311000, budget: 1024060 },
    { concept: es ? "Impuestos y Multas" : "Taxes and Fines", amount: 623500, budget: 644002 },
    { concept: es ? "Licencias y Mant. Local" : "Licenses and Local Maint.", amount: 2623250, budget: 3848169 },
    { concept: es ? "Financieros" : "Financial", amount: 1247268, budget: 1251461 },
    { concept: es ? "Depreciación" : "Depreciation", amount: 2999350, budget: 3814745 },
    { concept: es ? "IVA No Soportado" : "Unsupported VAT", amount: 691880, budget: 1377318 },
  ];

  const budgetExecution = [
    { concept: es ? "Ingresos" : "Income", budgeted: 78185483, real: 75061203, executed: 96.0 },
    { concept: es ? "Gastos" : "Expenses", budgeted: 79572588, real: 78892097, executed: 99.1 },
  ];

  const financialPosition = {
    totalAssets: 243792598,
    totalLiabilities: 47823965,
    netEquity: 195968634,
  };

  const resultsAnalysis = [
    { year: 2022, income: 121450000, expenses: 118300000, netResult: 3150000, margin: 2.6, status: "surplus" },
    { year: 2023, income: 115200000, expenses: 119850000, netResult: -4650000, margin: -4.0, status: "deficit" },
    { year: 2024, income: 101880971, expenses: 118795200, netResult: -21329707, margin: -20.9, status: "deficit" },
    { year: 2025, income: 75061203, expenses: 78892097, netResult: -5536225, margin: -7.4, status: "deficit", accumulated: true },
  ];

  const chartData = incomeComparison
    .filter((item) => !item.accumulated)
    .map((item, index) => ({
      year: item.year,
      income: item.income,
      expenses: expenseComparison[index]?.expenses || 0,
    }));

  const kpis = [
    { label: es ? "Dependencia de Ingresos de Consulta" : "Consultation Income Dependency", value: "76%" },
    { label: es ? "Ratio de Eficiencia (Gastos/Ingresos)" : "Efficiency Ratio (Expenses/Income)", value: "105%" },
    { label: es ? "Variación Ingresos 2024-2025" : "Income Variation 2024-2025", value: "-26%" },
    { label: es ? "Exceso en Publicidad" : "Advertising Excess", value: "388%" },
  ];

  const okrs = [
    {
      objective: es ? "Mejorar sostenibilidad financiera" : "Improve financial sustainability",
      keyResult: es ? "Reducir gastos en 15%" : "Reduce expenses by 15%",
    },
    {
      objective: es ? "Diversificar ingresos" : "Diversify income",
      keyResult: es ? "Aumentar 20% ingresos en capacitación" : "Increase training income by 20%",
    },
    {
      objective: es ? "Optimizar eficiencia operativa" : "Optimize operational efficiency",
      keyResult: es ? "Mantener ratio gastos/ingresos ≤ 95%" : "Maintain expense/income ratio ≤ 95%",
    },
  ];

  return {
    financialSummary,
    incomeComparison,
    expenseComparison,
    incomeDetail2025,
    expenseDetail2025,
    budgetExecution,
    financialPosition,
    resultsAnalysis,
    chartData,
    kpis,
    okrs,
  };
};
