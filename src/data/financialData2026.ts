// Datos centralizados del Panel 2026 - Abril 2026
// Actualiza estos valores y todos los componentes del Panel 2026 se actualizarán automáticamente

export const financialData2026 = {
  period: 'Abril 2026',
  periodEn: 'April 2026',

  // ─── Estado de Resultados (Income Statement) ───────────────────
  incomeStatement: {
    income: {
      cuotasAsociados: 56903,
      comunidad: 78493,
      ingresoRentaDiferido: 0,
      total: 135395,
    },
    expenses: {
      personal: 69520,
      gastosAdministrativos: 7165,
      viaticosGiras: 11078,
      comunicacionMercadeo: 11674,
      serviciosProfesionales: 14944,
      tecnologia: 11231,
      otrosGastosPatente: 1363,
      impuestoRenta: 0,
      total: 126975,
    },
    netResult: 8421, // Ingresos menos Gastos
  },

  // ─── Estado de Posición Financiera (Balance Sheet) ─────────────
  balanceSheet: {
    assets: {
      current: {
        cashColones: 4155,
        cashDollars: 145021,
        totalCash: 149176,
        accountsReceivable: 22944,
        accountsReceivableBNCR: 0,
        otherAccountsReceivable: -1622,
        totalAccountsReceivable: 21322,
        deferredTax: 32838,
        anticipatedRent: 0,
        totalCurrent: 203335,
      },
      nonCurrent: {
        furnitureEquipment: 0,
        computerEquipment: 27556,
        accumulatedDepreciation: -23076,
        totalNonCurrent: 4479,
      },
      totalAssets: 207814,
    },
    liabilities: {
      accountsPayable: 6554,
      taxesPayable: 1827,
      incomeTaxPayable: -2715,
      accumulatedExpenses: 10725,
      otherPayables: 0,
      totalCurrent: 16390,
      totalLiabilities: 16390,
    },
    equity: {
      retainedEarnings: 171244,
      translationAdjustment: 11759,
      currentYearResult: 8421,
      totalEquity: 191424,
    },
    totalLiabilitiesAndEquity: 207814,
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
