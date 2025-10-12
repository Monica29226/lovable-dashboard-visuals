import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, Calculator } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatColones = (value: number) => {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const TaxProjectionCard = () => {
  const taxData = {
    utilidadContable: 72290657, // colones
    rentaGravable: 146188146, // colones
    utilidadFiscal: 72966375, // colones
    impuestoRentaColones: 21889912,
    impuestoRentaDolares: 36512,
    anticipos: 3268930, // colones
    impuestoNetoPagar: 18620982, // colones
    impuestoNetoPagarDolares: 36512
  };

  return (
    <Card className="w-full border-chart-4/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-chart-4" />
            <CardTitle className="text-xl font-bold text-foreground">
              Proyección Impuesto de Renta 2025
            </CardTitle>
          </div>
          <Badge variant="outline" className="border-chart-4 text-chart-4">
            Estimado Diciembre 2025
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Cálculo proyectado del impuesto sobre las utilidades
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Utilidad Contable */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Utilidad Contable</span>
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatColones(taxData.utilidadContable)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            ≈ {formatCurrency(Math.round(taxData.utilidadContable / 530))}
          </div>
        </div>

        {/* Renta Gravable y Utilidad Fiscal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Renta Gravable
            </div>
            <div className="text-lg font-bold text-primary">
              {formatColones(taxData.rentaGravable)}
            </div>
          </div>
          
          <div className="p-4 bg-secondary/5 rounded-lg border border-secondary/20">
            <div className="text-sm font-medium text-muted-foreground mb-1">
              Utilidad Fiscal (después ISR)
            </div>
            <div className="text-lg font-bold text-secondary">
              {formatColones(taxData.utilidadFiscal)}
            </div>
          </div>
        </div>

        {/* Impuesto de Renta */}
        <div className="p-5 bg-chart-4/10 rounded-lg border-2 border-chart-4/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-chart-4" />
              Impuesto de Renta del Período (30%)
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">En Colones</div>
              <div className="text-2xl font-bold text-chart-4">
                {formatColones(taxData.impuestoRentaColones)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">En Dólares</div>
              <div className="text-2xl font-bold text-chart-4">
                {formatCurrency(taxData.impuestoRentaDolares)}
              </div>
            </div>
          </div>
        </div>

        {/* Anticipos y Pago Neto */}
        <div className="space-y-3">
          <div className="flex justify-between items-center p-3 bg-muted/20 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Anticipos Pagados</span>
            <span className="font-bold text-foreground">{formatColones(taxData.anticipos)}</span>
          </div>
          
          <div className="p-5 bg-chart-5/10 rounded-lg border-2 border-chart-5/30">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Impuesto Neto por Pagar (Estimado)
                </div>
                <div className="text-xs text-muted-foreground">
                  Nota: Aprovecha pérdida del 2023 y saldos a favor de años anteriores
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-chart-5">
                  {formatCurrency(taxData.impuestoNetoPagarDolares)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatColones(taxData.impuestoNetoPagar)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Nota:</strong> La proyección considera pérdidas fiscales diferidas del 2023 y créditos fiscales acumulados. 
            El monto final puede variar según ajustes al cierre del período fiscal.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
