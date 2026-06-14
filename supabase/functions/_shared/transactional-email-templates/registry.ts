import type * as React from 'npm:react@18.3.1'
import { template as userInvitation } from './user-invitation.tsx'

// Shape every template must satisfy.
export interface TemplateEntry {
  // React Email component rendered with templateData as props.
  component: (props: any) => React.ReactElement
  // Subject line — static string or a function of templateData.
  subject: string | ((data: Record<string, any>) => string)
  // Optional human-friendly name shown in previews.
  displayName?: string
  // Optional preview data used by the preview function.
  previewData?: Record<string, any>
  // Optional fixed recipient (overrides caller-provided recipientEmail).
  to?: string
}

// Register all transactional templates here, keyed by templateName.
export const TEMPLATES: Record<string, TemplateEntry> = {
  'user-invitation': userInvitation,
}
