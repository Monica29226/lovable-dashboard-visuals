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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
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
    <div className="grid grid-cols-12 gap-2 py-3 border-b border-border/50 items-center">
      <div className="col-span-4 text-sm font-medium text-foreground pl-4">{label}</div>
      <div className="col-span-3 text-center">
        {isEditable && onChange ? (
          <Input
            type="number"
            value={sepValue}
            onChange={(e) => onChange.setSep(parseFloat(e.target.value) || 0)}
            className="text-center font-mono text-sm h-9"
            step="0.01"
          />
        ) : (
          <span className="font-mono text-sm">{formatNumber(sepValue)}</span>
        )}
      </div>
      <div className="col-span-2 text-center">
        {isEditable && onChange ? (
          <Input
            type="number"
            value={octDicValue}
            onChange={(e) => onChange.setOctDic(parseFloat(e.target.value) || 0)}
            className="text-center font-mono text-sm h-9"
            step="0.01"
          />
        ) : (
          <span className="font-mono text-sm">{formatNumber(octDicValue)}</span>
        )}
      </div>
      <div className="col-span-3 text-center font-mono text-sm font-medium text-primary">
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
    <div className="grid grid-cols-12 gap-2 py-3 bg-primary/5 items-center">
      <div className="col-span-4 text-sm font-bold text-primary pl-4">{label}</div>
      <div className="col-span-3 text-center font-mono text-sm font-bold text-primary">
        {formatNumber(sepValue)}
      </div>
      <div className="col-span-2 text-center font-mono text-sm font-bold text-primary">
        {formatNumber(octDicValue)}
      </div>
      <div className="col-span-3 text-center font-mono text-sm font-bold text-primary">
        {formatNumber(totalValue)}
      </div>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold text-primary tracking-wide">
              ASOCIACIÓN HORIZONTE POSITIVO
            </CardTitle>
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Cálculo Impuesto sobre las Utilidades, Proyectado a Diciembre 2025
          </h3>
          <p className="text-xs text-muted-foreground">
            Período fiscal del 01 de enero al 31 de diciembre 2025
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header de columnas */}
        <div className="grid grid-cols-12 gap-2 py-3 bg-muted/30 border-y border-border items-center">
          <div className="col-span-4"></div>
          <div className="col-span-3 text-center text-xs font-bold text-primary uppercase">
            Saldo<br/>Setiembre
          </div>
          <div className="col-span-2 text-center text-xs font-bold text-primary uppercase">
            Octubre<br/>Diciembre
          </div>
          <div className="col-span-3 text-center text-xs font-bold text-primary uppercase">
            Total<br/>Ingresos
          </div>
        </div>

        {/* Sección Ingresos */}
        <div className="py-2">
          <div className="px-4 py-2 bg-primary/10">
            <h4 className="text-sm font-bold text-primary uppercase">Ingresos</h4>
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
        <div className="py-2 mt-4">
          <div className="px-4 py-2 bg-primary/10">
            <h4 className="text-sm font-bold text-primary uppercase">Egresos</h4>
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
        <div className="py-4 bg-muted/20 mt-4">
          <div className="grid grid-cols-12 gap-2 px-4 items-center">
            <div className="col-span-4 text-base font-bold text-foreground">Resultado neto</div>
            <div className="col-span-3 text-center font-mono text-base font-bold text-foreground">
              {formatNumber(resultadoNetoSep)}
            </div>
            <div className="col-span-2 text-center font-mono text-base font-bold text-foreground">
              {formatNumber(resultadoNetoOctDic)}
            </div>
            <div className="col-span-3 text-center font-mono text-base font-bold text-primary">
              {formatNumber(resultadoNetoTotal)}
            </div>
          </div>
        </div>

        {/* Impuesto de Renta */}
        <div className="py-4 bg-primary/5">
          <div className="grid grid-cols-12 gap-2 px-4 items-center">
            <div className="col-span-4 text-base font-bold text-foreground">Impuesto de Renta</div>
            <div className="col-span-3 text-center font-mono text-base font-bold text-foreground">
              {formatNumber(impuestoRentaSep)}
            </div>
            <div className="col-span-2 text-center font-mono text-base font-bold text-foreground">
              {formatNumber(impuestoRentaOctDic)}
            </div>
            <div className="col-span-3 text-center font-mono text-base font-bold text-primary">
              {formatNumber(impuestoRentaTotal)}
            </div>
          </div>
        </div>

        {/* Anticipo y Saldo */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-9 text-sm font-medium text-foreground">Anticipo de renta</div>
            <div className="col-span-3 text-center">
              <Input
                type="number"
                value={anticipoRenta}
                onChange={(e) => setAnticipoRenta(parseFloat(e.target.value) || 0)}
                className="text-center font-mono text-sm h-9"
                step="0.01"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t border-border">
            <div className="col-span-9 text-base font-bold text-foreground">Saldo impuesto por pagar</div>
            <div className="col-span-3 text-center font-mono text-base font-bold text-primary">
              {formatNumber(saldoImpuestoPorPagar)}
            </div>
          </div>
        </div>

        {/* Conversión a USD */}
        <div className="p-6 bg-muted/20 border-t border-border space-y-3">
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-9 text-sm font-medium text-muted-foreground">Tasa de cambio (₡/$)</div>
            <div className="col-span-3 text-center">
              <Input
                type="number"
                value={tasaCambio}
                onChange={(e) => setTasaCambio(parseFloat(e.target.value) || 505)}
                className="text-center font-mono text-sm h-9"
                step="0.01"
              />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-9 text-sm font-medium text-foreground">Impuesto de renta total en $</div>
            <div className="col-span-3 text-center font-mono text-sm font-bold text-primary">
              {formatCurrency(impuestoRentaTotalUSD)}
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 items-center">
            <div className="col-span-9 text-sm font-medium text-foreground">Impuesto Pendiente de pagar en $</div>
            <div className="col-span-3 text-center font-mono text-sm font-bold text-primary">
              {formatCurrency(impuestoPendienteUSD)}
            </div>
          </div>
        </div>

        {/* Notas */}
        <div className="p-4 bg-muted/10 border-t border-border">
          <div className="space-y-3">
            <p className="text-sm font-bold text-foreground">Supuestos adicionales de nov y dic.</p>
            
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Ingresos Pendientes</p>
              <div className="pl-4 space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Huella/ Grupo Vargas</span>
                  <span className="font-mono">11,167</span>
                </div>
                <div className="flex justify-between">
                  <span>Asociados</span>
                  <span className="font-mono">40,000</span>
                </div>
                <div className="flex justify-between font-semibold text-foreground">
                  <span>Total</span>
                  <span className="font-mono">51,167</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Gastos</p>
              <div className="pl-4 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Evento Asociados Tecnología $</span>
                  <span className="font-mono">7,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
