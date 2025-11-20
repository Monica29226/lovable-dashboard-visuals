import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const associateData = [
  { associates: 30, fee: 5000, total: 150000, highlighted: false },
  { associates: 1, fee: 15000, total: 15000, highlighted: false },
  { associates: 2, fee: 30000, total: 60000, highlighted: false },
  { associates: 2, fee: 5000, total: 10000, highlighted: true },
  { associates: 1, fee: 5650, total: 5650, highlighted: false },
  { associates: 1, fee: 10000, total: 10000, highlighted: false },
];

const totalAssociates = 37;
const totalAmount = 250650;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const AssociateCompositionTable = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Composición de Asociados 2026
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Total Associates Display */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <span className="text-base font-semibold text-foreground">
              Número de Asociados totales
            </span>
            <div className="px-4 py-2 border-2 border-border rounded">
              <span className="text-lg font-bold text-foreground">{totalAssociates.toFixed(2)}</span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-center p-3 font-semibold text-foreground">Asociados</th>
                  <th className="text-center p-3 font-semibold text-foreground">Cuota</th>
                  <th className="text-center p-3 font-semibold text-foreground">Monto</th>
                </tr>
              </thead>
              <tbody>
                {associateData.map((row, index) => (
                  <tr 
                    key={index}
                    className={row.highlighted ? 'bg-primary/10' : ''}
                  >
                    <td className="text-center p-3 border-t border-border font-medium">
                      {row.associates}
                    </td>
                    <td className="text-center p-3 border-t border-border">
                      {formatCurrency(row.fee)}
                    </td>
                    <td className="text-center p-3 border-t border-border font-medium">
                      {formatCurrency(row.total)}
                    </td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="text-center p-3 font-bold text-foreground">
                    {totalAssociates}
                  </td>
                  <td className="text-center p-3"></td>
                  <td className="text-center p-3 font-bold text-foreground">
                    {formatCurrency(totalAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Esta tabla muestra la distribución de los 37 asociados según el monto de cuota que aportan,
              totalizando ₡{formatCurrency(totalAmount)} en cuotas de asociados.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
