import mongoose, { Schema, Document } from 'mongoose'

export interface ITimelineEntry {
  userId: string
  type: 'note' | 'status' | 'assignment' | 'severity'
  text: string
  timestamp: Date
  oldValue?: string
  newValue?: string
}

export interface IIncident extends Document {
  orgId: string
  title: string
  description?: string
  severity: 'P1' | 'P2' | 'P3' | 'P4'
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed'
  assignees: string[]
  reporterId: string
  timeline: ITimelineEntry[]
  tags?: string[]
  affectedServices?: string[]
  resolvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const timelineEntrySchema = new Schema<ITimelineEntry>({
  userId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['note', 'status', 'assignment', 'severity'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  oldValue: String,
  newValue: String
}, { _id: false })

const incidentSchema = new Schema<IIncident>({
  orgId: {
    type: String,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  severity: {
    type: String,
    enum: ['P1', 'P2', 'P3', 'P4'],
    default: 'P3',
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'acknowledged', 'investigating', 'resolved', 'closed'],
    default: 'open',
    required: true
  },
  assignees: [{
    type: String,
    index: true
  }],
  reporterId: {
    type: String,
    required: true
  },
  timeline: [timelineEntrySchema],
  tags: [String],
  affectedServices: [String],
  resolvedAt: Date
}, {
  timestamps: true
})

incidentSchema.index({ orgId: 1, status: 1 })
incidentSchema.index({ orgId: 1, severity: 1 })
incidentSchema.index({ orgId: 1, createdAt: -1 })
incidentSchema.index({ assignees: 1 })

export const IncidentModel = mongoose.models.Incident || mongoose.model<IIncident>('Incident', incidentSchema)