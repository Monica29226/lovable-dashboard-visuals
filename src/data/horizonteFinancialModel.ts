import { balanceSheetData, historicalPatrimony } from "@/data/balanceSheetData";
import { financialData2026 } from "@/data/financialData2026";
import { incomeStatementData } from "@/data/incomeStatementData";

export type FinancialPeriodKey = "2023" | "2024" | "2025" | "2026-ytd";

export interface HorizonteStatementDetail {
  income: {
    cuotasAsociados?: number;
    membresia?: number;
    comunidad?: number;
    ingresoRentaDiferido?: number;
    otros?: number;
    total: number;
  };
  expenses: {
    personal?: number;
    gastosAdministrativos?: number;
    viaticos?: number;
    viaticosGiras?: number;
    comunicacionEventos?: number;
    comunicacionMercadeo?: number;
    serviciosProfesionales?: number;
    tecnologia?: number;
    otrosGastosPatente?: number;
    otrosGastosPatenteIVA?: number;
    impuestoRenta?: number;
    total: number;
  };
}

export interface StatementSummary {
  label: string;
  period: string;
  periodEn: string;
  income: number;
  expenses: number;
  netResult: number;
  detail?: HorizonteStatementDetail;
}

export const formatUsd = (value: number, digits = 0): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);

const horizonteStatements: Record<FinancialPeriodKey, StatementSummary> = {
  "2023": {
    label: "2023",
    period: "Enero-Diciembre 2023",
    periodEn: "January-December 2023",
    income: 389430,
    expenses: 349004,
    netResult: 40426,
  },
  "2024": {
    label: "2024",
    period: "Enero-Diciembre 2024",
    periodEn: "January-December 2024",
    income: 314914,
    expenses: 209661,
    netResult: 105253,
  },
  "2025": {
    label: "2025",
    period: incomeStatementData.period,
    periodEn: incomeStatementData.periodEn,
    income: incomeStatementData.income.total,
    expenses: incomeStatementData.expenses.total,
    netResult: incomeStatementData.income.total - incomeStatementData.expenses.total,
    detail: incomeStatementData,
  },
  "2026-ytd": {
    label: "2026",
    period: financialData2026.period,
    periodEn: financialData2026.periodEn,
    income: financialData2026.incomeStatement.income.total,
    expenses: financialData2026.incomeStatement.expenses.total,
    netResult: financialData2026.incomeStatement.netResult,
    detail: financialData2026.incomeStatement,
  },
};

export const horizonteFinancials = {
  companyName: "Asociación Horizonte Positivo",
  currency: "USD",
  statements: horizonteStatements,
  balanceSheets: {
    "2024": {
      label: "Diciembre 2024",
      assets: {
        current: balanceSheetData.assets.current.dec2024,
        nonCurrent: balanceSheetData.assets.nonCurrent.dec2024,
        total: balanceSheetData.assets.nonCurrent.dec2024.totalAssets,
      },
      liabilities: {
        current: balanceSheetData.liabilities.current.dec2024,
        total: balanceSheetData.liabilities.current.dec2024.totalLiabilities,
      },
      equity: balanceSheetData.equity.dec2024,
    },
    "2025": {
      label: "Diciembre 2025",
      assets: {
        current: balanceSheetData.assets.current.dec2025,
        nonCurrent: balanceSheetData.assets.nonCurrent.dec2025,
        total: balanceSheetData.assets.nonCurrent.dec2025.totalAssets,
      },
      liabilities: {
        current: balanceSheetData.liabilities.current.dec2025,
        total: balanceSheetData.liabilities.current.dec2025.totalLiabilities,
      },
      equity: balanceSheetData.equity.dec2025,
    },
    "2026-ytd": {
      label: financialData2026.period,
      assets: {
        current: financialData2026.balanceSheet.assets.current,
        nonCurrent: financialData2026.balanceSheet.assets.nonCurrent,
        total: financialData2026.balanceSheet.assets.totalAssets,
      },
      liabilities: {
        current: financialData2026.balanceSheet.liabilities,
        total: financialData2026.balanceSheet.liabilities.totalLiabilities,
      },
      equity: financialData2026.balanceSheet.equity,
    },
  },
  budget2025: {
    income: [
      { name: "Cuotas Asociados", budget: 250650, actual: incomeStatementData.income.cuotasAsociados },
      { name: "Membresía", budget: 262059, actual: incomeStatementData.income.membresia },
      { name: "Ingreso Renta Diferido", budget: 0, actual: incomeStatementData.income.ingresoRentaDiferido },
    ],
    expenses: [
      { name: "Personal", budget: 255710, actual: incomeStatementData.expenses.personal },
      { name: "Gastos administrativos", budget: 14493, actual: incomeStatementData.expenses.gastosAdministrativos },
      { name: "Viáticos", budget: 26400, actual: incomeStatementData.expenses.viaticos },
      { name: "Comunicación y Mercadeo", budget: 15035, actual: incomeStatementData.expenses.comunicacionEventos },
      { name: "Servicios Profesionales", budget: 18624, actual: incomeStatementData.expenses.serviciosProfesionales },
      { name: "Tecnología", budget: 20416, actual: incomeStatementData.expenses.tecnologia },
      { name: "Otros Gastos / Patente / IVA", budget: 2400, actual: incomeStatementData.expenses.otrosGastosPatenteIVA },
      { name: "Impuesto de Renta", budget: 0, actual: incomeStatementData.expenses.impuestoRenta },
      { name: "Depreciación", budget: 0, actual: 0 },
    ],
  },
  patrimonyHistory: historicalPatrimony,
};

export const getBudget2025Totals = () => {
  const incomeBudget = horizonteFinancials.budget2025.income.reduce((sum, item) => sum + item.budget, 0);
  const incomeActual = horizonteFinancials.budget2025.income.reduce((sum, item) => sum + item.actual, 0);
  const expensesBudget = horizonteFinancials.budget2025.expenses.reduce((sum, item) => sum + item.budget, 0);
  const expensesActual = horizonteFinancials.budget2025.expenses.reduce((sum, item) => sum + item.actual, 0);

  return {
    incomeBudget,
    incomeActual,
    expensesBudget,
    expensesActual,
    netBudget: incomeBudget - expensesBudget,
    netActual: incomeActual - expensesActual,
  };
};

export const getStatementChartData = (period: FinancialPeriodKey) => {
  const statement = horizonteFinancials.statements[period];
  const detail = statement.detail;

  if (!detail) {
    return [];
  }

  const { income, expenses } = detail;

  return [
    {
      category: "Ingresos",
      categoryEn: "Income",
      amount: statement.income,
      color: "hsl(207, 100%, 28%)",
      details: [
        { name: "Cuotas Asociados", amount: income.cuotasAsociados ?? 0 },
        { name: period === "2026-ytd" ? "Comunidad" : "Membresía", amount: income.comunidad ?? income.membresia ?? 0 },
        { name: "Ingreso Renta Diferido", amount: income.ingresoRentaDiferido ?? 0 },
      ],
    },
    {
      category: "Egresos",
      categoryEn: "Expenses",
      amount: statement.expenses,
      color: "hsl(45, 98%, 59%)",
      details: [
        { name: "Personal", amount: expenses.personal ?? 0 },
        { name: "Gastos Administrativos", amount: expenses.gastosAdministrativos ?? 0 },
        { name: "Viáticos y Giras", amount: expenses.viaticosGiras ?? expenses.viaticos ?? 0 },
        { name: "Comunicación y Mercadeo", amount: expenses.comunicacionMercadeo ?? expenses.comunicacionEventos ?? 0 },
        { name: "Servicios Profesionales", amount: expenses.serviciosProfesionales ?? 0 },
        { name: "Tecnología", amount: expenses.tecnologia ?? 0 },
        { name: "Otros Gastos / Patente / IVA", amount: expenses.otrosGastosPatente ?? expenses.otrosGastosPatenteIVA ?? 0 },
        { name: "Impuesto de Renta", amount: expenses.impuestoRenta ?? 0 },
      ],
    },
  ];
};
