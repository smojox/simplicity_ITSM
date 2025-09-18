import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase, UserModel } from '@simplicity/db'
import { withTenant } from '@simplicity/lib'
import type { APIResponse, PaginatedResponse, User } from '@simplicity/types'

interface RouteParams {
  orgId: string
}

export const GET = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  if (!tenantContext.canAccess('users:manage')) {
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

    const query = { orgId: params.orgId }

    const total = await UserModel.countDocuments(query)

    const users = await UserModel
      .find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    const response: PaginatedResponse<User> = {
      success: true,
      data: users as User[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
})

export const POST = withTenant<RouteParams>(async (
  request: NextRequest,
  { params }
) => {
  const { tenantContext } = params as RouteParams & { tenantContext: any }

  if (!tenantContext.canAccess('users:manage')) {
    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    await connectToDatabase()

    const body = await request.json()
    const { email, name, roles = ['member'] } = body

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: 'Email and name are required' },
        { status: 400 }
      )
    }

    // Check if user already exists in this org
    const existingUser = await UserModel.findOne({
      email: email.toLowerCase(),
      orgId: params.orgId
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User already exists in this organization' },
        { status: 409 }
      )
    }

    const user = new UserModel({
      email: email.toLowerCase(),
      name: name.trim(),
      orgId: params.orgId,
      roles
    })

    const savedUser = await user.save()

    const response: APIResponse<User> = {
      success: true,
      data: savedUser.toObject(),
      message: 'User created successfully'
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
})