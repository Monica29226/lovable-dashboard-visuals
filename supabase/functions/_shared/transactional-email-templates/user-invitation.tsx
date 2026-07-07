import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  fullName?: string
  email?: string
  actionUrl?: string
  portalUrl?: string
}

const PORTAL = 'https://dashboard.aclcostarica.com'

const Email = ({
  fullName,
  email,
  actionUrl,
  portalUrl = PORTAL,
}: Props) => (
  <Html lang="es" dir="ltr">
    <Head />
    <Preview>Su acceso al portal de ACL Costa Rica está listo</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandBar}>
          <Text style={brandName}>ACL Costa Rica</Text>
          <Text style={brandTag}>Portal de clientes</Text>
        </Section>

        <Hr style={goldLine} />

        <Heading style={h1}>Bienvenido(a) a su portal</Heading>

        <Text style={text}>
          {fullName ? `Estimado(a) ${fullName},` : 'Estimado(a) cliente,'}
        </Text>
        <Text style={text}>
          Se ha creado una cuenta para usted en el portal financiero de ACL
          Costa Rica. Desde aquí podrá consultar sus finanzas, reportes y
          documentos en tiempo real.
        </Text>

        {email ? (
          <Section style={credBox}>
            <Text style={credLabel}>Correo de acceso</Text>
            <Text style={credValue}>{email}</Text>
            {password ? (
              <>
                <Text style={credLabel}>Contraseña temporal</Text>
                <Text style={credValue}>{password}</Text>
                <Text style={credNote}>
                  Por seguridad, le recomendamos cambiarla al iniciar sesión.
                </Text>
              </>
            ) : null}
          </Section>
        ) : null}

        <Section style={{ textAlign: 'center', margin: '32px 0' }}>
          <Link style={button} href={actionUrl || portalUrl}>
            {actionUrl ? 'Establecer mi contraseña' : 'Ingresar al portal'}
          </Link>
        </Section>

        <Text style={mutedText}>
          Si el botón no funciona, copie y pegue este enlace en su navegador:
          <br />
          <Link style={plainLink} href={actionUrl || portalUrl}>
            {actionUrl || portalUrl}
          </Link>
        </Text>

        <Hr style={lightLine} />

        <Text style={footer}>
          ACL Costa Rica · Este es un correo automático, por favor no responda a
          este mensaje.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Su acceso al portal de ACL Costa Rica',
  displayName: 'Invitación de usuario',
  previewData: {
    fullName: 'María Calderón',
    email: 'maria@empresa.com',
    password: 'Xy7$kP2mQ9rT4wZ1',
    portalUrl: PORTAL,
  },
} satisfies TemplateEntry

const navy = '#1c2b46'
const gold = '#b08a3e'
const cream = '#f7f4ee'

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
  color: navy,
}

const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px',
}

const brandBar = { textAlign: 'center' as const }

const brandName = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '22px',
  color: navy,
  margin: '0',
  letterSpacing: '0.5px',
}

const brandTag = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '2px',
  color: '#8a8a8a',
  margin: '4px 0 0',
}

const goldLine = {
  borderColor: gold,
  borderWidth: '1px',
  margin: '20px 0',
}

const lightLine = {
  borderColor: '#e6e1d8',
  margin: '28px 0 16px',
}

const h1 = {
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: '24px',
  color: navy,
  margin: '0 0 20px',
}

const text = {
  fontSize: '15px',
  lineHeight: '24px',
  color: '#33405c',
  margin: '0 0 14px',
}

const mutedText = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#7a7a7a',
  margin: '0 0 8px',
}

const credBox = {
  backgroundColor: cream,
  borderRadius: '8px',
  padding: '18px 20px',
  margin: '8px 0 8px',
}

const credLabel = {
  fontSize: '11px',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  color: '#8a8a8a',
  margin: '8px 0 2px',
}

const credValue = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: navy,
  margin: '0',
}

const credNote = {
  fontSize: '12px',
  color: '#7a7a7a',
  margin: '8px 0 0',
}

const button = {
  backgroundColor: navy,
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  padding: '14px 28px',
  borderRadius: '6px',
  display: 'inline-block',
}

const plainLink = { color: gold, fontSize: '13px', wordBreak: 'break-all' as const }

const footer = {
  fontSize: '12px',
  color: '#9a9a9a',
  textAlign: 'center' as const,
  margin: '0',
}

export default Email
