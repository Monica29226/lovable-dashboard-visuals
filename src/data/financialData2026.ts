// Datos centralizados del Panel 2026 - Febrero 2026
// Actualiza estos valores y todos los componentes del Panel 2026 se actualizarán automáticamente

export const financialData2026 = {
  period: 'Febrero 2026',
  periodEn: 'February 2026',

  // ─── Estado de Resultados (Income Statement) ───────────────────
  incomeStatement: {
    income: {
      cuotasAsociados: 29617,
      comunidad: 65342,
      ingresoRentaDiferido: 0,
      total: 94959,
    },
    expenses: {
      personal: 28369,
      gastosAdministrativos: 3259,
      viaticosGiras: 4234,
      comunicacionMercadeo: 4766,
      serviciosProfesionales: 12793,
      tecnologia: 4632,
      otrosGastosPatente: 1362,
      impuestoRenta: 0,
      total: 59416,
    },
    netResult: 35542, // Ingresos menos Gastos
  },

  // ─── Estado de Posición Financiera (Balance Sheet) ─────────────
  balanceSheet: {
    assets: {
      current: {
        cashColones: 319,
        cashDollars: 106917,
        totalCash: 107235,
        accountsReceivable: 81869,
        accountsReceivableBNCR: 0,
        otherAccountsReceivable: 515,
        totalAccountsReceivable: 82384,
        deferredTax: 32565,
        anticipatedRent: 0,
        totalCurrent: 222184,
      },
      nonCurrent: {
        furnitureEquipment: 347,
        computerEquipment: 27556,
        accumulatedDepreciation: -22579,
        totalNonCurrent: 5324,
      },
      totalAssets: 227508,
    },
    liabilities: {
      accountsPayable: 8856,
      taxesPayable: -1216,
      incomeTaxPayable: 4841,
      accumulatedExpenses: 3002,
      otherPayables: 0,
      totalCurrent: 15484,
      totalLiabilities: 15484,
    },
    equity: {
      retainedEarnings: 171244,
      translationAdjustment: 5237,
      currentYearResult: 35542,
      totalEquity: 212024,
    },
    totalLiabilitiesAndEquity: 227508,
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
