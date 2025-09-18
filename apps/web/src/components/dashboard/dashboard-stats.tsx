'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

interface DashboardStatsProps {
  stats: {
    incidents: {
      total: number
      open: number
      acknowledged: number
      investigating: number
      resolved: number
      byPriority: {
        P1: number
        P2: number
        P3: number
        P4: number
      }
    }
    avgResolutionTime: number | null
  }
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const activeIncidents = stats.incidents.total - stats.incidents.resolved

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Incidents
          </CardTitle>
          <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeIncidents}</div>
          <p className="text-xs text-muted-foreground">
            {stats.incidents.open} open, {stats.incidents.acknowledged} acknowledged
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Investigating
          </CardTitle>
          <ClockIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.incidents.investigating}</div>
          <p className="text-xs text-muted-foreground">
            Currently being worked on
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Resolved Today
          </CardTitle>
          <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.incidents.resolved}</div>
          <p className="text-xs text-muted-foreground">
            Total resolved incidents
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Resolution Time
          </CardTitle>
          <ChartBarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.avgResolutionTime ? `${stats.avgResolutionTime}h` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            Average time to resolve
          </p>
        </CardContent>
      </Card>

      {/* Priority Breakdown */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Priority Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.incidents.byPriority.P1}</div>
              <div className="text-sm text-muted-foreground">P1 Critical</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.incidents.byPriority.P2}</div>
              <div className="text-sm text-muted-foreground">P2 High</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.incidents.byPriority.P3}</div>
              <div className="text-sm text-muted-foreground">P3 Medium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.incidents.byPriority.P4}</div>
              <div className="text-sm text-muted-foreground">P4 Low</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Open</span>
              <span className="text-sm text-red-600">{stats.incidents.open}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Acknowledged</span>
              <span className="text-sm text-yellow-600">{stats.incidents.acknowledged}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Investigating</span>
              <span className="text-sm text-blue-600">{stats.incidents.investigating}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Resolved</span>
              <span className="text-sm text-green-600">{stats.incidents.resolved}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}