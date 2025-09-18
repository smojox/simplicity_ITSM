import mongoose, { Schema, Document } from 'mongoose'

export interface IAuditLog extends Document {
  orgId: string
  userId: string
  action: string
  resource: string
  resourceId: string
  details: Record<string, any>
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

const auditLogSchema = new Schema<IAuditLog>({
  orgId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'create',
      'read',
      'update',
      'delete',
      'login',
      'logout',
      'invite',
      'activate',
      'deactivate',
      'export',
      'import',
      'backup',
      'restore'
    ]
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'incident',
      'problem',
      'change',
      'user',
      'organization',
      'settings',
      'billing',
      'notification',
      'report',
      'dashboard'
    ]
  },
  resourceId: {
    type: String,
    required: true,
    index: true
  },
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: false // We're using our own timestamp field
})

// Compound indexes for efficient queries
auditLogSchema.index({ orgId: 1, timestamp: -1 })
auditLogSchema.index({ orgId: 1, resource: 1, resourceId: 1 })
auditLogSchema.index({ userId: 1, timestamp: -1 })

// TTL index to automatically delete old audit logs after 2 years
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 })

export const AuditLogModel = mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', auditLogSchema)