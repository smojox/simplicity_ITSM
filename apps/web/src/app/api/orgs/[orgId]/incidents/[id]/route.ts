import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, IncidentModel } from '@simplicity/db'
import { withTenant, hasFeature } from '@simplicity/lib'
import { AuditLogger } from '@/lib/audit/logger'
import { NotificationService } from '@/lib/notifications'
import type { APIResponse, Incident } from '@simplicity/types'

interface RouteParams {
  orgId: string
  id: string
}

export const GET = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  if (!hasFeature(tenantContext.org, 'incidentManagement')) {
    return NextResponse.json(
      { success: false, error: 'Incident management feature not available' },
      { status: 403 }
    )
  }

  if (!tenantContext.canAccess('incidents:read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const incident = await IncidentModel
      .findOne({ _id: params.id, orgId: params.orgId })
      .lean()

    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }

    const response: APIResponse<Incident> = {
      success: true,
      data: incident as Incident
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
})

export const PATCH = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  if (!hasFeature(tenantContext.org, 'incidentManagement')) {
    return NextResponse.json(
      { success: false, error: 'Incident management feature not available' },
      { status: 403 }
    )
  }

  if (!tenantContext.canAccess('incidents:write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const body = await request.json()
    const { status, severity, assignees, title, description } = body

    const incident = await IncidentModel.findOne({
      _id: params.id,
      orgId: params.orgId
    })

    if (!incident) {
      return NextResponse.json(
        { success: false, error: 'Incident not found' },
        { status: 404 }
      )
    }

    const updates: any = {}
    const timelineEntries: any[] = []

    // Track changes for timeline
    if (status && status !== incident.status) {
      updates.status = status
      timelineEntries.push({
        userId: tenantContext.user._id,
        type: 'status',
        text: `Status changed from ${incident.status} to ${status}`,
        timestamp: new Date(),
        oldValue: incident.status,
        newValue: status
      })

      if (status === 'resolved') {
        updates.resolvedAt = new Date()
      }
    }

    if (severity && severity !== incident.severity) {
      updates.severity = severity
      timelineEntries.push({
        userId: tenantContext.user._id,
        type: 'severity',
        text: `Severity changed from ${incident.severity} to ${severity}`,
        timestamp: new Date(),
        oldValue: incident.severity,
        newValue: severity
      })
    }

    if (assignees && JSON.stringify(assignees) !== JSON.stringify(incident.assignees)) {
      updates.assignees = assignees
      timelineEntries.push({
        userId: tenantContext.user._id,
        type: 'assignment',
        text: 'Assignees updated',
        timestamp: new Date()
      })
    }

    if (title && title !== incident.title) {
      updates.title = title
    }

    if (description !== undefined && description !== incident.description) {
      updates.description = description
    }

    // Add timeline entries
    if (timelineEntries.length > 0) {
      updates.$push = { timeline: { $each: timelineEntries } }
    }

    const updatedIncident = await IncidentModel.findOneAndUpdate(
      { _id: params.id, orgId: params.orgId },
      updates,
      { new: true, lean: true }
    )

    // Send notifications for significant updates
    if (timelineEntries.length > 0) {
      try {
        const notificationService = new NotificationService()

        // Notify on status changes
        if (updates.status) {
          await notificationService.sendIncidentStatusChanged({
            incident: updatedIncident,
            organization: tenantContext.org,
            oldStatus: incident.status,
            newStatus: updates.status,
            updatedBy: tenantContext.user
          })
        }

        // Notify on severity changes
        if (updates.severity) {
          await notificationService.sendIncidentSeverityChanged({
            incident: updatedIncident,
            organization: tenantContext.org,
            oldSeverity: incident.severity,
            newSeverity: updates.severity,
            updatedBy: tenantContext.user
          })
        }
      } catch (error) {
        console.error('Failed to send notifications:', error)
      }
    }

    // Log audit event
    if (Object.keys(updates).length > 0) {
      await AuditLogger.logIncidentUpdated(
        params.orgId,
        tenantContext.user._id.toString(),
        params.id,
        updates,
        request
      )
    }

    const response: APIResponse<Incident> = {
      success: true,
      data: updatedIncident as Incident,
      message: 'Incident updated successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update incident' },
      { status: 500 }
    )
  }
})