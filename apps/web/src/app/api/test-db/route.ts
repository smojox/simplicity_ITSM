import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // Simple test to verify environment variables
  const mongoUri = process.env.MONGODB_URI

  if (!mongoUri) {
    return NextResponse.json({
      success: false,
      error: 'MONGODB_URI not configured'
    }, { status: 500 })
  }

  // Basic connection test using native MongoDB driver
  try {
    const { MongoClient } = require('mongodb')
    const client = new MongoClient(mongoUri)

    await client.connect()

    const db = client.db('simplicity-itsm')

    // Test basic operations
    const collections = await db.listCollections().toArray()

    // Create sample data if none exists
    const orgsCollection = db.collection('organizations')
    const existingOrgs = await orgsCollection.countDocuments()

    let sampleOrgId = null

    if (existingOrgs === 0) {
      const result = await orgsCollection.insertOne({
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
        billing: {},
        createdAt: new Date(),
        updatedAt: new Date()
      })
      sampleOrgId = result.insertedId
    }

    const stats = {
      collections: collections.map(c => c.name),
      organizationCount: await orgsCollection.countDocuments(),
      userCount: await db.collection('users').countDocuments(),
      incidentCount: await db.collection('incidents').countDocuments()
    }

    await client.close()

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: {
        stats,
        sampleOrgId: sampleOrgId?.toString()
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    }, { status: 500 })
  }
}