'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user?.orgId) {
      router.push(`/dashboard/${session.user.orgId}`)
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-4xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold tracking-tight">
            Simplicity ITSM
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Modern IT Service Management platform for engineering teams.
            Create, track, and resolve incidents with real-time collaboration.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" onClick={() => router.push('/auth/signin')}>
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16 text-left">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Incident Management</h3>
            <p className="text-muted-foreground">
              Create, assign, and track incidents with detailed timelines and real-time updates.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Team Collaboration</h3>
            <p className="text-muted-foreground">
              Multi-tenant architecture with role-based access and team notifications.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Analytics & Insights</h3>
            <p className="text-muted-foreground">
              Track SLA performance, resolution times, and incident trends.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}