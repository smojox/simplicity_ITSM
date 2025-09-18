export interface Organization {
  _id?: string
  name: string
  plan: 'free' | 'pro' | 'enterprise'
  settings: {
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
  }
  billing: {
    stripeCustomerId?: string
  }
  createdAt?: Date
  updatedAt?: Date
}

export interface User {
  _id?: string
  orgId: string
  email: string
  name: string
  roles: ('admin' | 'member' | 'oncall')[]
  createdAt?: Date
  updatedAt?: Date
}

export interface TimelineEntry {
  userId: string
  type: 'note' | 'status' | 'assignment' | 'severity'
  text: string
  timestamp: Date
  oldValue?: string
  newValue?: string
}

export interface Incident {
  _id?: string
  orgId: string
  title: string
  description?: string
  severity: 'P1' | 'P2' | 'P3' | 'P4'
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed'
  assignees: string[]
  reporterId: string
  timeline: TimelineEntry[]
  tags?: string[]
  affectedServices?: string[]
  createdAt?: Date
  updatedAt?: Date
  resolvedAt?: Date
}

export interface Problem {
  _id?: string
  orgId: string
  title: string
  description: string
  linkedIncidents: string[]
  rootCause?: string
  workaround?: string
  status: 'identified' | 'investigating' | 'resolved' | 'closed'
  assigneeId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface Change {
  _id?: string
  orgId: string
  title: string
  description: string
  approvalStatus: 'pending' | 'approved' | 'rejected'
  implementationStatus: 'planned' | 'in-progress' | 'completed' | 'failed'
  window: {
    start: Date
    end: Date
  }
  relatedProblems?: string[]
  assigneeId?: string
  approverId?: string
  createdAt?: Date
  updatedAt?: Date
}

export interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  error?: string
}