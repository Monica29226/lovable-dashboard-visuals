// Datos compartidos del Balance General
export const balanceSheetData = {
  assets: {
    current: {
      dec2024: {
        cashColones: 1621,
        cashDollars: 79893,
        totalCash: 81520,
        accountsReceivable: 32961,
        totalCurrent: 147171
      },
      oct2025: {
        cashColones: 6214,
        cashDollars: 113940,
        totalCash: 120154,
        accountsReceivable: 62072,
        totalCurrent: 218201
      }
    },
    nonCurrent: {
      dec2024: {
        deferredTax: 29038,
        anticipatedRent: 3652,
        equipment: 26445,
        computerEquipment: 26445,
        accumulatedDepreciation: -18332,
        totalNonCurrent: 7513,
        totalAssets: 154684
      },
      oct2025: {
        deferredTax: 29515,
        anticipatedRent: 6460,
        equipment: 26445,
        computerEquipment: 26445,
        accumulatedDepreciation: -21624,
        totalNonCurrent: 13042,
        totalAssets: 231243
      }
    }
  },
  liabilities: {
    current: {
      dec2024: {
        accountsPayable: 72,
        taxesPayable: 3334,
        vatPayable: 0,
        accumulatedExpenses: 16277,
        otherPayables: 0,
        totalCurrent: 19683,
        totalLiabilities: 19683
      },
      oct2025: {
        accountsPayable: 608,
        taxesPayable: 1655,
        vatPayable: 0,
        accumulatedExpenses: 11422,
        otherPayables: 3140,
        totalCurrent: 16826,
        totalLiabilities: 16826
      }
    }
  },
  equity: {
    dec2024: {
      retainedEarnings: 51232,
      translationAdjustment: 33151,
      currentYearResult: 50618,
      totalEquity: 135001
    },
    oct2025: {
      retainedEarnings: 135001,
      translationAdjustment: -2091,
      currentYearResult: 81507,
      totalEquity: 214417
    }
  }
};

// Datos históricos de patrimonio (años anteriores a 2024)
export const historicalPatrimony = [
  {
    year: "2022",
    patrimony: 16835.96,
    displayValue: "$16,836"
  },
  {
    year: "2023", 
    patrimony: 51292.61,
    displayValue: "$51,293"
  }
];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};
