'use client'

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { IncidentList } from '@/components/incidents/incident-list'
import { CreateIncidentModal } from '@/components/incidents/create-incident-modal'

interface DashboardPageProps {
  params: {
    orgId: string
  }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [dashboardData, setDashboardData] = useState(null)
  const [incidents, setIncidents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState(null)

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session && session.user.orgId !== params.orgId) {
      // Redirect to user's actual organization
      router.push(`/dashboard/${session.user.orgId}`)
      return
    }
  }, [session, status, params.orgId, router])

  // Fetch dashboard data
  useEffect(() => {
    if (!session || session.user.orgId !== params.orgId) return

    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch dashboard stats and incidents in parallel
        const [dashboardRes, incidentsRes] = await Promise.all([
          fetch(`/api/orgs/${params.orgId}/dashboard`),
          fetch(`/api/orgs/${params.orgId}/incidents`)
        ])

        if (!dashboardRes.ok || !incidentsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const dashboardResult = await dashboardRes.json()
        const incidentsResult = await incidentsRes.json()

        if (!dashboardResult.success || !incidentsResult.success) {
          throw new Error(dashboardResult.error || incidentsResult.error || 'Failed to fetch data')
        }

        setDashboardData(dashboardResult.data)
        setIncidents(incidentsResult.data || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session, params.orgId])

  const handleCreateIncident = async (incidentData) => {
    try {
      const response = await fetch(`/api/orgs/${params.orgId}/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create incident')
      }

      // Add new incident to the list
      setIncidents(prev => [result.data, ...prev])
      setShowCreateModal(false)

      // Refresh dashboard stats
      const dashboardRes = await fetch(`/api/orgs/${params.orgId}/dashboard`)
      if (dashboardRes.ok) {
        const dashboardResult = await dashboardRes.json()
        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data)
        }
      }
    } catch (error) {
      console.error('Error creating incident:', error)
      alert('Failed to create incident: ' + error.message)
    }
  }

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orgs/${params.orgId}/incidents/${incidentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to update incident')
      }

      // Update incident in the list
      setIncidents(prev =>
        prev.map(incident =>
          incident._id === incidentId
            ? { ...incident, status: newStatus, updatedAt: new Date().toISOString() }
            : incident
        )
      )

      // Refresh dashboard stats
      const dashboardRes = await fetch(`/api/orgs/${params.orgId}/dashboard`)
      if (dashboardRes.ok) {
        const dashboardResult = await dashboardRes.json()
        if (dashboardResult.success) {
          setDashboardData(dashboardResult.data)
        }
      }
    } catch (error) {
      console.error('Error updating incident:', error)
      alert('Failed to update incident: ' + error.message)
    }
  }

  const handleViewIncident = (incident) => {
    // For now, just log - in future we'll navigate to incident detail page
    console.log('View incident:', incident)
  }

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Simplicity ITSM
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Welcome, {session.user.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Dashboard Stats */}
          {dashboardData && (
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h2>
              <DashboardStats stats={dashboardData} />
            </div>
          )}

          {/* Incident List */}
          <IncidentList
            incidents={incidents}
            onCreateIncident={() => setShowCreateModal(true)}
            onStatusChange={handleStatusChange}
            onViewIncident={handleViewIncident}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Create Incident Modal */}
      <CreateIncidentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateIncident}
      />
    </div>
  )
}