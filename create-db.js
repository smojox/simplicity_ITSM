const { MongoClient, ObjectId } = require('mongodb');

const uri = 'mongodb+srv://itsmadmin:E8gdH4*byf!5y%t@smojox.pz9ru6j.mongodb.net/?retryWrites=true&w=majority&appName=smojox';

async function createDatabase() {
  const client = new MongoClient(uri);

  try {
    console.log('🔗 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected successfully!');

    const db = client.db('simplicity-itsm');
    console.log('📊 Using database: simplicity-itsm');

    // Create organizations collection with sample data
    console.log('📁 Creating organizations...');
    const orgsCollection = db.collection('organizations');

    const orgResult = await orgsCollection.insertOne({
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
    });

    const orgId = orgResult.insertedId;
    console.log('✅ Created organization with ID:', orgId.toString());

    // Create users collection with sample data
    console.log('👤 Creating users...');
    const usersCollection = db.collection('users');

    const userResult = await usersCollection.insertOne({
      orgId: orgId.toString(),
      email: 'admin@demo.com',
      name: 'Demo Admin',
      roles: ['admin'],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const userId = userResult.insertedId;
    console.log('✅ Created user with ID:', userId.toString());

    // Create incidents collection with sample data
    console.log('🚨 Creating sample incidents...');
    const incidentsCollection = db.collection('incidents');

    const sampleIncidents = [
      {
        orgId: orgId.toString(),
        title: 'Database Connection Issues',
        description: 'Users reporting intermittent database connection timeouts affecting login functionality',
        severity: 'P1',
        status: 'open',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created - investigating database performance issues',
            timestamp: new Date()
          }
        ],
        tags: ['database', 'performance', 'login'],
        affectedServices: ['user-service', 'api-gateway', 'auth-service'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orgId: orgId.toString(),
        title: 'Email Service Degradation',
        description: 'Email delivery delays reported by multiple users. Average delay is 15-30 minutes.',
        severity: 'P2',
        status: 'investigating',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created - email delivery delays reported',
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
          },
          {
            userId: userId.toString(),
            type: 'status',
            text: 'Status changed from open to investigating',
            timestamp: new Date(Date.now() - 1800000), // 30 min ago
            oldValue: 'open',
            newValue: 'investigating'
          },
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Checking email queue and SMTP server logs',
            timestamp: new Date(Date.now() - 900000) // 15 min ago
          }
        ],
        tags: ['email', 'service-degradation'],
        affectedServices: ['email-service', 'notification-service'],
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 900000)
      },
      {
        orgId: orgId.toString(),
        title: 'Login Page Loading Slow',
        description: 'Users experiencing slow loading times (5-10 seconds) on the login page',
        severity: 'P3',
        status: 'resolved',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created - login page performance issue',
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
            text: 'Identified CSS loading issue - large bundle size',
            timestamp: new Date(Date.now() - 3600000) // 1 hour ago
          },
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Deployed fix with CSS optimization and code splitting',
            timestamp: new Date(Date.now() - 2400000) // 40 min ago
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
        tags: ['frontend', 'performance', 'css'],
        affectedServices: ['web-app', 'cdn'],
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 1800000),
        resolvedAt: new Date(Date.now() - 1800000)
      },
      {
        orgId: orgId.toString(),
        title: 'API Rate Limiting Issues',
        description: 'Third-party integration hitting rate limits causing failed requests',
        severity: 'P2',
        status: 'acknowledged',
        assignees: [userId.toString()],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created - API rate limiting detected',
            timestamp: new Date(Date.now() - 1800000) // 30 min ago
          },
          {
            userId: userId.toString(),
            type: 'status',
            text: 'Status changed from open to acknowledged',
            timestamp: new Date(Date.now() - 900000), // 15 min ago
            oldValue: 'open',
            newValue: 'acknowledged'
          }
        ],
        tags: ['api', 'integration', 'rate-limit'],
        affectedServices: ['integration-service', 'webhook-processor'],
        createdAt: new Date(Date.now() - 1800000),
        updatedAt: new Date(Date.now() - 900000)
      },
      {
        orgId: orgId.toString(),
        title: 'Mobile App Crash on Android',
        description: 'Android users reporting app crashes when accessing profile settings',
        severity: 'P4',
        status: 'open',
        assignees: [],
        reporterId: userId.toString(),
        timeline: [
          {
            userId: userId.toString(),
            type: 'note',
            text: 'Incident created - Android app crash reports received',
            timestamp: new Date(Date.now() - 300000) // 5 min ago
          }
        ],
        tags: ['mobile', 'android', 'crash'],
        affectedServices: ['mobile-app'],
        createdAt: new Date(Date.now() - 300000),
        updatedAt: new Date(Date.now() - 300000)
      }
    ];

    const incidentResult = await incidentsCollection.insertMany(sampleIncidents);
    console.log(`✅ Created ${incidentResult.insertedCount} sample incidents`);

    // Create indexes for better performance
    console.log('🔍 Creating database indexes...');

    await orgsCollection.createIndex({ name: 1 });
    await usersCollection.createIndex({ orgId: 1, email: 1 }, { unique: true });
    await usersCollection.createIndex({ email: 1 });
    await incidentsCollection.createIndex({ orgId: 1, status: 1 });
    await incidentsCollection.createIndex({ orgId: 1, severity: 1 });
    await incidentsCollection.createIndex({ orgId: 1, createdAt: -1 });
    await incidentsCollection.createIndex({ assignees: 1 });

    console.log('✅ Created database indexes');

    // Show final statistics
    const stats = {
      organizations: await orgsCollection.countDocuments(),
      users: await usersCollection.countDocuments(),
      incidents: await incidentsCollection.countDocuments()
    };

    console.log('\n📊 Database Creation Complete!');
    console.log('Database name: simplicity-itsm');
    console.log('Collections created:', Object.keys(stats).join(', '));
    console.log('Document counts:', stats);
    console.log('\n🎉 You can now see the database in MongoDB Atlas!');
    console.log('\nSample login credentials:');
    console.log('Email: admin@demo.com');
    console.log('Organization ID:', orgId.toString());

  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    await client.close();
    console.log('🔐 Connection closed');
  }
}

createDatabase();