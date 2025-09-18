import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { StripeBillingService, SUBSCRIPTION_PLANS } from '@/lib/billing/stripe'
import connectToDatabase from '@/lib/db/connection'
import { OrganizationModel, UserModel } from '@/lib/models/organization'

const billing = new StripeBillingService()

interface RouteParams {
  params: {
    orgId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.orgId !== params.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()

    const organization = await OrganizationModel.findById(params.orgId).lean()

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
    }

    // Check if user has billing access
    const user = await UserModel.findById(session.user.id).lean()
    if (!user?.roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const currentPlan = billing.getPlanFeatures(organization.plan)

    const billingInfo = {
      currentPlan: {
        id: organization.plan,
        name: currentPlan.name,
        price: currentPlan.price,
        features: currentPlan.features,
        limits: currentPlan.limits
      },
      subscription: {
        status: organization.billing?.subscriptionStatus || 'inactive',
        currentPeriodEnd: organization.billing?.currentPeriodEnd,
        customerId: organization.billing?.stripeCustomerId
      },
      availablePlans: Object.values(SUBSCRIPTION_PLANS),
      usage: {
        users: await UserModel.countDocuments({ orgId: params.orgId }),
        incidents: await connectToDatabase().then(() =>
          require('@/lib/models/incident').IncidentModel.countDocuments({ orgId: params.orgId })
        ).catch(() => 0)
      }
    }

    return NextResponse.json({
      success: true,
      data: billingInfo
    })

  } catch (error) {
    console.error('Error fetching billing info:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing information' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.orgId !== params.orgId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()

    const organization = await OrganizationModel.findById(params.orgId)
    const user = await UserModel.findById(session.user.id)

    if (!organization || !user) {
      return NextResponse.json({ error: 'Organization or user not found' }, { status: 404 })
    }

    if (!user.roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, planId } = body

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/dashboard/${params.orgId}/billing?success=true`
    const cancelUrl = `${baseUrl}/dashboard/${params.orgId}/billing?canceled=true`

    switch (action) {
      case 'create-checkout-session': {
        if (!planId || planId === 'free') {
          return NextResponse.json({ error: 'Invalid plan for checkout' }, { status: 400 })
        }

        // Create Stripe customer if doesn't exist
        let customerId = organization.billing?.stripeCustomerId

        if (!customerId) {
          customerId = await billing.createCustomer(
            organization._id.toString(),
            user.email,
            organization.name
          )

          await OrganizationModel.updateOne(
            { _id: organization._id },
            { $set: { 'billing.stripeCustomerId': customerId } }
          )
        }

        const plan = billing.getPlanFeatures(planId)
        if (!plan) {
          return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
        }

        // Create checkout session (using demo price IDs)
        const priceId = planId === 'pro' ? 'price_1234_pro' : 'price_1234_enterprise'
        const checkoutUrl = await billing.createCheckoutSession(
          customerId,
          priceId,
          successUrl,
          cancelUrl
        )

        return NextResponse.json({
          success: true,
          data: { checkoutUrl }
        })
      }

      case 'create-portal-session': {
        const customerId = organization.billing?.stripeCustomerId

        if (!customerId) {
          return NextResponse.json({ error: 'No customer found' }, { status: 400 })
        }

        const portalUrl = await billing.createPortalSession(
          customerId,
          `${baseUrl}/dashboard/${params.orgId}/billing`
        )

        return NextResponse.json({
          success: true,
          data: { portalUrl }
        })
      }

      case 'cancel-subscription': {
        const subscriptionId = organization.billing?.subscriptionId

        if (!subscriptionId) {
          return NextResponse.json({ error: 'No active subscription' }, { status: 400 })
        }

        await billing.cancelSubscription(subscriptionId)

        return NextResponse.json({
          success: true,
          message: 'Subscription canceled successfully'
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error processing billing request:', error)
    return NextResponse.json(
      { error: 'Failed to process billing request' },
      { status: 500 }
    )
  }
}