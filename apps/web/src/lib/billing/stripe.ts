interface StripeConfig {
  secretKey: string
  webhookSecret: string
  priceIds: {
    free: null
    pro: string
    enterprise: string
  }
}

interface SubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  features: {
    incidentManagement: boolean
    problemManagement: boolean
    changeManagement: boolean
    requestFulfillment: boolean
    serviceCatalog: boolean
    knowledgeBase: boolean
    assetManagement: boolean
    slaManagement: boolean
  }
  limits: {
    users: number
    incidents: number
  }
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      incidentManagement: true,
      problemManagement: false,
      changeManagement: false,
      requestFulfillment: false,
      serviceCatalog: false,
      knowledgeBase: false,
      assetManagement: false,
      slaManagement: false
    },
    limits: {
      users: 3,
      incidents: 50
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    interval: 'month',
    features: {
      incidentManagement: true,
      problemManagement: true,
      changeManagement: false,
      requestFulfillment: true,
      serviceCatalog: false,
      knowledgeBase: true,
      assetManagement: false,
      slaManagement: true
    },
    limits: {
      users: 25,
      incidents: 1000
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    interval: 'month',
    features: {
      incidentManagement: true,
      problemManagement: true,
      changeManagement: true,
      requestFulfillment: true,
      serviceCatalog: true,
      knowledgeBase: true,
      assetManagement: true,
      slaManagement: true
    },
    limits: {
      users: -1, // unlimited
      incidents: -1 // unlimited
    }
  }
}

export class StripeBillingService {
  private config: StripeConfig

  constructor() {
    this.config = {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
      priceIds: {
        free: null,
        pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
        enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly'
      }
    }
  }

  async createCustomer(organizationId: string, email: string, name: string): Promise<string> {
    if (!this.config.secretKey) {
      throw new Error('Stripe not configured')
    }

    const response = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        name,
        metadata: JSON.stringify({
          organizationId
        })
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe customer creation failed: ${error}`)
    }

    const customer = await response.json()
    return customer.id
  }

  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<string> {
    if (!this.config.secretKey) {
      throw new Error('Stripe not configured')
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        'allow_promotion_codes': 'true'
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe checkout session creation failed: ${error}`)
    }

    const session = await response.json()
    return session.url
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<string> {
    if (!this.config.secretKey) {
      throw new Error('Stripe not configured')
    }

    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Stripe portal session creation failed: ${error}`)
    }

    const session = await response.json()
    return session.url
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.config.secretKey) {
      throw new Error('Stripe not configured')
    }

    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to get subscription: ${error}`)
    }

    return response.json()
  }

  async cancelSubscription(subscriptionId: string): Promise<any> {
    if (!this.config.secretKey) {
      throw new Error('Stripe not configured')
    }

    const response = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.config.secretKey}`,
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to cancel subscription: ${error}`)
    }

    return response.json()
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return false
    }

    // Simple signature verification - in production, use Stripe's library
    // This is a simplified implementation for demonstration
    try {
      const expectedSignature = `sha256=${require('crypto')
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex')}`

      return signature.includes(expectedSignature)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return false
    }
  }

  getPlanFromPriceId(priceId: string): string {
    for (const [planId, config] of Object.entries(this.config.priceIds)) {
      if (config === priceId) {
        return planId
      }
    }
    return 'free'
  }

  getPlanFeatures(planId: string): SubscriptionPlan {
    return SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.free
  }

  isFeatureAvailable(planId: string, feature: keyof SubscriptionPlan['features']): boolean {
    const plan = this.getPlanFeatures(planId)
    return plan.features[feature]
  }

  checkUsageLimits(planId: string, currentUsers: number, currentIncidents: number): {
    usersExceeded: boolean
    incidentsExceeded: boolean
  } {
    const plan = this.getPlanFeatures(planId)

    return {
      usersExceeded: plan.limits.users > 0 && currentUsers > plan.limits.users,
      incidentsExceeded: plan.limits.incidents > 0 && currentIncidents > plan.limits.incidents
    }
  }
}