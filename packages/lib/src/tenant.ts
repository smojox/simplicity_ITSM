import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, OrganizationModel, UserModel } from '@simplicity/db'
import { authOptions } from './auth'
import type { Organization, User } from '@simplicity/types'

export interface TenantContext {
  org: Organization
  user: User
  canAccess: (resource: string) => boolean
}

export async function getTenantContext(request: NextRequest): Promise<TenantContext | null> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.orgId) {
      return null
    }

    await connectToDatabase()

    const [org, user] = await Promise.all([
      OrganizationModel.findById(session.user.orgId).lean(),
      UserModel.findById(session.user.id).lean()
    ])

    if (!org || !user) {
      return null
    }

    return {
      org: org as Organization,
      user: user as User,
      canAccess: (resource: string) => {
        // Basic RBAC implementation
        if (user.roles.includes('admin')) return true

        // Add more granular permissions as needed
        switch (resource) {
          case 'incidents:read':
          case 'incidents:write':
            return user.roles.includes('member') || user.roles.includes('oncall')
          case 'org:manage':
          case 'users:manage':
            return user.roles.includes('admin')
          default:
            return false
        }
      }
    }
  } catch (error) {
    console.error('Error getting tenant context:', error)
    return null
  }
}

export async function validateTenant(
  request: NextRequest,
  orgId: string
): Promise<{ success: true; context: TenantContext } | { success: false; error: string }> {
  const context = await getTenantContext(request)

  if (!context) {
    return { success: false, error: 'Unauthorized' }
  }

  if (context.org._id?.toString() !== orgId) {
    return { success: false, error: 'Forbidden - Invalid organization' }
  }

  return { success: true, context }
}

export function createTenantMiddleware() {
  return async function tenantMiddleware(
    request: NextRequest,
    handler: (context: TenantContext) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const url = new URL(request.url)
    const orgId = url.pathname.split('/')[3] // Extract orgId from /api/orgs/[orgId]/...

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const validation = await validateTenant(request, orgId)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.error === 'Unauthorized' ? 401 : 403 }
      )
    }

    return handler(validation.context)
  }
}

export function withTenant<T extends Record<string, unknown>>(
  handler: (request: NextRequest, context: { params: T }) => Promise<NextResponse>
) {
  return async function (
    request: NextRequest,
    { params }: { params: T }
  ): Promise<NextResponse> {
    const middleware = createTenantMiddleware()

    return middleware(request, async (tenantContext) => {
      // Add tenant context to params
      const enhancedParams = {
        ...params,
        tenantContext
      } as T & { tenantContext: TenantContext }

      return handler(request, { params: enhancedParams })
    })
  }
}