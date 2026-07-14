export type OperationalCompanyKind = "raci" | "dento";

export interface RaciPayrollMonth {
  month: string;
  salary: number;
  ccss: number;
  aguinaldo: number;
  employees: number;
}

export interface DentoRevenueMonth {
  month: string;
  datafono: number;
  accountingIncome: number;
  rentWithholding: number;
  commission: number;
}

export const rentTax2026 = {
  sourceUrl: "https://www.hacienda.go.cr/docs/TramosRenta2026.pdf",
  salaryMonthly: [
    { from: 0, to: 918000, rate: 0 },
    { from: 918000, to: 1347000, rate: 0.1 },
    { from: 1347000, to: 2364000, rate: 0.15 },
    { from: 2364000, to: 4727000, rate: 0.2 },
    { from: 4727000, to: null, rate: 0.25 },
  ],
  salaryCredits: {
    child: 1710,
    spouse: 2590,
  },
  individualAnnual: [
    { from: 0, to: 6244000, rate: 0 },
    { from: 6244000, to: 8329000, rate: 0.1 },
    { from: 8329000, to: 10414000, rate: 0.15 },
    { from: 10414000, to: 20872000, rate: 0.2 },
    { from: 20872000, to: null, rate: 0.25 },
  ],
  smallLegalEntityGrossLimit: 119174000,
  smallLegalEntityAnnual: [
    { from: 0, to: 5621000, rate: 0.05 },
    { from: 5621000, to: 8433000, rate: 0.1 },
    { from: 8433000, to: 11243000, rate: 0.15 },
    { from: 11243000, to: null, rate: 0.2 },
  ],
};

export const raciPayrollData: RaciPayrollMonth[] = [
  { month: "Ene 2025", salary: 5155854.4, ccss: 1925196.03, aguinaldo: 429482.67, employees: 5 },
  { month: "Feb 2025", salary: 5150534.4, ccss: 1923209.54, aguinaldo: 429039.52, employees: 5 },
  { month: "Mar 2025", salary: 5115262.8, ccss: 1910042, aguinaldo: 426101.39, employees: 5 },
  { month: "Abr 2025", salary: 5312568.2, ccss: 1910042, aguinaldo: 442536.93, employees: 5 },
  { month: "May 2025", salary: 3584372.99, ccss: 1983715, aguinaldo: 298578.27, employees: 4 },
  { month: "Jun 2025", salary: 3578734.5, ccss: 1284643, aguinaldo: 298108.58, employees: 4 },
  { month: "Jul 2025", salary: 3577906.47, ccss: 1282324, aguinaldo: 298039.61, employees: 4 },
  { month: "Ago 2025", salary: 4942359.06, ccss: 1282324, aguinaldo: 411698.51, employees: 5 },
  { month: "Set 2025", salary: 5742754.45, ccss: 1531592.61, aguinaldo: 478371.45, employees: 6 },
  { month: "Oct 2025", salary: 5883186.25, ccss: 1569045.77, aguinaldo: 490069.41, employees: 5 },
  { month: "Nov 2025", salary: 6533186.25, ccss: 1569047.03, aguinaldo: 544214.41, employees: 5 },
  { month: "Dic 2025", salary: 6133186.25, ccss: 1569047.03, aguinaldo: 510894.41, employees: 5 },
  { month: "Ene 2026", salary: 6133186.25, ccss: 1635722.03, aguinaldo: 510894.41, employees: 5 },
  { month: "Feb 2026", salary: 4533186.25, ccss: 1645534.93, aguinaldo: 377614.41, employees: 4 },
  { month: "Mar 2026", salary: 4533186.25, ccss: 1639201, aguinaldo: 377614.41, employees: 4 },
  { month: "Abr 2026", salary: 4533186.25, ccss: 1639201, aguinaldo: 377614.41, employees: 4 },
  { month: "May 2026", salary: 4493841.15, ccss: 1639201, aguinaldo: 374336.97, employees: 4 },
];

export const raciEmployeeSample = [
  { name: "Sergio Fernandez Vindas", salary: 2600000, spouse: 0, children: 0 },
  { name: "Sergio Valenciano Quesada", salary: 899841.15, spouse: 0, children: 0 },
  { name: "Dimitris Cristofileas A.", salary: 594000, spouse: 0, children: 0 },
  { name: "Marcella Artavia Cuadra", salary: 400000, spouse: 0, children: 0 },
];

export const dentoRevenueData: DentoRevenueMonth[] = [
  { month: "Ene 2022", datafono: 26267699, accountingIncome: 36756603, rentWithholding: 462315, commission: 656674 },
  { month: "Feb 2022", datafono: 31926866, accountingIncome: 27572042, rentWithholding: 561920, commission: 798162 },
  { month: "Mar 2022", datafono: 39434240, accountingIncome: 43059830.24, rentWithholding: 694045, commission: 936548 },
  { month: "Abr 2022", datafono: 23620063, accountingIncome: 19665633.43, rentWithholding: 415721, commission: 552052 },
  { month: "May 2022", datafono: 36537200, accountingIncome: 30259096, rentWithholding: 643056, commission: 847433 },
  { month: "Jun 2022", datafono: 34148667, accountingIncome: 37159805.82, rentWithholding: 601017, commission: 768676 },
  { month: "Jul 2022", datafono: 19363265, accountingIncome: 15215703.36, rentWithholding: 340796, commission: 435653 },
  { month: "Ago 2022", datafono: 23732524, accountingIncome: 20020179.4, rentWithholding: 417696, commission: 564087 },
  { month: "Set 2022", datafono: 17883278, accountingIncome: 9351941.54, rentWithholding: 314742, commission: 403024 },
  { month: "Oct 2022", datafono: 21682810, accountingIncome: 20966695.14, rentWithholding: 381620, commission: 508155 },
  { month: "Nov 2022", datafono: 23588388, accountingIncome: 25829530.9, rentWithholding: 415158, commission: 598618 },
];

export const dentoIncomeStatement = {
  decemberAccountingIncome: 16798574.69,
  incomeJanNov: 285857060.83,
  annualAccountingIncome: 302655635.52,
  expensesJanNov: 181428965.05,
  netOrdinaryIncomeJanNov: 104428095.78,
  netIncomeJanNov: 97095101.28,
};

export const calculateProgressiveTax = (
  base: number,
  brackets: { from: number; to: number | null; rate: number }[],
) =>
  Math.max(0, brackets.reduce((tax, bracket) => {
    const top = bracket.to ?? base;
    const taxable = Math.max(0, Math.min(base, top) - bracket.from);
    return tax + taxable * bracket.rate;
  }, 0));

export const calculateSalaryTax2026 = (salary: number, spouse = 0, children = 0) => {
  const taxBeforeCredits = calculateProgressiveTax(salary, rentTax2026.salaryMonthly);
  const credits = spouse * rentTax2026.salaryCredits.spouse + children * rentTax2026.salaryCredits.child;
  return Math.max(0, taxBeforeCredits - credits);
};
