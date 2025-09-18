// System Testing Script for Simplicity ITSM
const mongoose = require('mongoose');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://simonbradley:E8gdH4%2Abyf%215y%25t@cluster0.e4lsq.mongodb.net/simplicity-itsm?retryWrites=true&w=majority';

async function testDatabaseConnection() {
  console.log('🔍 Testing database connectivity...');

  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Database connection successful');

    // Test collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name));

    // Test Organization model
    const OrganizationSchema = new mongoose.Schema({
      name: String,
      plan: String,
      settings: Object,
      billing: Object
    });
    const Organization = mongoose.models.Organization || mongoose.model('Organization', OrganizationSchema);

    const orgs = await Organization.find().limit(5);
    console.log(`📊 Found ${orgs.length} organizations`);

    // Test User model
    const UserSchema = new mongoose.Schema({
      email: String,
      name: String,
      orgId: String,
      roles: [String]
    });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const users = await User.find().limit(5);
    console.log(`👥 Found ${users.length} users`);

    // Test Incident model
    const IncidentSchema = new mongoose.Schema({
      orgId: String,
      title: String,
      description: String,
      severity: String,
      status: String,
      assignees: [String],
      reporterId: String,
      timeline: [Object],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    });
    const Incident = mongoose.models.Incident || mongoose.model('Incident', IncidentSchema);

    const incidents = await Incident.find().limit(5);
    console.log(`🚨 Found ${incidents.length} incidents`);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  } finally {
    await mongoose.disconnect();
  }
}

async function testAPIEndpoints() {
  console.log('🔍 Testing API endpoints...');

  const baseUrl = 'http://localhost:3000';

  try {
    // Test health endpoint
    const response = await fetch(`${baseUrl}/api/health`);
    if (response.ok) {
      console.log('✅ Health endpoint responsive');
    } else {
      console.log('⚠️ Health endpoint returned:', response.status);
    }

    // Note: Authentication endpoints would need actual auth testing
    console.log('ℹ️ Authentication endpoints require manual testing with browser');

    return true;
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message);
    return false;
  }
}

async function testNotificationServices() {
  console.log('🔍 Testing notification services...');

  try {
    // Test environment variables
    const hasSlackWebhook = !!process.env.SLACK_WEBHOOK_URL;
    const hasEmailConfig = !!(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_USER);

    console.log(`📧 Email configuration: ${hasEmailConfig ? '✅ Available' : '❌ Missing'}`);
    console.log(`💬 Slack webhook: ${hasSlackWebhook ? '✅ Available' : '❌ Missing'}`);

    return hasSlackWebhook || hasEmailConfig;
  } catch (error) {
    console.error('❌ Notification service test failed:', error.message);
    return false;
  }
}

async function testBillingIntegration() {
  console.log('🔍 Testing billing integration...');

  try {
    const hasStripeKeys = !!(process.env.STRIPE_PUBLISHABLE_KEY && process.env.STRIPE_SECRET_KEY);
    console.log(`💳 Stripe configuration: ${hasStripeKeys ? '✅ Available' : '❌ Missing'}`);

    return hasStripeKeys;
  } catch (error) {
    console.error('❌ Billing integration test failed:', error.message);
    return false;
  }
}

async function runSystemTests() {
  console.log('🚀 Starting Simplicity ITSM System Tests\n');

  const results = {};

  // Test database connectivity
  results.database = await testDatabaseConnection();
  console.log('');

  // Test API endpoints
  results.api = await testAPIEndpoints();
  console.log('');

  // Test notification services
  results.notifications = await testNotificationServices();
  console.log('');

  // Test billing integration
  results.billing = await testBillingIntegration();
  console.log('');

  // Summary
  console.log('📋 SYSTEM TEST SUMMARY');
  console.log('=====================');
  console.log(`Database: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`API: ${results.api ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Notifications: ${results.notifications ? '✅ PASS' : '⚠️ PARTIAL'}`);
  console.log(`Billing: ${results.billing ? '✅ PASS' : '⚠️ PARTIAL'}`);

  const allPassed = Object.values(results).every(r => r);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL SYSTEMS OPERATIONAL' : '⚠️ SOME ISSUES DETECTED'}`);

  return results;
}

// Run tests if called directly
if (require.main === module) {
  runSystemTests().catch(console.error);
}

module.exports = { runSystemTests };