interface SlackMessage {
  text: string
  blocks?: any[]
  channel?: string
}

interface IncidentNotification {
  incident: {
    _id: string
    title: string
    description?: string
    severity: string
    status: string
    orgId: string
  }
  action: 'created' | 'updated' | 'resolved' | 'escalated'
  user: {
    name: string
    email: string
  }
  organization: {
    name: string
  }
}

export class SlackNotificationService {
  private webhookUrl: string

  constructor(webhookUrl?: string) {
    this.webhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL || ''
  }

  async sendIncidentNotification(notification: IncidentNotification): Promise<boolean> {
    if (!this.webhookUrl) {
      console.warn('Slack webhook URL not configured, skipping notification')
      return false
    }

    try {
      const message = this.buildIncidentMessage(notification)
      await this.sendMessage(message)
      console.log(`Slack notification sent for incident ${notification.incident._id}`)
      return true
    } catch (error) {
      console.error('Failed to send Slack notification:', error)
      return false
    }
  }

  private buildIncidentMessage(notification: IncidentNotification): SlackMessage {
    const { incident, action, user, organization } = notification

    const severityEmoji = {
      P1: '🚨',
      P2: '⚠️',
      P3: '⚡',
      P4: '📝'
    }[incident.severity] || '📝'

    const statusEmoji = {
      created: '🆕',
      updated: '🔄',
      resolved: '✅',
      escalated: '⬆️'
    }[action] || '🔄'

    const actionText = {
      created: 'created',
      updated: 'updated',
      resolved: 'resolved',
      escalated: 'escalated'
    }[action] || 'updated'

    const text = `${statusEmoji} Incident ${actionText} by ${user.name}`

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${severityEmoji} ${incident.title}`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Severity:* ${incident.severity}`
          },
          {
            type: 'mrkdwn',
            text: `*Status:* ${incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}`
          },
          {
            type: 'mrkdwn',
            text: `*Organization:* ${organization.name}`
          },
          {
            type: 'mrkdwn',
            text: `*Reporter:* ${user.name} (${user.email})`
          }
        ]
      }
    ]

    if (incident.description) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Description:*\n${incident.description}`
        }
      })
    }

    // Add action buttons for open incidents
    if (incident.status !== 'resolved' && incident.status !== 'closed') {
      blocks.push({
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Incident',
              emoji: true
            },
            url: `${process.env.NEXTAUTH_URL}/dashboard/${incident.orgId}/incidents/${incident._id}`,
            style: 'primary'
          }
        ]
      })
    }

    blocks.push({
      type: 'divider'
    })

    return {
      text,
      blocks
    }
  }

  private async sendMessage(message: SlackMessage): Promise<void> {
    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`)
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const testMessage: SlackMessage = {
        text: '🧪 Test message from Simplicity ITSM',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ Slack integration is working correctly!'
            }
          }
        ]
      }

      await this.sendMessage(testMessage)
      return true
    } catch (error) {
      console.error('Slack connection test failed:', error)
      return false
    }
  }
}