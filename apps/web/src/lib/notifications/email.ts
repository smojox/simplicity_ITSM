interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface IncidentEmailData {
  incident: {
    _id: string
    title: string
    description?: string
    severity: string
    status: string
    orgId: string
    createdAt: string
    updatedAt: string
  }
  action: 'created' | 'updated' | 'resolved' | 'escalated'
  user: {
    name: string
    email: string
  }
  organization: {
    name: string
  }
  recipient: {
    name: string
    email: string
  }
}

export class EmailNotificationService {
  private apiKey: string
  private fromEmail: string
  private provider: 'sendgrid' | 'resend'

  constructor() {
    this.apiKey = process.env.SENDGRID_API_KEY || process.env.RESEND_API_KEY || ''
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@simplicity-itsm.com'
    this.provider = process.env.SENDGRID_API_KEY ? 'sendgrid' : 'resend'
  }

  async sendIncidentNotification(data: IncidentEmailData): Promise<boolean> {
    if (!this.apiKey) {
      console.warn('Email API key not configured, skipping email notification')
      return false
    }

    try {
      const template = this.buildEmailTemplate(data)

      if (this.provider === 'sendgrid') {
        await this.sendViaSendGrid(data.recipient.email, template)
      } else {
        await this.sendViaResend(data.recipient.email, template)
      }

      console.log(`Email notification sent to ${data.recipient.email} for incident ${data.incident._id}`)
      return true
    } catch (error) {
      console.error('Failed to send email notification:', error)
      return false
    }
  }

  private buildEmailTemplate(data: IncidentEmailData): EmailTemplate {
    const { incident, action, user, organization, recipient } = data

    const actionText = {
      created: 'created',
      updated: 'updated',
      resolved: 'resolved',
      escalated: 'escalated'
    }[action] || 'updated'

    const severityColor = {
      P1: '#dc2626', // red-600
      P2: '#ea580c', // orange-600
      P3: '#ca8a04', // yellow-600
      P4: '#2563eb'  // blue-600
    }[incident.severity] || '#6b7280'

    const statusBadge = {
      open: { color: '#dc2626', text: 'Open' },
      acknowledged: { color: '#ca8a04', text: 'Acknowledged' },
      investigating: { color: '#2563eb', text: 'Investigating' },
      resolved: { color: '#16a34a', text: 'Resolved' },
      closed: { color: '#6b7280', text: 'Closed' }
    }[incident.status] || { color: '#6b7280', text: incident.status }

    const subject = `[${incident.severity}] Incident ${actionText}: ${incident.title}`

    const dashboardUrl = `${process.env.NEXTAUTH_URL}/dashboard/${incident.orgId}/incidents/${incident._id}`

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f9fafb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">Simplicity ITSM</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9;">Incident Management Notification</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px 24px;">

          <!-- Incident Header -->
          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
              <span style="background-color: ${severityColor}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">${incident.severity}</span>
              <span style="background-color: ${statusBadge.color}; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">${statusBadge.text}</span>
            </div>
            <h2 style="margin: 0; color: #1f2937; font-size: 20px; line-height: 1.3;">${incident.title}</h2>
          </div>

          <!-- Description -->
          ${incident.description ? `
          <div style="margin-bottom: 24px;">
            <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Description</h3>
            <p style="margin: 0; color: #6b7280; line-height: 1.5;">${incident.description}</p>
          </div>
          ` : ''}

          <!-- Details -->
          <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
            <h3 style="margin: 0 0 16px 0; color: #374151; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Incident Details</h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div>
                <div style="color: #6b7280; font-size: 12px; font-weight: 500; margin-bottom: 4px;">Organization</div>
                <div style="color: #1f2937; font-weight: 500;">${organization.name}</div>
              </div>

              <div>
                <div style="color: #6b7280; font-size: 12px; font-weight: 500; margin-bottom: 4px;">Reporter</div>
                <div style="color: #1f2937; font-weight: 500;">${user.name}</div>
              </div>

              <div>
                <div style="color: #6b7280; font-size: 12px; font-weight: 500; margin-bottom: 4px;">Created</div>
                <div style="color: #1f2937; font-weight: 500;">${new Date(incident.createdAt).toLocaleString()}</div>
              </div>

              <div>
                <div style="color: #6b7280; font-size: 12px; font-weight: 500; margin-bottom: 4px;">Last Updated</div>
                <div style="color: #1f2937; font-weight: 500;">${new Date(incident.updatedAt).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <!-- Action Button -->
          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 16px;">
              View Incident in Dashboard
            </a>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center;">
            <p style="margin: 0; color: #6b7280; font-size: 12px;">
              This notification was sent to ${recipient.email} for incident management purposes.
            </p>
            <p style="margin: 8px 0 0 0; color: #6b7280; font-size: 12px;">
              Incident ID: ${incident._id}
            </p>
          </div>

        </div>
      </div>
    </body>
    </html>
    `

    const text = `
    ${subject}

    Organization: ${organization.name}
    Reporter: ${user.name} (${user.email})
    Severity: ${incident.severity}
    Status: ${incident.status}

    ${incident.description ? `Description: ${incident.description}\n\n` : ''}

    Created: ${new Date(incident.createdAt).toLocaleString()}
    Last Updated: ${new Date(incident.updatedAt).toLocaleString()}

    View in dashboard: ${dashboardUrl}

    Incident ID: ${incident._id}
    `

    return { subject, html, text }
  }

  private async sendViaSendGrid(to: string, template: EmailTemplate): Promise<void> {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: this.fromEmail, name: 'Simplicity ITSM' },
        subject: template.subject,
        content: [
          { type: 'text/plain', value: template.text },
          { type: 'text/html', value: template.html }
        ]
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid API error: ${response.status} ${error}`)
    }
  }

  private async sendViaResend(to: string, template: EmailTemplate): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Simplicity ITSM <${this.fromEmail}>`,
        to: [to],
        subject: template.subject,
        text: template.text,
        html: template.html,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Resend API error: ${response.status} ${error}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testData: IncidentEmailData = {
        incident: {
          _id: 'test-incident-id',
          title: 'Test Email Notification',
          description: 'This is a test email to verify the email notification system is working correctly.',
          severity: 'P3',
          status: 'open',
          orgId: 'test-org',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        action: 'created',
        user: {
          name: 'Test User',
          email: 'test@example.com'
        },
        organization: {
          name: 'Test Organization'
        },
        recipient: {
          name: 'Test Recipient',
          email: 'test@example.com'
        }
      }

      await this.sendIncidentNotification(testData)
      return true
    } catch (error) {
      console.error('Email connection test failed:', error)
      return false
    }
  }
}