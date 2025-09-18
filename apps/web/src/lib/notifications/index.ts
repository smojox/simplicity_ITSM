import { SlackNotificationService } from './slack'
import { EmailNotificationService } from './email'

export interface NotificationData {
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
}

export class NotificationService {
  private slack: SlackNotificationService
  private email: EmailNotificationService

  constructor() {
    this.slack = new SlackNotificationService()
    this.email = new EmailNotificationService()
  }

  async sendIncidentNotification(data: NotificationData, recipients?: string[]): Promise<void> {
    const promises: Promise<boolean>[] = []

    // Send Slack notification
    promises.push(this.slack.sendIncidentNotification(data))

    // Send email notifications to recipients
    if (recipients && recipients.length > 0) {
      for (const email of recipients) {
        promises.push(
          this.email.sendIncidentNotification({
            ...data,
            recipient: {
              name: email.split('@')[0], // Simple name extraction
              email: email
            }
          })
        )
      }
    }

    try {
      await Promise.allSettled(promises)
    } catch (error) {
      console.error('Failed to send notifications:', error)
    }
  }

  async sendIncidentCreated(data: {
    incident: any
    organization: any
    assignees?: string[]
  }): Promise<void> {
    const notificationData: NotificationData = {
      incident: data.incident,
      action: 'created',
      user: {
        name: 'System',
        email: 'system@simplicity.com'
      },
      organization: data.organization
    }

    await this.sendIncidentNotification(notificationData, data.assignees)
  }

  async sendIncidentStatusChanged(data: {
    incident: any
    organization: any
    oldStatus: string
    newStatus: string
    updatedBy: any
  }): Promise<void> {
    const notificationData: NotificationData = {
      incident: data.incident,
      action: data.newStatus === 'resolved' ? 'resolved' : 'updated',
      user: {
        name: data.updatedBy.name || 'Unknown User',
        email: data.updatedBy.email || 'unknown@simplicity.com'
      },
      organization: data.organization
    }

    await this.sendIncidentNotification(notificationData)
  }

  async sendIncidentSeverityChanged(data: {
    incident: any
    organization: any
    oldSeverity: string
    newSeverity: string
    updatedBy: any
  }): Promise<void> {
    const notificationData: NotificationData = {
      incident: data.incident,
      action: 'escalated',
      user: {
        name: data.updatedBy.name || 'Unknown User',
        email: data.updatedBy.email || 'unknown@simplicity.com'
      },
      organization: data.organization
    }

    await this.sendIncidentNotification(notificationData)
  }

  async testNotifications(): Promise<{ slack: boolean; email: boolean }> {
    const [slackResult, emailResult] = await Promise.allSettled([
      this.slack.testConnection(),
      this.email.testConnection()
    ])

    return {
      slack: slackResult.status === 'fulfilled' && slackResult.value,
      email: emailResult.status === 'fulfilled' && emailResult.value
    }
  }
}

export { SlackNotificationService, EmailNotificationService }