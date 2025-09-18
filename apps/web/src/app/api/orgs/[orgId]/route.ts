import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, OrganizationModel } from '@simplicity/db'
import { withTenant } from '@simplicity/lib'
import type { APIResponse, Organization } from '@simplicity/types'

interface RouteParams {
  orgId: string
}

export const GET = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  try {
    const response: APIResponse<Organization> = {
      success: true,
      data: tenantContext.org
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization' },
      { status: 500 }
    )
  }
})

export const PATCH = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  if (!tenantContext.canAccess('org:manage')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const body = await request.json()
    const { name, settings } = body

    const updates: any = {}

    if (name && name.trim()) {
      updates.name = name.trim()
    }

    if (settings) {
      // Only allow updating features that are available for the current plan
      if (settings.features) {
        updates['settings.features'] = {
          ...tenantContext.org.settings.features,
          ...settings.features
        }
      }
    }

    const updatedOrg = await OrganizationModel.findByIdAndUpdate(
      params.orgId,
      updates,
      { new: true, lean: true }
    )

    const response: APIResponse<Organization> = {
      success: true,
      data: updatedOrg as Organization,
      message: 'Organization updated successfully'
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update organization' },
      { status: 500 }
    )
  }
})