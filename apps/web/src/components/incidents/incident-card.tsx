'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ExclamationTriangleIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

interface Incident {
  _id: string
  title: string
  description?: string
  severity: 'P1' | 'P2' | 'P3' | 'P4'
  status: 'open' | 'acknowledged' | 'investigating' | 'resolved' | 'closed'
  assignees: string[]
  reporterId: string
  createdAt: string
  updatedAt: string
  tags?: string[]
  affectedServices?: string[]
}

interface IncidentCardProps {
  incident: Incident
  onStatusChange?: (incidentId: string, newStatus: string) => void
  onView?: (incident: Incident) => void
}

const severityColors = {
  P1: 'bg-red-100 text-red-800 border-red-200',
  P2: 'bg-orange-100 text-orange-800 border-orange-200',
  P3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  P4: 'bg-blue-100 text-blue-800 border-blue-200'
}

const statusColors = {
  open: 'bg-red-100 text-red-800',
  acknowledged: 'bg-yellow-100 text-yellow-800',
  investigating: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'open':
      return <ExclamationTriangleIcon className="h-4 w-4" />
    case 'acknowledged':
      return <ClockIcon className="h-4 w-4" />
    case 'investigating':
      return <UserIcon className="h-4 w-4" />
    case 'resolved':
      return <CheckCircleIcon className="h-4 w-4" />
    default:
      return null
  }
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onStatusChange,
  onView
}) => {
  const handleStatusChange = (newStatus: string) => {
    if (onStatusChange) {
      onStatusChange(incident._id, newStatus)
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onView?.(incident)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2">
            {incident.title}
          </CardTitle>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${severityColors[incident.severity]}`}>
              {incident.severity}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status]}`}>
              {getStatusIcon(incident.status)}
              {incident.status}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {incident.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {incident.description}
          </p>
        )}

        {incident.tags && incident.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {incident.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-800 text-xs"
              >
                {tag}
              </span>
            ))}
            {incident.tags.length > 3 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                +{incident.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4" />
              {getTimeAgo(incident.createdAt)}
            </span>
            {incident.assignees.length > 0 && (
              <span className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                {incident.assignees.length} assigned
              </span>
            )}
          </div>

          {incident.status !== 'resolved' && incident.status !== 'closed' && (
            <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
              {incident.status === 'open' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('acknowledged')}
                >
                  Acknowledge
                </Button>
              )}
              {(incident.status === 'acknowledged' || incident.status === 'open') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange('investigating')}
                >
                  Investigate
                </Button>
              )}
              {incident.status === 'investigating' && (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleStatusChange('resolved')}
                >
                  Resolve
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}