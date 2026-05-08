## Plan

1. **Confirmar envío correcto del enlace**
   - Mantener `resetPasswordForEmail()` usando `window.location.origin + '/reset-password'`, que ya está presente.
   - Evitar URLs hardcodeadas de preview o producción para que el enlace funcione en ambos entornos.

2. **Simplificar y robustecer `/reset-password`**
   - Reemplazar la lógica actual excesivamente compleja por un flujo estándar y confiable:
     - Escuchar `supabase.auth.onAuthStateChange()` inmediatamente.
     - Aceptar específicamente `PASSWORD_RECOVERY` con sesión válida.
     - Aceptar también una sesión ya creada por el SDK cuando el hash `#access_token` fue procesado antes de que React renderice.
     - Procesar manualmente `#access_token` + `#refresh_token` con `supabase.auth.setSession()` si el SDK no lo hizo automáticamente.
   - Mostrar el formulario solo cuando haya una sesión válida de recuperación.
   - Evitar marcar como expirado mientras el SDK todavía está procesando el hash.

3. **Corregir el manejo del hash de recuperación**
   - Leer parámetros desde `window.location.hash` (`access_token`, `refresh_token`, `type=recovery`) y también desde query params si llegan como PKCE `code`.
   - Para `code`, intentar `exchangeCodeForSession(code)`.
   - Limpiar la URL solo después de crear/confirmar sesión, no antes.

4. **Validar rutas y cliente**
   - `App.tsx` ya tiene `/reset-password` como ruta pública; no requiere cambio salvo que encontremos conflicto.
   - El cliente no tiene `flowType` configurado; lo dejaré por defecto y no editaré el archivo autogenerado.

5. **Actualizar contraseña**
   - Al enviar el formulario, llamar `supabase.auth.updateUser({ password })` usando la sesión de recuperación activa.
   - Cerrar sesión y redirigir a `/auth` con mensaje de éxito.
   - Si falla, mostrar el error real sin decir falsamente que el enlace expiró.

6. **Verificación**
   - Revisar que el código compile a nivel de TypeScript por estructura.
   - Probar mentalmente los dos formatos principales de enlace: `#access_token...type=recovery` y `?code=...`.
   - Mantener logs útiles pero sin exponer tokens ni datos sensibles.