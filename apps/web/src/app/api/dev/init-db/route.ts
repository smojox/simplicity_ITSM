import { NextRequest, NextResponse } from 'next/server'
import connectToDatabase from '@/lib/db/connection'
import { OrganizationModel } from '@/lib/models/organization'
import { UserModel } from '@/lib/models/user'
import { IncidentModel } from '@/lib/models/incident'

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  try {
    console.log('🔗 Connecting to MongoDB...')
    await connectToDatabase()
    console.log('✅ Connected to MongoDB successfully!')

    // Create a sample organization for development
    const existingOrg = await OrganizationModel.findOne({ name: 'Demo Organization' })
    let orgId

    if (!existingOrg) {
      const sampleOrg = new OrganizationModel({
        name: 'Demo Organization',
        plan: 'pro',
        settings: {
          features: {
            incidentManagement: true,
            problemManagement: true,
            changeManagement: false,
            requestFulfillment: true,
            serviceCatalog: false,
            knowledgeBase: true,
            assetManagement: false,
            slaManagement: true
          }
        },
        billing: {}
      })

      const savedOrg = await sampleOrg.save()
      orgId = savedOrg._id
      console.log('✅ Sample organization created with ID:', orgId.toString())
    } else {
      orgId = existingOrg._id
      console.log('ℹ️  Sample organization already exists with ID:', orgId.toString())
    }

    // Create a sample user
    const existingUser = await UserModel.findOne({
      email: 'admin@demo.com',
      orgId: orgId.toString()
    })

    let userId
    if (!existingUser) {
      const sampleUser = new UserModel({
        orgId: orgId.toString(),
        email: 'admin@demo.com',
        name: 'Demo Admin',
        roles: ['admin']
      })

      const savedUser = await sampleUser.save()
      userId = savedUser._id
      console.log('✅ Sample user created with ID:', userId.toString())
    } else {
      userId = existingUser._id
      console.log('ℹ️  Sample user already exists with ID:', userId.toString())
    }

    // Create sample incidents
    const existingIncidentCount = await IncidentModel.countDocuments({ orgId: orgId.toString() })

    if (existingIncidentCount === 0) {
      const sampleIncidents = [
        {
          orgId: orgId.toString(),
          title: 'Database Connection Issues',
          description: 'Users reporting intermittent database connection timeouts',
          severity: 'P1' as const,
          status: 'open' as const,
          assignees: [userId.toString()],
          reporterId: userId.toString(),
          timeline: [
            {
              userId: userId.toString(),
              type: 'note' as const,
              text: 'Incident created - investigating database performance',
              timestamp: new Date()
            }
          ],
          tags: ['database', 'performance'],
          affectedServices: ['user-service', 'api-gateway']
        },
        {
          orgId: orgId.toString(),
          title: 'Email Service Degradation',
          description: 'Email delivery delays reported by multiple users',
          severity: 'P2' as const,
          status: 'investigating' as const,
          assignees: [userId.toString()],
          reporterId: userId.toString(),
          timeline: [
            {
              userId: userId.toString(),
              type: 'note' as const,
              text: 'Incident created',
              timestamp: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
              userId: userId.toString(),
              type: 'status' as const,
              text: 'Status changed from open to investigating',
              timestamp: new Date(Date.now() - 1800000), // 30 min ago
              oldValue: 'open',
              newValue: 'investigating'
            }
          ],
          tags: ['email', 'service-degradation'],
          affectedServices: ['email-service'],
          createdAt: new Date(Date.now() - 3600000),
          updatedAt: new Date(Date.now() - 1800000)
        },
        {
          orgId: orgId.toString(),
          title: 'Login Page Loading Slow',
          description: 'Users experiencing slow loading times on the login page',
          severity: 'P3' as const,
          status: 'resolved' as const,
          assignees: [userId.toString()],
          reporterId: userId.toString(),
          timeline: [
            {
              userId: userId.toString(),
              type: 'note' as const,
              text: 'Incident created',
              timestamp: new Date(Date.now() - 7200000) // 2 hours ago
            },
            {
              userId: userId.toString(),
              type: 'status' as const,
              text: 'Status changed from open to investigating',
              timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
              oldValue: 'open',
              newValue: 'investigating'
            },
            {
              userId: userId.toString(),
              type: 'note' as const,
              text: 'Identified CSS loading issue, deployed fix',
              timestamp: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
              userId: userId.toString(),
              type: 'status' as const,
              text: 'Status changed from investigating to resolved',
              timestamp: new Date(Date.now() - 1800000), // 30 min ago
              oldValue: 'investigating',
              newValue: 'resolved'
            }
          ],
          tags: ['frontend', 'performance'],
          affectedServices: ['web-app'],
          createdAt: new Date(Date.now() - 7200000),
          updatedAt: new Date(Date.now() - 1800000),
          resolvedAt: new Date(Date.now() - 1800000)
        }
      ]

      await IncidentModel.insertMany(sampleIncidents)
      console.log('✅ Sample incidents created')
    } else {
      console.log(`ℹ️  ${existingIncidentCount} incidents already exist for demo organization`)
    }

    // Get collection stats
    const stats = {
      organizations: await OrganizationModel.countDocuments(),
      users: await UserModel.countDocuments(),
      incidents: await IncidentModel.countDocuments()
    }

    console.log('📊 Collection stats:', stats)
    console.log('🎉 Database initialization completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully',
      data: {
        orgId: orgId.toString(),
        userId: userId.toString(),
        stats
      }
    })

  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    return NextResponse.json(
      { success: false, error: 'Database initialization failed', details: error.message },
      { status: 500 }
    )
  }
}