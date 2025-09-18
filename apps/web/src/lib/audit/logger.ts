import { NextRequest } from 'next/server'
import connectToDatabase from '@/lib/db/connection'
import { AuditLogModel } from '@/lib/models/audit-log'

interface AuditLogData {
  orgId: string
  userId: string
  action: string
  resource: string
  resourceId: string
  details?: Record<string, any>
  request?: NextRequest
}

export class AuditLogger {
  static async log(data: AuditLogData): Promise<void> {
    try {
      await connectToDatabase()

      const logEntry = {
        orgId: data.orgId,
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details || {},
        ipAddress: data.request ? this.getClientIP(data.request) : undefined,
        userAgent: data.request?.headers.get('user-agent') || undefined,
        timestamp: new Date()
      }

      const auditLog = new AuditLogModel(logEntry)
      await auditLog.save()

      console.log(`Audit log created: ${data.action} ${data.resource} ${data.resourceId} by user ${data.userId}`)

    } catch (error) {
      // Don't throw errors for audit logging failures to avoid breaking main functionality
      console.error('Failed to create audit log:', error)
    }
  }

  static async getAuditLogs(
    orgId: string,
    options: {
      resource?: string
      resourceId?: string
      userId?: string
      action?: string
      startDate?: Date
      endDate?: Date
      limit?: number
      offset?: number
    } = {}
  ): Promise<any[]> {
    try {
      await connectToDatabase()

      const query: any = { orgId }

      if (options.resource) query.resource = options.resource
      if (options.resourceId) query.resourceId = options.resourceId
      if (options.userId) query.userId = options.userId
      if (options.action) query.action = options.action

      if (options.startDate || options.endDate) {
        query.timestamp = {}
        if (options.startDate) query.timestamp.$gte = options.startDate
        if (options.endDate) query.timestamp.$lte = options.endDate
      }

      const auditLogs = await AuditLogModel
        .find(query)
        .sort({ timestamp: -1 })
        .limit(options.limit || 100)
        .skip(options.offset || 0)
        .lean()

      return auditLogs

    } catch (error) {
      console.error('Failed to fetch audit logs:', error)
      return []
    }
  }

  static async getResourceHistory(
    orgId: string,
    resource: string,
    resourceId: string,
    limit: number = 50
  ): Promise<any[]> {
    return this.getAuditLogs(orgId, {
      resource,
      resourceId,
      limit
    })
  }

  static async getUserActivity(
    orgId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<any[]> {
    return this.getAuditLogs(orgId, {
      userId,
      startDate,
      endDate,
      limit
    })
  }

  // Helper methods for common audit events
  static async logIncidentCreated(
    orgId: string,
    userId: string,
    incidentId: string,
    incidentData: any,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'create',
      resource: 'incident',
      resourceId: incidentId,
      details: {
        title: incidentData.title,
        severity: incidentData.severity,
        status: incidentData.status
      },
      request
    })
  }

  static async logIncidentUpdated(
    orgId: string,
    userId: string,
    incidentId: string,
    changes: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'update',
      resource: 'incident',
      resourceId: incidentId,
      details: { changes },
      request
    })
  }

  static async logUserLogin(
    orgId: string,
    userId: string,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'login',
      resource: 'user',
      resourceId: userId,
      request
    })
  }

  static async logSettingsChanged(
    orgId: string,
    userId: string,
    settingsType: string,
    changes: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: 'update',
      resource: 'settings',
      resourceId: settingsType,
      details: { changes },
      request
    })
  }

  static async logBillingEvent(
    orgId: string,
    userId: string,
    event: string,
    details: Record<string, any>,
    request?: NextRequest
  ): Promise<void> {
    await this.log({
      orgId,
      userId,
      action: event,
      resource: 'billing',
      resourceId: orgId,
      details,
      request
    })
  }

  private static getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('remote-addr')

    if (forwarded) {
      return forwarded.split(',')[0].trim()
    }

    return realIP || remoteAddr || 'unknown'
  }

  // Generate audit report
  static async generateAuditReport(
    orgId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    summary: Record<string, number>
    topUsers: Array<{ userId: string; count: number }>
    topActions: Array<{ action: string; count: number }>
    timeline: Array<{ date: string; count: number }>
  }> {
    try {
      await connectToDatabase()

      const pipeline = [
        {
          $match: {
            orgId,
            timestamp: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: '$resource',
                  count: { $sum: 1 }
                }
              }
            ],
            topUsers: [
              {
                $group: {
                  _id: '$userId',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            topActions: [
              {
                $group: {
                  _id: '$action',
                  count: { $sum: 1 }
                }
              },
              { $sort: { count: -1 } },
              { $limit: 10 }
            ],
            timeline: [
              {
                $group: {
                  _id: {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      date: '$timestamp'
                    }
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id': 1 } }
            ]
          }
        }
      ]

      const [result] = await AuditLogModel.aggregate(pipeline)

      return {
        summary: result.summary.reduce((acc: any, item: any) => {
          acc[item._id] = item.count
          return acc
        }, {}),
        topUsers: result.topUsers.map((item: any) => ({
          userId: item._id,
          count: item.count
        })),
        topActions: result.topActions.map((item: any) => ({
          action: item._id,
          count: item.count
        })),
        timeline: result.timeline.map((item: any) => ({
          date: item._id,
          count: item.count
        }))
      }

    } catch (error) {
      console.error('Failed to generate audit report:', error)
      return {
        summary: {},
        topUsers: [],
        topActions: [],
        timeline: []
      }
    }
  }
}