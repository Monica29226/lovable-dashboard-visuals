## Objetivo

Aplicar la identidad de marca **ACL** a todo el portal (tema global) y luego construir el panel white-label por empresa descrito en el handoff, manteniendo intacta la conexión con QuickBooks y el aislamiento por empresa que ya existe.

Lo haré por fases para no romper la app (más de 100 componentes usan los tokens actuales).

---

## Fase 1 — Tema global ACL (base, "pegar una vez")

1. **Fuentes**: agregar en `index.html` los enlaces de Google Fonts: *Libre Caslon Display*, *Libre Caslon Text* y *Mulish* (300–800).
2. **Tokens en `index.css`**: introducir la paleta ACL como tokens HSL semánticos:
   - Marco: navy `--royal #052C76` / `--ink #15162C`, fondos crema `--bg #F4F1E8`, `--paper`, `--surface`, líneas `--line`.
   - Oro `--gold #B6924F` (solo líneas finas y el arco del monograma).
   - Estados: verde/ámbar/rojo con sus fondos.
   - Re-mapear los tokens existentes (`--primary`, `--sidebar-*`, `--accent`, etc.) a la paleta ACL para que toda la app cambie sin tocar cada componente. El sidebar pasa a navy ACL.
3. **`tailwind.config.ts`**: añadir colores `ink/royal/gold/cream/...`, las familias `font-display` (Caslon) y `font-sans` (Mulish), y `tabular-nums`. Body en Mulish; titulares en Caslon.
4. **Variable de acento por empresa `--co`**: definir un token `--co` (acento white-label) con un valor por defecto = royal. Se sobreescribe en runtime según la empresa seleccionada.
5. **Componente `AclMonogram`** (`src/components/AclMonogram.tsx`): SVG con A+L entrelazadas, C en oro detrás, arco dorado opcional. Props `size`, `onInk`, `arc`. Reemplaza el texto "ACL Costa Rica" en login, sidebar/topbar y como avatar/favicon.

## Fase 2 — Acento white-label por empresa

6. **DB**: agregar columna `accent_color` (texto/HSL) a `quickbooks_companies` (migración con sus GRANT/RLS ya existentes). Valor por defecto royal.
7. **CompanyContext / proveedor de tema**: al seleccionar empresa, fijar `--co` y `--co-soft` en `document.documentElement` para que KPIs, líneas de gráfico, botones y badges del panel usen el acento de esa empresa.
8. Actualizar `CompanyQuickBooksDashboard` para pintar KPIs, gráficos y badges con `--co` en lugar de `--primary` fijo.

## Fase 3 — Pantallas ACL

9. **Login** (`Auth.tsx`): layout split — izquierda navy con `AclMonogram`+arco y cita Caslon itálica + 3 sellos (Cifrado / Aislado por empresa / 2FA+biometría); derecha el formulario. Enlace "¿Es administrador de ACL?". Móvil: botón biométrico grande (ya existe BiometricLockScreen, se reusa).
10. **Portal multiempresa (solo admin ACL)**: grilla de tarjetas de empresa con franja de su color, iniciales en chip, 3 mini-KPIs (Ingresos, Margen, Liquidez), badge candado "Privado" + fecha; CTA "Conectar empresa" + tile dorado "Conectar desde QuickBooks Online". Banda superior "Aislamiento por empresa".
11. **Dashboard de empresa (white-label)**: topbar con punto del color + "Datos de QuickBooks · sync hoy", 4 KPI cards en acento, área "Ingresos vs gastos", donut "Composición de gastos", tabla "Estado de resultados · resumen". Chip "Solo esta empresa". Moneda ₡ tabular-nums.
12. **Configuración** (pantalla que estaba rota): 2 columnas con sub-nav (Marca y colores · Fuentes de datos · Usuarios y accesos · Indicadores visibles · Privacidad y seguridad). "Marca y colores": selector de acento (swatches), subir logo, nombre visible, toggle "Powered by ACL" y vista previa en vivo; al guardar, barra verde de confirmación y aplica el color al instante. "Fuentes de datos": QuickBooks = Conectado (reconectar/sincronizar, no romper) + conectar otra empresa.

## Notas técnicas

- No se toca la lógica de datos ni la sincronización de QuickBooks; solo presentación + columna `accent_color` y el theming runtime.
- El aislamiento multi-tenant ya está cubierto por RLS y `CompanyContext`; la vista "Todas las empresas" queda detrás de `AdminRoute`.
- Sin etiquetas de fase ("Publicado/Borrador"); cada empresa es un acceso privado con candado.
- Horizonte conserva su panel completo actual; las demás empresas siguen mostrando Balance + Estado de Resultados + gráficos.

## Alcance / orden de entrega

Propongo entregar **Fase 1 primero** (cambio visual global seguro y verificable), luego Fase 2 y 3. ¿Confirmás que arranque por la Fase 1, o preferís que haga las 3 fases de corrido?
