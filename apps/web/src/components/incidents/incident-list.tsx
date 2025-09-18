'use client'

import React, { useState } from 'react'
import { IncidentCard } from './incident-card'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon } from '@heroicons/react/24/outline'

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

interface IncidentListProps {
  incidents: Incident[]
  onCreateIncident: () => void
  onStatusChange: (incidentId: string, newStatus: string) => void
  onViewIncident: (incident: Incident) => void
  isLoading?: boolean
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onCreateIncident,
  onStatusChange,
  onViewIncident,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter incidents based on search and filters
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = searchTerm === '' ||
      incident.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity

    return matchesSearch && matchesStatus && matchesSeverity
  })

  // Sort incidents by priority (P1 first) and then by creation date
  const sortedIncidents = filteredIncidents.sort((a, b) => {
    const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4 }

    if (priorityOrder[a.severity] !== priorityOrder[b.severity]) {
      return priorityOrder[a.severity] - priorityOrder[b.severity]
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Incidents</h2>
          <p className="text-muted-foreground">
            Manage and track all incidents
          </p>
        </div>
        <Button onClick={onCreateIncident} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Create Incident
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <FunnelIcon className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Filter Controls */}
      {showFilters && (
        <div className="flex gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Status:</label>
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Severity:</label>
            <Select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">All</option>
              <option value="P1">P1 - Critical</option>
              <option value="P2">P2 - High</option>
              <option value="P3">P3 - Medium</option>
              <option value="P4">P4 - Low</option>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setFilterStatus('all')
              setFilterSeverity('all')
              setSearchTerm('')
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {sortedIncidents.length} of {incidents.length} incidents
        </span>
        {(searchTerm || filterStatus !== 'all' || filterSeverity !== 'all') && (
          <span>
            Filters applied
          </span>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Incident Cards */}
      <div className="grid gap-4">
        {sortedIncidents.length === 0 && !isLoading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
                ? 'No incidents match your filters'
                : 'No incidents found'}
            </p>
            {incidents.length === 0 && (
              <Button onClick={onCreateIncident} className="mt-4">
                Create your first incident
              </Button>
            )}
          </div>
        ) : (
          sortedIncidents.map((incident) => (
            <IncidentCard
              key={incident._id}
              incident={incident}
              onStatusChange={onStatusChange}
              onView={onViewIncident}
            />
          ))
        )}
      </div>
    </div>
  )
}