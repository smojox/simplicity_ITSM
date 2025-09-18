import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/connection'
import { IncidentModel } from '@/lib/models/incident'
import { AuditLogger } from '@/lib/audit/logger'
import { NotificationService } from '@/lib/notifications'
import { withTenant, hasFeature } from '@simplicity/lib'

interface RouteParams {
  orgId: string
}

export const GET = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  // Check if user has incident management feature
  if (!hasFeature(tenantContext.org, 'incidentManagement')) {
    return NextResponse.json(
      { success: false, error: 'Incident management feature not available' },
      { status: 403 }
    )
  }

  // Check permissions
  if (!tenantContext.canAccess('incidents:read')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
    const status = url.searchParams.get('status')
    const severity = url.searchParams.get('severity')
    const assignee = url.searchParams.get('assignee')

    // Build query
    const query: any = { orgId: params.orgId }

    if (status) query.status = status
    if (severity) query.severity = severity
    if (assignee) query.assignees = assignee

    // Get total count
    const total = await IncidentModel.countDocuments(query)

    // Get incidents with pagination
    const incidents = await IncidentModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const response: PaginatedResponse<Incident> = {
      success: true,
      data: incidents as Incident[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
})

export const POST = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  // Check feature availability
  if (!hasFeature(tenantContext.org, 'incidentManagement')) {
    return NextResponse.json(
      { success: false, error: 'Incident management feature not available' },
      { status: 403 }
    )
  }

  // Check permissions
  if (!tenantContext.canAccess('incidents:write')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const body = await request.json()
    const { title, description, severity = 'P3', assignees = [] } = body

    if (!title || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create incident
    const incident = new IncidentModel({
      orgId: params.orgId,
      title: title.trim(),
      description: description?.trim(),
      severity,
      status: 'open',
      assignees,
      reporterId: tenantContext.user._id,
      timeline: [
        {
          userId: tenantContext.user._id,
          type: 'note',
          text: 'Incident created',
          timestamp: new Date()
        }
      ]
    })

    const savedIncident = await incident.save()

    // Send notifications
    try {
      const notificationService = new NotificationService()
      await notificationService.sendIncidentCreated({
        incident: savedIncident.toObject(),
        organization: tenantContext.org,
        assignees
      })
    } catch (error) {
      console.error('Failed to send notifications:', error)
    }

    // Log audit event
    await AuditLogger.logIncidentCreated(
      params.orgId,
      tenantContext.user._id.toString(),
      savedIncident._id.toString(),
      savedIncident.toObject(),
      request
    )

    const response: APIResponse<Incident> = {
      success: true,
      data: savedIncident.toObject(),
      message: 'Incident created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating incident:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create incident' },
      { status: 500 }
    )
  }
})