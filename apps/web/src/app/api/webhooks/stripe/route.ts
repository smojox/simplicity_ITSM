import { NextRequest, NextResponse } from 'next/server'
import { StripeBillingService } from '@/lib/billing/stripe'
import connectToDatabase from '@/lib/db/connection'
import { OrganizationModel } from '@/lib/models/organization'

const billing = new StripeBillingService()

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }

    // Verify webhook signature
    if (!billing.verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    console.log(`Processing Stripe webhook: ${event.type}`)

    await connectToDatabase()

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionCancellation(event.data.object)
        break

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleSubscriptionUpdate(subscription: any) {
  try {
    const customerId = subscription.customer
    const priceId = subscription.items.data[0]?.price?.id
    const planId = billing.getPlanFromPriceId(priceId)

    // Find organization by Stripe customer ID
    const organization = await OrganizationModel.findOne({
      'billing.stripeCustomerId': customerId
    })

    if (!organization) {
      console.error(`Organization not found for customer ${customerId}`)
      return
    }

    // Update organization plan and features
    const planFeatures = billing.getPlanFeatures(planId)

    await OrganizationModel.updateOne(
      { _id: organization._id },
      {
        $set: {
          plan: planId,
          'settings.features': planFeatures.features,
          'billing.subscriptionId': subscription.id,
          'billing.subscriptionStatus': subscription.status,
          'billing.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
          updatedAt: new Date()
        }
      }
    )

    console.log(`Updated organization ${organization._id} to plan ${planId}`)

  } catch (error) {
    console.error('Failed to handle subscription update:', error)
  }
}

async function handleSubscriptionCancellation(subscription: any) {
  try {
    const customerId = subscription.customer

    // Find organization and downgrade to free plan
    const organization = await OrganizationModel.findOne({
      'billing.stripeCustomerId': customerId
    })

    if (!organization) {
      console.error(`Organization not found for customer ${customerId}`)
      return
    }

    const freePlanFeatures = billing.getPlanFeatures('free')

    await OrganizationModel.updateOne(
      { _id: organization._id },
      {
        $set: {
          plan: 'free',
          'settings.features': freePlanFeatures.features,
          'billing.subscriptionStatus': 'canceled',
          updatedAt: new Date()
        },
        $unset: {
          'billing.subscriptionId': '',
          'billing.currentPeriodEnd': ''
        }
      }
    )

    console.log(`Downgraded organization ${organization._id} to free plan`)

  } catch (error) {
    console.error('Failed to handle subscription cancellation:', error)
  }
}

async function handlePaymentSucceeded(invoice: any) {
  try {
    const customerId = invoice.customer
    const amountPaid = invoice.amount_paid / 100 // Convert from cents

    console.log(`Payment succeeded for customer ${customerId}: $${amountPaid}`)

    // Could log this to an audit trail or send confirmation email
    // For now, just log the successful payment

  } catch (error) {
    console.error('Failed to handle payment success:', error)
  }
}

async function handlePaymentFailed(invoice: any) {
  try {
    const customerId = invoice.customer

    // Find organization to notify about failed payment
    const organization = await OrganizationModel.findOne({
      'billing.stripeCustomerId': customerId
    })

    if (organization) {
      // Could send notification to organization admins about payment failure
      console.log(`Payment failed for organization ${organization._id}`)

      // Update billing status
      await OrganizationModel.updateOne(
        { _id: organization._id },
        {
          $set: {
            'billing.paymentStatus': 'failed',
            'billing.lastPaymentAttempt': new Date(),
            updatedAt: new Date()
          }
        }
      )
    }

  } catch (error) {
    console.error('Failed to handle payment failure:', error)
  }
}