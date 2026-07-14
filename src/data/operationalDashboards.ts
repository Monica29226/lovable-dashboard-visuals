export interface RaciPayrollMonth {
  month: string;
  salary: number;
  ccss: number;
  aguinaldo: number;
  employees: number;
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
