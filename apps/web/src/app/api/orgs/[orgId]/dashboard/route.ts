import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, IncidentModel } from '@simplicity/db'
import { withTenant, hasFeature } from '@simplicity/lib'
import type { APIResponse } from '@simplicity/types'

interface RouteParams {
  orgId: string
}

interface DashboardStats {
  incidents: {
    total: number
    open: number
    acknowledged: number
    investigating: number
    resolved: number
    byPriority: {
      P1: number
      P2: number
      P3: number
      P4: number
    }
  }
  recentActivity: any[]
  avgResolutionTime: number | null
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

    // Get incident statistics
    const incidentStats = await IncidentModel.aggregate([
      { $match: { orgId: params.orgId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          open: { $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] } },
          acknowledged: { $sum: { $cond: [{ $eq: ['$status', 'acknowledged'] }, 1, 0] } },
          investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          P1: { $sum: { $cond: [{ $eq: ['$severity', 'P1'] }, 1, 0] } },
          P2: { $sum: { $cond: [{ $eq: ['$severity', 'P2'] }, 1, 0] } },
          P3: { $sum: { $cond: [{ $eq: ['$severity', 'P3'] }, 1, 0] } },
          P4: { $sum: { $cond: [{ $eq: ['$severity', 'P4'] }, 1, 0] } },
        }
      }
    ])

    // Get recent activity
    const recentActivity = await IncidentModel
      .find({ orgId: params.orgId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('title status severity updatedAt')
      .lean()

    // Calculate average resolution time
    const resolvedIncidents = await IncidentModel
      .find({
        orgId: params.orgId,
        status: 'resolved',
        resolvedAt: { $exists: true }
      })
      .select('createdAt resolvedAt')
      .lean()

    let avgResolutionTime = null
    if (resolvedIncidents.length > 0) {
      const totalResolutionTime = resolvedIncidents.reduce((sum, incident) => {
        return sum + (incident.resolvedAt!.getTime() - incident.createdAt!.getTime())
      }, 0)
      avgResolutionTime = Math.round(totalResolutionTime / resolvedIncidents.length / (1000 * 60 * 60)) // hours
    }

    const stats = incidentStats[0] || {
      total: 0,
      open: 0,
      acknowledged: 0,
      investigating: 0,
      resolved: 0,
      P1: 0,
      P2: 0,
      P3: 0,
      P4: 0
    }

    const dashboardData: DashboardStats = {
      incidents: {
        total: stats.total,
        open: stats.open,
        acknowledged: stats.acknowledged,
        investigating: stats.investigating,
        resolved: stats.resolved,
        byPriority: {
          P1: stats.P1,
          P2: stats.P2,
          P3: stats.P3,
          P4: stats.P4
        }
      },
      recentActivity,
      avgResolutionTime
    }

    const response: APIResponse<DashboardStats> = {
      success: true,
      data: dashboardData
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
})