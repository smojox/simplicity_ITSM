'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CreateIncidentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (incident: {
    title: string
    description: string
    severity: string
    assignees: string[]
    tags: string[]
    affectedServices: string[]
  }) => void
  isLoading?: boolean
}

export const CreateIncidentModal: React.FC<CreateIncidentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'P3',
    assignees: [] as string[],
    tags: '',
    affectedServices: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) return

    const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    const affectedServices = formData.affectedServices.split(',').map(service => service.trim()).filter(service => service)

    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      severity: formData.severity,
      assignees: formData.assignees,
      tags,
      affectedServices
    })

    // Reset form
    setFormData({
      title: '',
      description: '',
      severity: 'P3',
      assignees: [],
      tags: '',
      affectedServices: ''
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Create New Incident</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">
                  Title *
                </label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the incident"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the incident"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="severity" className="block text-sm font-medium mb-1">
                    Severity
                  </label>
                  <Select
                    id="severity"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="P1">P1 - Critical</option>
                    <option value="P2">P2 - High</option>
                    <option value="P3">P3 - Medium</option>
                    <option value="P4">P4 - Low</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-1">
                    Tags
                  </label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="database, api, frontend (comma-separated)"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="affectedServices" className="block text-sm font-medium mb-1">
                  Affected Services
                </label>
                <Input
                  id="affectedServices"
                  value={formData.affectedServices}
                  onChange={(e) => setFormData({ ...formData, affectedServices: e.target.value })}
                  placeholder="user-service, api-gateway (comma-separated)"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.title.trim()}
                >
                  {isLoading ? 'Creating...' : 'Create Incident'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}