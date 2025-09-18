import mongoose, { Schema, Document } from 'mongoose'
import type { Organization } from '@simplicity/types'

export interface IOrganization extends Organization, Document {}

const organizationSchema = new Schema<IOrganization>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free',
    required: true
  },
  settings: {
    features: {
      incidentManagement: { type: Boolean, default: true },
      problemManagement: { type: Boolean, default: false },
      changeManagement: { type: Boolean, default: false },
      requestFulfillment: { type: Boolean, default: false },
      serviceCatalog: { type: Boolean, default: false },
      knowledgeBase: { type: Boolean, default: false },
      assetManagement: { type: Boolean, default: false },
      slaManagement: { type: Boolean, default: false }
    }
  },
  billing: {
    stripeCustomerId: { type: String }
  }
}, {
  timestamps: true
})

organizationSchema.index({ name: 1 })

export const OrganizationModel = mongoose.models.Organization || mongoose.model<IOrganization>('Organization', organizationSchema)