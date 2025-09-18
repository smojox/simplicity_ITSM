#!/usr/bin/env node
const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://itsmadmin:E8gdH4*byf!5y%t@smojox.pz9ru6j.mongodb.net/simplicity-itsm?retryWrites=true&w=majority&appName=smojox';

async function initializeDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected to MongoDB successfully!');

    const db = client.db('simplicity-itsm');

    // Create collections and indexes
    console.log('📊 Creating collections and indexes...');

    // Organizations collection
    const orgsCollection = db.collection('organizations');
    await orgsCollection.createIndex({ name: 1 });
    console.log('✅ Organizations collection and indexes created');

    // Users collection
    const usersCollection = db.collection('users');
    await usersCollection.createIndex({ orgId: 1, email: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 });
    console.log('✅ Users collection and indexes created');

    // Incidents collection
    const incidentsCollection = db.collection('incidents');
    await incidentsCollection.createIndex({ orgId: 1, status: 1 });
    await incidentsCollection.createIndex({ orgId: 1, severity: 1 });
    await incidentsCollection.createIndex({ orgId: 1, createdAt: -1 });
    await incidentsCollection.createIndex({ assignees: 1 });
    console.log('✅ Incidents collection and indexes created');

    // Create a sample organization for development
    const sampleOrg = {
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
    };

    const existingOrg = await orgsCollection.findOne({ name: 'Demo Organization' });
    let orgId;

    if (!existingOrg) {
      const result = await orgsCollection.insertOne(sampleOrg);
      orgId = result.insertedId;
      console.log('✅ Sample organization created with ID:', orgId.toString());
    } else {
      orgId = existingOrg._id;
      console.log('ℹ️  Sample organization already exists with ID:', orgId.toString());
    }

    // Create a sample user
    const sampleUser = {
      orgId: orgId.toString(),
      email: 'admin@demo.com',
      name: 'Demo Admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const existingUser = await usersCollection.findOne({
      email: 'admin@demo.com',
      orgId: orgId.toString()
    });

    let userId;
    if (!existingUser) {
      const result = await usersCollection.insertOne(sampleUser);
      userId = result.insertedId;
      console.log('✅ Sample user created with ID:', userId.toString());
    } else {
      userId = existingUser._id;
      console.log('ℹ️  Sample user already exists with ID:', userId.toString());
    }

    // Create sample incidents
    const sampleIncidents = [
      {
        orgId: orgId.toString(),
        title: 'Database Connection Issues',
        description: 'Users reporting intermittent database connection timeouts',
        severity: 'P1',
        status: 'open',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created - investigating database performance',
            timestamp: new Date()
          }
        ],
        tags: ['database', 'performance'],
        affectedServices: ['user-service', 'api-gateway'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orgId: orgId.toString(),
        title: 'Email Service Degradation',
        description: 'Email delivery delays reported by multiple users',
        severity: 'P2',
        status: 'investigating',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created',
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
          },
          {
            userId: userId.toString(),
            type: 'status',
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
        severity: 'P3',
        status: 'resolved',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created',
            timestamp: new Date(Date.now() - 7200000) // 2 hours ago
          },
          {
            userId: userId.toString(),
            type: 'status',
            text: 'Status changed from open to investigating',
            timestamp: new Date(Date.now() - 5400000), // 1.5 hours ago
            oldValue: 'open',
            newValue: 'investigating'
          },
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Identified CSS loading issue, deployed fix',
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
          },
          {
            userId: userId.toString(),
            type: 'status',
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
    ];

    // Check if sample incidents already exist
    const existingIncidentCount = await incidentsCollection.countDocuments({ orgId: orgId.toString() });

    if (existingIncidentCount === 0) {
      await incidentsCollection.insertMany(sampleIncidents);
      console.log('✅ Sample incidents created');
    } else {
      console.log(`ℹ️  ${existingIncidentCount} incidents already exist for demo organization`);
    }

    // Verify collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Database collections:', collections.map(c => c.name).join(', '));

    // Get collection stats
    const stats = {
      organizations: await orgsCollection.countDocuments(),
      users: await usersCollection.countDocuments(),
      incidents: await incidentsCollection.countDocuments()
    };

    console.log('📊 Collection stats:', stats);
    console.log('🎉 Database initialization completed successfully!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔐 Database connection closed');
  }
}

// Run initialization
initializeDatabase().catch(console.error);