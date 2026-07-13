import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { useState } from "react";

const formatNumber = (value: number) => {
  return '₡' + new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatNumberInput = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseNumberInput = (value: string) => {
  return parseFloat(value.replace(/,/g, '')) || 0;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currencySign: 'accounting',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const TaxProjectionCard = () => {
  // Ingresos
  const [cuotasAsociadosSep, setCuotasAsociadosSep] = useState(67459727.00);
  const [cuotasAsociadosOctDic, setCuotasAsociadosOctDic] = useState(34137399.00);
  const [comunidadSep, setComunidadSep] = useState(112189979.00);
  const [comunidadOctDic, setComunidadOctDic] = useState(22735550.00);
  const [otrosSep, setOtrosSep] = useState(0);
  const [otrosOctDic, setOtrosOctDic] = useState(0);

  // Egresos
  const [personalSep, setPersonalSep] = useState(92534461.00);
  const [personalOctDic, setPersonalOctDic] = useState(25946357.00);
  const [gastosAdminSep, setGastosAdminSep] = useState(14054223.00);
  const [gastosAdminOctDic, setGastosAdminOctDic] = useState(4373490.00);
  const [viaticosSep, setViaticosSep] = useState(12067052.00);
  const [viaticosOctDic, setViaticosOctDic] = useState(3877554.00);
  const [comunicacionSep, setComunicacionSep] = useState(13216664.00);
  const [comunicacionOctDic, setComunicacionOctDic] = useState(2881288.00);
  const [serviciosProfSep, setServiciosProfSep] = useState(20415449.00);
  const [serviciosProfOctDic, setServiciosProfOctDic] = useState(7282000.00);
  const [otrosGastosSep, setOtrosGastosSep] = useState(2728680.00);
  const [otrosGastosOctDic, setOtrosGastosOctDic] = useState(593950.00);

  // Anticipos y otros
  const [anticipoRenta, setAnticipoRenta] = useState(3268930.00);
  const [tasaCambio, setTasaCambio] = useState(505);

  // Cálculos
  const totalIngresosSep = cuotasAsociadosSep + comunidadSep + otrosSep;
  const totalIngresosOctDic = cuotasAsociadosOctDic + comunidadOctDic + otrosOctDic;
  const totalIngresos = totalIngresosSep + totalIngresosOctDic;

  const totalEgresosSep = personalSep + gastosAdminSep + viaticosSep + comunicacionSep + serviciosProfSep + otrosGastosSep;
  const totalEgresosOctDic = personalOctDic + gastosAdminOctDic + viaticosOctDic + comunicacionOctDic + serviciosProfOctDic + otrosGastosOctDic;
  const totalEgresos = totalEgresosSep + totalEgresosOctDic;

  const resultadoNetoSep = totalIngresosSep - totalEgresosSep;
  const resultadoNetoOctDic = totalIngresosOctDic - totalEgresosOctDic;
  const resultadoNetoTotal = resultadoNetoSep + resultadoNetoOctDic;

  const impuestoRentaSep = resultadoNetoSep * 0.20;
  const impuestoRentaOctDic = resultadoNetoOctDic * 0.20;
  const impuestoRentaTotal = impuestoRentaSep + impuestoRentaOctDic;

  const saldoImpuestoPorPagar = impuestoRentaTotal - anticipoRenta;
  const impuestoRentaTotalUSD = impuestoRentaTotal / tasaCambio;
  const impuestoPendienteUSD = saldoImpuestoPorPagar / tasaCambio;

  const TableRow = ({ label, sepValue, octDicValue, onChange, isEditable = true }: { 
    label: string; 
    sepValue: number; 
    octDicValue: number; 
    onChange?: { setSep: (val: number) => void; setOctDic: (val: number) => void };
    isEditable?: boolean;
  }) => (
    <div className="grid grid-cols-12 gap-4 py-4 border-b border-border/30 items-center hover:bg-muted/30 transition-colors">
      <div className="col-span-4 text-sm font-medium text-foreground/90 pl-6">{label}</div>
      <div className="col-span-3 text-right pr-4">
        {isEditable && onChange ? (
          <Input
            type="text"
            value={formatNumberInput(sepValue)}
            onChange={(e) => onChange.setSep(parseNumberInput(e.target.value))}
            className="text-right font-mono text-sm h-10 border-0 bg-background/50 focus-visible:ring-1"
          />
        ) : (
          <span className="font-mono text-sm text-foreground/80">{formatNumber(sepValue)}</span>
        )}
      </div>
      <div className="col-span-2 text-right pr-4">
        {isEditable && onChange ? (
          <Input
            type="text"
            value={formatNumberInput(octDicValue)}
            onChange={(e) => onChange.setOctDic(parseNumberInput(e.target.value))}
            className="text-right font-mono text-sm h-10 border-0 bg-background/50 focus-visible:ring-1"
          />
        ) : (
          <span className="font-mono text-sm text-foreground/80">{formatNumber(octDicValue)}</span>
        )}
      </div>
      <div className="col-span-3 text-right pr-6 font-mono text-sm font-semibold text-primary">
        {formatNumber(sepValue + octDicValue)}
      </div>
    </div>
  );

  const TotalRow = ({ label, sepValue, octDicValue, totalValue }: { 
    label: string; 
    sepValue: number; 
    octDicValue: number; 
    totalValue: number;
  }) => (
    <div className="grid grid-cols-12 gap-4 py-4 bg-gradient-to-r from-primary/5 to-primary/10 items-center rounded-lg my-2">
      <div className="col-span-4 text-sm font-bold text-primary pl-6">{label}</div>
      <div className="col-span-3 text-right pr-4 font-mono text-sm font-bold text-primary">
        {formatNumber(sepValue)}
      </div>
      <div className="col-span-2 text-right pr-4 font-mono text-sm font-bold text-primary">
        {formatNumber(octDicValue)}
      </div>
      <div className="col-span-3 text-right pr-6 font-mono text-sm font-bold text-primary">
        {formatNumber(totalValue)}
      </div>
    </div>
  );

  return (
    <Card className="w-full shadow-lg border-0">
      <CardHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-background pb-8 pt-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-bold text-primary tracking-tight">
              ASOCIACIÓN HORIZONTE POSITIVO
            </CardTitle>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Cálculo Impuesto sobre las Utilidades
            </h3>
            <p className="text-sm text-muted-foreground">
              Proyectado a Diciembre 2025
            </p>
            <p className="text-xs text-muted-foreground/80">
              Período fiscal del 01 de enero al 31 de diciembre 2025
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Header de columnas */}
        <div className="grid grid-cols-12 gap-4 py-4 mb-4 bg-muted/50 rounded-lg items-center">
          <div className="col-span-4"></div>
          <div className="col-span-3 text-right pr-4 text-xs font-bold text-primary uppercase tracking-wide">
            Saldo<br/>Setiembre
          </div>
          <div className="col-span-2 text-right pr-4 text-xs font-bold text-primary uppercase tracking-wide">
            Octubre<br/>Diciembre
          </div>
          <div className="col-span-3 text-right pr-6 text-xs font-bold text-primary uppercase tracking-wide">
            Total<br/>Ingresos
          </div>
        </div>

        {/* Sección Ingresos */}
        <div className="mb-6">
          <div className="px-6 py-3 bg-primary/10 rounded-t-lg">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wide">Ingresos</h4>
          </div>
          <TableRow 
            label="Cuotas Asociados" 
            sepValue={cuotasAsociadosSep} 
            octDicValue={cuotasAsociadosOctDic}
            onChange={{ setSep: setCuotasAsociadosSep, setOctDic: setCuotasAsociadosOctDic }}
          />
          <TableRow 
            label="Comunidad" 
            sepValue={comunidadSep} 
            octDicValue={comunidadOctDic}
            onChange={{ setSep: setComunidadSep, setOctDic: setComunidadOctDic }}
          />
          <TableRow 
            label="Otros" 
            sepValue={otrosSep} 
            octDicValue={otrosOctDic}
            onChange={{ setSep: setOtrosSep, setOctDic: setOtrosOctDic }}
          />
          <TotalRow 
            label="Total ingresos" 
            sepValue={totalIngresosSep} 
            octDicValue={totalIngresosOctDic}
            totalValue={totalIngresos}
          />
        </div>

        {/* Sección Egresos */}
        <div className="mb-6">
          <div className="px-6 py-3 bg-primary/10 rounded-t-lg">
            <h4 className="text-sm font-bold text-primary uppercase tracking-wide">Egresos</h4>
          </div>
          <TableRow 
            label="Personal" 
            sepValue={personalSep} 
            octDicValue={personalOctDic}
            onChange={{ setSep: setPersonalSep, setOctDic: setPersonalOctDic }}
          />
          <TableRow 
            label="Gastos administrativos" 
            sepValue={gastosAdminSep} 
            octDicValue={gastosAdminOctDic}
            onChange={{ setSep: setGastosAdminSep, setOctDic: setGastosAdminOctDic }}
          />
          <TableRow 
            label="Viáticos" 
            sepValue={viaticosSep} 
            octDicValue={viaticosOctDic}
            onChange={{ setSep: setViaticosSep, setOctDic: setViaticosOctDic }}
          />
          <TableRow 
            label="Comunicación y Mercadeo" 
            sepValue={comunicacionSep} 
            octDicValue={comunicacionOctDic}
            onChange={{ setSep: setComunicacionSep, setOctDic: setComunicacionOctDic }}
          />
          <TableRow 
            label="Servicios Profesionales" 
            sepValue={serviciosProfSep} 
            octDicValue={serviciosProfOctDic}
            onChange={{ setSep: setServiciosProfSep, setOctDic: setServiciosProfOctDic }}
          />
          <TableRow 
            label="Otros Gastos" 
            sepValue={otrosGastosSep} 
            octDicValue={otrosGastosOctDic}
            onChange={{ setSep: setOtrosGastosSep, setOctDic: setOtrosGastosOctDic }}
          />
          <TotalRow 
            label="Total" 
            sepValue={totalEgresosSep} 
            octDicValue={totalEgresosOctDic}
            totalValue={totalEgresos}
          />
        </div>

        {/* Resultado Neto */}
        <div className="py-5 px-6 bg-gradient-to-r from-muted/30 to-muted/50 rounded-lg mb-4">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4 text-base font-bold text-foreground">Resultado neto</div>
            <div className="col-span-3 text-right pr-4 font-mono text-base font-bold text-foreground">
              {formatNumber(resultadoNetoSep)}
            </div>
            <div className="col-span-2 text-right pr-4 font-mono text-base font-bold text-foreground">
              {formatNumber(resultadoNetoOctDic)}
            </div>
            <div className="col-span-3 text-right pr-6 font-mono text-base font-bold text-primary">
              {formatNumber(resultadoNetoTotal)}
            </div>
          </div>
        </div>

        {/* Impuesto de Renta */}
        <div className="py-5 px-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg mb-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-4 text-base font-bold text-primary">Impuesto de Renta</div>
            <div className="col-span-3 text-right pr-4 font-mono text-base font-bold text-primary">
              {formatNumber(impuestoRentaSep)}
            </div>
            <div className="col-span-2 text-right pr-4 font-mono text-base font-bold text-primary">
              {formatNumber(impuestoRentaOctDic)}
            </div>
            <div className="col-span-3 text-right pr-6 font-mono text-base font-bold text-primary">
              {formatNumber(impuestoRentaTotal)}
            </div>
          </div>
        </div>

        {/* Anticipo y Saldo */}
        <div className="bg-muted/30 rounded-lg p-6 space-y-5 mb-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-9 text-sm font-medium text-foreground">Anticipo de renta</div>
            <div className="col-span-3 text-right">
              <Input
                type="text"
                value={formatNumberInput(anticipoRenta)}
                onChange={(e) => setAnticipoRenta(parseNumberInput(e.target.value))}
                className="text-right font-mono text-sm h-10 border-0 bg-background focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 items-center pt-4 border-t-2 border-primary/20">
            <div className="col-span-9 text-base font-bold text-foreground">Saldo impuesto por pagar</div>
            <div className="col-span-3 text-right font-mono text-lg font-bold text-primary pr-3">
              {formatNumber(saldoImpuestoPorPagar)}
            </div>
          </div>
        </div>

        {/* Conversión a USD */}
        <div className="bg-gradient-to-br from-muted/20 to-muted/40 rounded-lg p-6 space-y-4 mb-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-9 text-sm font-medium text-muted-foreground">Tasa de cambio (₡/$)</div>
            <div className="col-span-3 text-right">
              <Input
                type="text"
                value={formatNumberInput(tasaCambio)}
                onChange={(e) => setTasaCambio(parseNumberInput(e.target.value))}
                className="text-right font-mono text-sm h-10 border-0 bg-background focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-9 text-sm font-medium text-foreground">Impuesto de renta total en $</div>
            <div className="col-span-3 text-right font-mono text-sm font-bold text-primary pr-3">
              {formatCurrency(impuestoRentaTotalUSD)}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-9 text-sm font-medium text-foreground">Impuesto Pendiente de pagar en $</div>
            <div className="col-span-3 text-right font-mono text-sm font-bold text-primary pr-3">
              {formatCurrency(impuestoPendienteUSD)}
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-6">
          <div className="space-y-5">
            <p className="text-base font-bold text-primary">Supuestos adicionales de nov y dic.</p>
            
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Ingresos Pendientes</p>
              <div className="bg-background/50 rounded-md p-4 space-y-2">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Huella/ Grupo Vargas</span>
                  <span className="font-mono font-medium">11,167</span>
                </div>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Asociados</span>
                  <span className="font-mono font-medium">40,000</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold text-foreground pt-2 border-t border-border/50">
                  <span>Total</span>
                  <span className="font-mono">51,167</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Gastos</p>
              <div className="bg-background/50 rounded-md p-4">
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>Evento Asociados Tecnología $</span>
                  <span className="font-mono font-medium">7,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
