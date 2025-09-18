// Simple database setup using the working service-desk-tools MongoDB connection
const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://itsmadmin:E8gdH4*byf!5y%t@smojox.pz9ru6j.mongodb.net/?retryWrites=true&w=majority&appName=smojox";

async function setupDatabase() {
    console.log('🔗 Connecting to MongoDB Atlas...');

    const client = new MongoClient(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
    });

    try {
        await client.connect();
        console.log('✅ Connected successfully!');

        const db = client.db('simplicity-itsm');
        console.log('📊 Using database: simplicity-itsm');

        // Insert sample organization
        const orgsCollection = db.collection('organizations');
        const orgDoc = {
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

        const orgResult = await orgsCollection.insertOne(orgDoc);
        console.log('✅ Created organization:', orgResult.insertedId.toString());

        // Insert sample user
        const usersCollection = db.collection('users');
        const userDoc = {
            orgId: orgResult.insertedId.toString(),
            email: 'admin@demo.com',
            name: 'Demo Admin',
            roles: ['admin'],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const userResult = await usersCollection.insertOne(userDoc);
        console.log('✅ Created user:', userResult.insertedId.toString());

        // Insert sample incidents
        const incidentsCollection = db.collection('incidents');
        const incidents = [
            {
                orgId: orgResult.insertedId.toString(),
                title: 'Database Connection Issues',
                description: 'Users reporting intermittent database connection timeouts',
                severity: 'P1',
                status: 'open',
                assignees: [userResult.insertedId.toString()],
                reporterId: userResult.insertedId.toString(),
                timeline: [
                    {
                        userId: userResult.insertedId.toString(),
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
                orgId: orgResult.insertedId.toString(),
                title: 'Email Service Degradation',
                description: 'Email delivery delays reported by multiple users',
                severity: 'P2',
                status: 'investigating',
                assignees: [userResult.insertedId.toString()],
                reporterId: userResult.insertedId.toString(),
                timeline: [
                    {
                        userId: userResult.insertedId.toString(),
                        type: 'note',
                        text: 'Incident created',
                        timestamp: new Date(Date.now() - 3600000)
                    },
                    {
                        userId: userResult.insertedId.toString(),
                        type: 'status',
                        text: 'Status changed from open to investigating',
                        timestamp: new Date(Date.now() - 1800000),
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
                orgId: orgResult.insertedId.toString(),
                title: 'Login Page Loading Slow',
                description: 'Users experiencing slow loading times on login page',
                severity: 'P3',
                status: 'resolved',
                assignees: [userResult.insertedId.toString()],
                reporterId: userResult.insertedId.toString(),
                timeline: [
                    {
                        userId: userResult.insertedId.toString(),
                        type: 'note',
                        text: 'Incident created',
                        timestamp: new Date(Date.now() - 7200000)
                    },
                    {
                        userId: userResult.insertedId.toString(),
                        type: 'status',
                        text: 'Status changed from investigating to resolved',
                        timestamp: new Date(Date.now() - 1800000),
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

        const incidentResult = await incidentsCollection.insertMany(incidents);
        console.log(`✅ Created ${incidentResult.insertedCount} incidents`);

        // Create indexes
        await orgsCollection.createIndex({ name: 1 });
        await usersCollection.createIndex({ orgId: 1, email: 1 }, { unique: true });
        await incidentsCollection.createIndex({ orgId: 1, status: 1 });
        await incidentsCollection.createIndex({ orgId: 1, createdAt: -1 });
        console.log('✅ Created indexes');

        // Show final stats
        const stats = {
            organizations: await orgsCollection.countDocuments(),
            users: await usersCollection.countDocuments(),
            incidents: await incidentsCollection.countDocuments()
        };

        console.log('\n🎉 Database setup complete!');
        console.log('Database: simplicity-itsm');
        console.log('Stats:', stats);
        console.log('\nDemo credentials:');
        console.log('Organization ID:', orgResult.insertedId.toString());
        console.log('User ID:', userResult.insertedId.toString());
        console.log('Email: admin@demo.com');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.close();
        console.log('🔐 Connection closed');
    }
}

setupDatabase();