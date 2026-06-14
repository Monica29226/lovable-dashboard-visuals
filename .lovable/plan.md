# Configurar correos de invitación con dominio aclcostarica.com

## Situación actual
- No hay Resend ni ningún proveedor de correo configurado.
- No hay dominio de correo dado de alta (ni aclcostarica.com ni subdominio).
- Al crear un usuario se genera contraseña pero no se envía correo alguno.

## Objetivo
Que los correos del sistema (incluida la invitación al crear un usuario) salgan desde el dominio **aclcostarica.com**, usando la infraestructura nativa de Lovable Emails.

## Fase 1 — Dar de alta el dominio de correo
- Configurar el dominio de envío (un subdominio del estilo `notify.aclcostarica.com`, recomendado para no interferir con el correo corporativo existente de aclcostarica.com).
- Esto requiere que Mónica/su equipo agregue unos registros DNS (NS) en el registrador de aclcostarica.com. Lovable genera esos registros y administra automáticamente SPF/DKIM/MX dentro de ese subdominio.
- La verificación DNS puede tardar hasta 72 horas; el resto del trabajo puede avanzar en paralelo.

```text
Remitente visible:   ACL Costa Rica <invitaciones@aclcostarica.com>
Subdominio técnico:  notify.aclcostarica.com  (gestionado por Lovable)
```

## Fase 2 — Infraestructura de correo
- Activar la infraestructura de Lovable Emails (cola de envíos, registro de correos enviados, lista de supresión, etc.).

## Fase 3 — Plantilla y envío de invitación
- Crear una plantilla de correo de invitación con la marca ACL (tipografías Caslon/Mulish, paleta navy/cream/gold), incluyendo:
  - Bienvenida al portal.
  - Credenciales de acceso o enlace para establecer contraseña.
  - Enlace al portal (dashboard.aclcostarica.com).
- Modificar la función `admin-create-user` para que, tras crear el usuario, dispare el envío del correo de invitación al email del nuevo usuario.

## Detalles técnicos
- Se usará la infraestructura nativa de Lovable (sin claves externas ni Resend).
- El remitente debe usar el subdominio verificado para la entrega; el dominio visible puede ser `aclcostarica.com`.
- La invitación se envía a un único destinatario por cada usuario creado (no es correo masivo).
- Si el equipo prefiere enviar un **enlace para que el usuario fije su propia contraseña** en lugar de mandar la contraseña autogenerada, lo ajustamos en la Fase 3.

## Decisión pendiente para confirmar antes/durante la implementación
- ¿La invitación debe incluir la **contraseña autogenerada**, o un **enlace para que el usuario cree su propia contraseña** (más seguro)?
- ¿Dirección remitente exacta? (sugerido: `invitaciones@aclcostarica.com`).
