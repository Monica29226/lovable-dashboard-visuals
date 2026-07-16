// Datos centralizados del Panel 2026 - Junio 2026
// Fuente: "06 Estados Financieros H+ Junio 2026.xlsx".

export const financialData2026 = {
  period: 'Junio 2026',
  periodEn: 'June 2026',
  exchangeRate: {
    label: 'Tipo de cambio venta final BCCR',
    date: '2026-06-30',
    sale: 457.17,
  },

  incomeStatement: {
    income: {
      cuotasAsociados: 115000,
      comunidad: 71310.93,
      ingresoRentaDiferido: 0,
      total: 186310.93,
    },
    expenses: {
      personal: 114603.34696014189,
      gastosAdministrativos: 11783.71010436612,
      viaticosGiras: 17142.239925965652,
      comunicacionMercadeo: 5346.739684557462,
      eventos: 9186.432546597165,
      serviciosProfesionales: 27600.654293685853,
      tecnologia: 18324.212770028327,
      impuestos: 5999.44984811559,
      otrosGastos: 0,
      depreciacion: 1751.23,
      impuestoRenta: 0,
      total: 211738.02,
    },
    netResult: -25427.09,
  },


  incomeStatementComparison: [
    { section: 'income', label: 'Comunidad', annualBudget: 258632.5146493917, accumulatedBudget: 114784.67, actual: 71310.93 },
    { section: 'income', label: 'Cuotas Asociados', annualBudget: 250650, accumulatedBudget: 175650, actual: 115000 },
    { section: 'income', label: 'Ingreso Renta Diferido', annualBudget: 0, accumulatedBudget: 0, actual: 0 },
    { section: 'incomeTotal', label: 'Total ingresos', annualBudget: 509282.5146493917, accumulatedBudget: 290434.67, actual: 186310.93 },
    { section: 'expense', label: 'Personal', annualBudget: 223079.11948, accumulatedBudget: 111539.55974, actual: 114603.34696014189 },
    { section: 'expense', label: 'Gastos administrativos', annualBudget: 20493.01592079208, accumulatedBudget: 10246.50796039604, actual: 11783.71010436612 },
    { section: 'expense', label: 'Viáticos y Giras', annualBudget: 24000, accumulatedBudget: 12000, actual: 17142.239925965652 },
    { section: 'expense', label: 'Comunicación y Mercadeo', annualBudget: 6885, accumulatedBudget: 2595, actual: 5346.739684557462 },
    { section: 'expense', label: 'Eventos', annualBudget: 8750, accumulatedBudget: 3650, actual: 9186.432546597165 },
    { section: 'expense', label: 'Servicios Profesionales', annualBudget: 24048, accumulatedBudget: 12024, actual: 27600.654293685853 },
    { section: 'expense', label: 'Tecnología', annualBudget: 21840, accumulatedBudget: 12670, actual: 18324.212770028327 },
    { section: 'expense', label: 'Impuestos', annualBudget: 8000, accumulatedBudget: 4000, actual: 5999.44984811559 },
    { section: 'expense', label: 'Otros Gastos', annualBudget: 400, accumulatedBudget: 200, actual: 0 },
    { section: 'expense', label: 'Depreciación', annualBudget: 3000, accumulatedBudget: 1500, actual: 1493.229673707756 },
    { section: 'expense', label: 'Impuesto de Renta', annualBudget: 0, accumulatedBudget: 0, actual: 0 },
    { section: 'expenseTotal', label: 'Total egresos', annualBudget: 340495.13540079206, accumulatedBudget: 170425.06770039603, actual: 211480.01580716585 },
    { section: 'net', label: 'Ingresos menos Gastos', annualBudget: 168787.37924859964, accumulatedBudget: 120009.60229960395, actual: -25169.08580716586 },
  ],

  monthlyIncomeStatement: [
    {
      key: 'january',
      label: 'Enero',
      rows: [
        { label: 'Comunidad', budget: 15467, actual: 24617 },
        { label: 'Cuotas Asociados', budget: 70000, actual: 0 },
        { label: 'Ingreso Renta Diferido', budget: 0, actual: 0 },
        { label: 'Total ingresos', budget: 85467, actual: 24617, section: 'incomeTotal' },
        { label: 'Personal', budget: 18589.926623333333, actual: 13594.237743314934 },
        { label: 'Gastos administrativos', budget: 1707.7513267326733, actual: 1959.3625403028066 },
        { label: 'Viáticos y Giras', budget: 2000, actual: 2027.540481605984 },
        { label: 'Comunicación y Mercadeo', budget: 150, actual: 287.93423411225643 },
        { label: 'Eventos', budget: 0, actual: 0 },
        { label: 'Servicios Profesionales', budget: 2004, actual: 7394.822246566043 },
        { label: 'Tecnología', budget: 1195, actual: 2716.7040755312005 },
        { label: 'Impuestos', budget: 1200, actual: 0 },
        { label: 'Otros Gastos', budget: 100, actual: 0 },
        { label: 'Depreciación', budget: 250, actual: 248.871612284626 },
        { label: 'Total egresos', budget: 27196.677950066005, actual: 28229.47293371785, section: 'expenseTotal' },
        { label: 'Ingresos menos Gastos', budget: 58270.322049933995, actual: -3612.4729337178505, section: 'net' },
      ],
    },
    {
      key: 'february',
      label: 'Febrero',
      rows: [
        { label: 'Comunidad', budget: 5550, actual: 5000 },
        { label: 'Cuotas Asociados', budget: 15000, actual: 65000 },
        { label: 'Ingreso Renta Diferido', budget: 0, actual: 0 },
        { label: 'Total ingresos', budget: 20550, actual: 70000, section: 'incomeTotal' },
        { label: 'Personal', budget: 18589.926623333333, actual: 14775.199004814658 },
        { label: 'Gastos administrativos', budget: 1707.7513267326733, actual: 1585.7264970296912 },
        { label: 'Viáticos y Giras', budget: 2000, actual: 2462.6070894493932 },
        { label: 'Comunicación y Mercadeo', budget: 150, actual: 4477.771010608663 },
        { label: 'Eventos', budget: 50, actual: 0 },
        { label: 'Servicios Profesionales', budget: 2004, actual: 5398.289093425443 },
        { label: 'Tecnología', budget: 4695, actual: 1924.1084001383992 },
        { label: 'Impuestos', budget: 400, actual: 1866.4241325115381 },
        { label: 'Otros Gastos', budget: 0, actual: 0 },
        { label: 'Depreciación', budget: 250, actual: 248.871612284626 },
        { label: 'Total egresos', budget: 29846.677950066005, actual: 32738.99684026241, section: 'expenseTotal' },
        { label: 'Ingresos menos Gastos', budget: -9296.677950066005, actual: 37261.00315973759, section: 'net' },
      ],
    },
    {
      key: 'march',
      label: 'Marzo',
      rows: [
        { label: 'Comunidad', budget: 30700, actual: 10200 },
        { label: 'Cuotas Asociados', budget: 30000, actual: 0 },
        { label: 'Ingreso Renta Diferido', budget: 0, actual: 0 },
        { label: 'Total ingresos', budget: 60700, actual: 10200, section: 'incomeTotal' },
        { label: 'Personal', budget: 18589.926623333333, actual: 22349.696012970126 },
        { label: 'Gastos administrativos', budget: 1707.7513267326733, actual: 2088.0950514152432 },
        { label: 'Viáticos y Giras', budget: 2000, actual: 2655.699353884855 },
        { label: 'Comunicación y Mercadeo', budget: 150, actual: 306.75159649948654 },
        { label: 'Eventos', budget: 0, actual: 4060.023344043846 },
        { label: 'Servicios Profesionales', budget: 2004, actual: 1359.463494186877 },
        { label: 'Tecnología', budget: 2195, actual: 2532.45771146658 },
        { label: 'Impuestos', budget: 400, actual: 684.3072657721578 },
        { label: 'Otros Gastos', budget: 0, actual: 0 },
        { label: 'Depreciación', budget: 250, actual: 248.871612284626 },
        { label: 'Total egresos', budget: 27296.677950066005, actual: 36285.3654425238, section: 'expenseTotal' },
        { label: 'Ingresos menos Gastos', budget: 33403.322049933995, actual: -26085.3654425238, section: 'net' },
      ],
    },
    {
      key: 'april',
      label: 'Abril',
      rows: [
        { label: 'Comunidad', budget: 30000, actual: 27671.33 },
        { label: 'Cuotas Asociados', budget: 30000, actual: 5000 },
        { label: 'Ingreso Renta Diferido', budget: 0, actual: 0 },
        { label: 'Total ingresos', budget: 60000, actual: 32671.33, section: 'incomeTotal' },
        { label: 'Personal', budget: 18589.926623333333, actual: 18819.199702343612 },
        { label: 'Gastos administrativos', budget: 1707.7513267326733, actual: 1582.2836042381427 },
        { label: 'Viáticos y Giras', budget: 2000, actual: 4223.18814652655 },
        { label: 'Comunicación y Mercadeo', budget: 150, actual: 171.21007272680077 },
        { label: 'Eventos', budget: 550, actual: 2370.68406889361 },
        { label: 'Servicios Profesionales', budget: 2004, actual: 2312.312071956702 },
        { label: 'Tecnología', budget: 2195, actual: 2536.5361968339403 },
        { label: 'Impuestos', budget: 1200, actual: 936.5923102548685 },
        { label: 'Otros Gastos', budget: 100, actual: 0 },
        { label: 'Depreciación', budget: 250, actual: 248.871612284626 },
        { label: 'Total egresos', budget: 28746.677950066005, actual: 33200.87778605885, section: 'expenseTotal' },
        { label: 'Ingresos menos Gastos', budget: 31253.322049933995, actual: -529.5477860588508, section: 'net' },
      ],
    },
    {
      key: 'may',
      label: 'Mayo',
      rows: [
        { label: 'Comunidad', budget: 16000, actual: 2269.2999999999993 },
        { label: 'Cuotas Asociados', budget: 20000, actual: 5000 },
        { label: 'Ingreso Renta Diferido', budget: 0, actual: 0 },
        { label: 'Total ingresos', budget: 36000, actual: 7269.299999999999, section: 'incomeTotal' },
        { label: 'Personal', budget: 18589.926623333333, actual: 21253.990302780654 },
        { label: 'Gastos administrativos', budget: 1707.7513267326733, actual: 2993.807582001036 },
        { label: 'Viáticos y Giras', budget: 2000, actual: 3098.5032425165373 },
        { label: 'Comunicación y Mercadeo', budget: 1844.9999999999998, actual: 68.47511014116974 },
        { label: 'Eventos', budget: 3000, actual: 513.0801974429475 },
        { label: 'Servicios Profesionales', budget: 2004, actual: 5355.411130218393 },
        { label: 'Tecnología', budget: 1195, actual: 5756.442009245792 },
        { label: 'Impuestos', budget: 400, actual: 1273.223107991248 },
        { label: 'Otros Gastos', budget: 0, actual: 0 },
        { label: 'Depreciación', budget: 250, actual: 248.871612284626 },
        { label: 'Total egresos', budget: 30991.677950066005, actual: 40561.8042946224, section: 'expenseTotal' },
        { label: 'Ingresos menos Gastos', budget: 5008.322049933995, actual: -33292.5042946224, section: 'net' },
      ],
    },
    {
      key: 'june',
      label: 'Junio',
      rows: [
        { label: 'Comunidad', budget: 17067.67, actual: 1553.2999999999993 },
        { label: 'Cuotas Asociados', budget: 10650, actual: 40000 },
        { label: 'Ingreso Renta Diferido', budget: 0, actual: 0 },
        { label: 'Total ingresos', budget: 27717.67, actual: 41553.3, section: 'incomeTotal' },
        { label: 'Personal', budget: 18589.926623333333, actual: 23811.02419391792 },
        { label: 'Gastos administrativos', budget: 1707.7513267326733, actual: 1574.4348293792016 },
        { label: 'Viáticos y Giras', budget: 2000, actual: 2674.701611982332 },
        { label: 'Comunicación y Mercadeo', budget: 150, actual: 34.59766046908446 },
        { label: 'Eventos', budget: 50, actual: 2242.644936216762 },
        { label: 'Servicios Profesionales', budget: 2004, actual: 5780.3562573324 },
        { label: 'Tecnología', budget: 1195, actual: 2857.964376812417 },
        { label: 'Impuestos', budget: 400, actual: 1238.9030315857767 },
        { label: 'Otros Gastos', budget: 0, actual: 0 },
        { label: 'Depreciación', budget: 250, actual: 248.871612284626 },
        { label: 'Total egresos', budget: 26346.677950066005, actual: 40463.49850998053, section: 'expenseTotal' },
        { label: 'Ingresos menos Gastos', budget: 1370.9920499339933, actual: 1089.8014900194758, section: 'net' },
      ],
    },
  ],

  balanceSheet: {
    assets: {
      current: {
        cashColones: 902.8697639827634,
        cashDollars: 114028.60251110091,
        totalCash: 114931.47227508367,
        accountsReceivable: 16757.36235973489,
        accountsReceivableBNCR: 0,
        otherAccountsReceivable: 2124.2433011789926,
        totalAccountsReceivable: 18881.605660913883,
        deferredTax: 32821.80129929785,
        anticipatedRent: 0,
        totalCurrent: 166634.8792352954,
      },
      nonCurrent: {
        furnitureEquipment: 0,
        computerEquipment: 29974.67,
        accumulatedDepreciation: -24329.80,
        totalNonCurrent: 5644.87,
      },
      totalAssets: 172279.75,
    },
    liabilities: {
      accountsPayable: 5453.066146072577,
      taxesPayable: -575.1537721197803,
      incomeTaxPayable: 0,
      accumulatedExpenses: 7319.2221711835855,
      otherPayables: 0,
      totalCurrent: 12197.134545136381,
      totalLiabilities: 12197.134545136381,
    },
    equity: {
      retainedEarnings: 171244.3248462705,
      translationAdjustment: 14265,
      currentYearResult: -25427.09,
      totalEquity: 160082.24,
    },
    totalLiabilitiesAndEquity: 172279.75,
  },
};


export const getNetResult2026 = () => financialData2026.incomeStatement.netResult;

export const formatCurrency2026 = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatColones2026 = (valueInUsd: number): string => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valueInUsd * financialData2026.exchangeRate.sale);
};

export const getIncomeExpensesChartData2026 = () => {
  const { income, expenses } = financialData2026.incomeStatement;
  return [
    {
      category: 'Ingresos',
      categoryEn: 'Income',
      amount: income.total,
      color: 'hsl(207, 100%, 28%)',
      details: [
        { name: 'Cuotas Asociados', amount: income.cuotasAsociados },
        { name: 'Comunidad', amount: income.comunidad },
        { name: 'Ingreso Renta Diferido', amount: income.ingresoRentaDiferido },
      ],
    },
    {
      category: 'Egresos',
      categoryEn: 'Expenses',
      amount: expenses.total,
      color: 'hsl(45, 98%, 59%)',
      details: [
        { name: 'Personal', amount: expenses.personal },
        { name: 'Gastos Administrativos', amount: expenses.gastosAdministrativos },
        { name: 'Viáticos y Giras', amount: expenses.viaticosGiras },
        { name: 'Comunicación y Mercadeo', amount: expenses.comunicacionMercadeo },
        { name: 'Eventos', amount: expenses.eventos },
        { name: 'Servicios Profesionales', amount: expenses.serviciosProfesionales },
        { name: 'Tecnología', amount: expenses.tecnologia },
        { name: 'Impuestos', amount: expenses.impuestos },
        { name: 'Otros Gastos', amount: expenses.otrosGastos },
        { name: 'Depreciación', amount: expenses.depreciacion },
        { name: 'Impuesto de Renta', amount: expenses.impuestoRenta },
      ],
    },
  ];
};

// Estado de Resultados con Proyección Julio-Diciembre 2026
// Fuente: imagen contadora Junio 2026 (Real Ene-Jun + Proyección Jul-Dic)
export type ProjectionRow = {
  label: string;
  section: 'income' | 'incomeTotal' | 'expense' | 'expenseTotal' | 'net';
  values: number[]; // 12 meses: Ene..Dic
  budget: number;   // Presupuesto Original
};

export const projectionIncomeStatement2026: ProjectionRow[] = [
  { label: 'Cuotas Asociados', section: 'income', values: [0, 65000, 0, 5000, 5000, 40000, 10000, 10000, 5000, 80650, 5000, 9350], budget: 220000 },
  { label: 'Comunidad', section: 'income', values: [24617, 5000, 10200, 27671, 2269, 1553, 33053, 9880, 10749, 56313, 20000, 28693], budget: 230000 },
  { label: 'Ingreso por impuesto sobre la renta diferido', section: 'income', values: [0,0,0,0,0,0,0,0,0,0,0,0], budget: 0 },
  { label: 'Total ingresos', section: 'incomeTotal', values: [24617, 70000, 10200, 32671, 7269, 41553, 43053, 19880, 15749, 136963, 25000, 38043], budget: 450000 },
  { label: 'Personal', section: 'expense', values: [13594, 14775, 22350, 18819, 21254, 23811, 19832, 17804, 17804, 17804, 17804, 17804], budget: 223079 },
  { label: 'Gastos administrativos', section: 'expense', values: [1959, 1586, 2088, 1582, 2994, 1574, 1708, 1708, 1708, 1708, 1708, 1708], budget: 20493 },
  { label: 'Representación', section: 'expense', values: [2028, 2463, 2656, 4223, 3099, 2675, 2000, 2000, 2000, 2000, 2000, 2000], budget: 24000 },
  { label: 'Comunicación y Mercadeo', section: 'expense', values: [288, 4478, 307, 171, 68, 35, 150, 150, 1845, 150, 1845, 150], budget: 6885 },
  { label: 'Eventos', section: 'expense', values: [0, 0, 4060, 2371, 513, 2243, 0, 50, 3000, 2050, 0, 0], budget: 8750 },
  { label: 'Servicios Profesionales', section: 'expense', values: [7395, 5398, 1359, 2312, 5355, 5780, 2004, 2004, 2004, 2004, 2004, 2004], budget: 24048 },
  { label: 'Tecnología', section: 'expense', values: [2717, 1924, 2532, 2537, 5756, 2858, 1195, 1195, 2195, 2195, 1195, 1195], budget: 21840 },
  { label: 'Impuestos', section: 'expense', values: [0, 1866, 684, 937, 1273, 1239, 1200, 400, 400, 1200, 400, 400], budget: 8000 },
  { label: 'Otros Gastos', section: 'expense', values: [0, 0, 0, 0, 0, 0, 0, 100, 0, 0, 0, 100], budget: 400 },
  { label: 'Depreciación', section: 'expense', values: [249, 280, 280, 305, 319, 319, 250, 250, 250, 250, 250, 250], budget: 3000 },
  { label: 'Total egresos', section: 'expenseTotal', values: [28229, 32770, 36316, 33257, 40632, 40534, 28339, 25661, 31206, 29361, 27206, 25611], budget: 340495 },
  { label: 'Ingresos menos Gastos', section: 'net', values: [-3612, 37230, -26116, -585, -33363, 1020, 14714, -5781, -15457, 107602, -2206, 12432], budget: 109505 },
];

