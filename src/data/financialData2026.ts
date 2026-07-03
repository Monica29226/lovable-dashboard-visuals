// Datos centralizados del Panel 2026 - Junio 2026
// Actualiza estos valores y todos los componentes del Panel 2026 se actualizarán automáticamente

export const financialData2026 = {
  period: 'Junio 2026',
  periodEn: 'June 2026',

  // ─── Estado de Resultados (Income Statement) ───────────────────
  incomeStatement: {
    income: {
      cuotasAsociados: 115000,
      comunidad: 71310.93,
      ingresoRentaDiferido: 0,
      total: 186310.93,
    },
    expenses: {
      personal: 114603.35,
      gastosAdministrativos: 11783.71,
      viaticosGiras: 17142.24,
      comunicacionMercadeo: 14533.17,
      serviciosProfesionales: 27600.65,
      tecnologia: 18324.21,
      otrosGastosPatente: 7492.68,
      impuestoRenta: 0,
      total: 211480.02,
    },
    netResult: -25169.09, // Ingresos menos Gastos
  },

  // ─── Estado de Posición Financiera (Balance Sheet) ─────────────
  balanceSheet: {
    assets: {
      current: {
        cashColones: 902.87,
        cashDollars: 114028.60,
        totalCash: 114931.47,
        accountsReceivable: 16757.36,
        accountsReceivableBNCR: 0,
        otherAccountsReceivable: 2124.24,
        totalAccountsReceivable: 18881.61,
        deferredTax: 32821.80,
        anticipatedRent: 0,
        totalCurrent: 166634.88,
      },
      nonCurrent: {
        furnitureEquipment: 0,
        computerEquipment: 29974.67,
        accumulatedDepreciation: -24071.80,
        totalNonCurrent: 5902.87,
      },
      totalAssets: 172537.75,
    },
    liabilities: {
      accountsPayable: 5453.07,
      taxesPayable: -575.15,
      incomeTaxPayable: 0,
      accumulatedExpenses: 7319.22,
      otherPayables: 0,
      totalCurrent: 12197.13,
      totalLiabilities: 12197.13,
    },
    equity: {
      retainedEarnings: 171244.32,
      translationAdjustment: 14265,
      currentYearResult: -25169.09,
      totalEquity: 160340.24,
    },
    totalLiabilitiesAndEquity: 172537.75,
  },
};

// ─── Helpers ─────────────────────────────────────────────────────
export const getNetResult2026 = () => {
  return financialData2026.incomeStatement.netResult;
};

export const formatCurrency2026 = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
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
        { name: 'Servicios Profesionales', amount: expenses.serviciosProfesionales },
        { name: 'Tecnología', amount: expenses.tecnologia },
        { name: 'Otros Gastos / Patente / IVA', amount: expenses.otrosGastosPatente },
        { name: 'Impuesto de Renta', amount: expenses.impuestoRenta },
      ],
    },
  ];
};
