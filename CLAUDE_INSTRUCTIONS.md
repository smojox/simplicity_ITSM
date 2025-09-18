# Claude Code Instructions - Simplicity ITSM Project

## Project Overview
**Product Name:** Simplicity
**Type:** Multi-tenant SaaS ITSM (IT Service Management) Platform
**Duration:** 12 weeks (3 phases of 4 weeks each)
**Status:** Planning Complete - Ready for Implementation

## Current Phase Status
- [x] **Planning Phase**: Complete
- [x] **Phase 1 Week 1 (Project Setup)**: Complete
- [x] **Phase 1 Week 2 (Multi-tenancy & Core Models)**: Complete
- [x] **Phase 1 Week 3 (Incident Management Core)**: Complete
- [x] **Phase 1 Week 4 (Notifications & Billing)**: Complete ✅
- [x] **🎯 PHASE 1 COMPLETE**: All deliverables implemented and tested
- [ ] **Phase 2 (Advanced Features)**: Ready to Begin
- [ ] **Phase 3 (Enterprise & Integrations)**: Not Started

### Phase 1 Achievements
- ✅ Complete incident management system
- ✅ Multi-tenant architecture with organization isolation
- ✅ Slack and email notification system
- ✅ Stripe billing integration with subscription tiers
- ✅ Comprehensive audit logging system
- ✅ Authentication and RBAC implementation
- ✅ Database with sample data (simplicity-itsm)
- ✅ System integration and testing complete

## Tech Stack & Architecture

### Core Technologies
- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**: Next.js API routes (serverless functions)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js
- **Payments**: Stripe Billing
- **Real-time**: Ably
- **Hosting**: Vercel
- **Monitoring**: Sentry + Vercel Analytics

### Repository Structure
```
/apps
  /web                 # Next.js application
/packages
  /db                  # MongoDB schemas and models
  /ui                  # Shared Tailwind components
  /lib                 # Utilities (auth, billing, notifications)
  /types               # TypeScript type definitions
```

## Data Models & Schemas

### Core Models
```typescript
// Organization Schema
{
  _id: ObjectId,
  name: string,
  plan: "free" | "pro" | "enterprise",
  settings: {
    features: {
      incidentManagement: boolean,
      problemManagement: boolean,
      changeManagement: boolean,
      requestFulfillment: boolean,
      serviceCatalog: boolean,
      knowledgeBase: boolean,
      assetManagement: boolean,
      slaManagement: boolean
    }
  },
  billing: {
    stripeCustomerId: string
  }
}

// User Schema
{
  _id: ObjectId,
  orgId: ObjectId,
  email: string,
  roles: ["admin" | "member" | "oncall"]
}

// Incident Schema
{
  _id: ObjectId,
  orgId: ObjectId,
  title: string,
  severity: "P1" | "P2" | "P3",
  status: "open" | "ack" | "investigating" | "resolved",
  assignees: [ObjectId],
  timeline: [{
    userId: ObjectId,
    type: "note" | "status",
    text: string,
    timestamp: Date
  }]
}
```

## Phase 1: Foundation & MVP (Weeks 1-4)

### Week 1: Project Setup & Infrastructure ✅ COMPLETED
#### Tasks
- [x] Initialize monorepo with Turborepo/pnpm
- [x] Setup Next.js 14 with App Router and TypeScript
- [x] Configure Tailwind CSS with custom design system
- [x] Setup MongoDB Atlas cluster and connection
- [x] Configure Vercel project with environment variables
- [x] Initialize Git repository with proper .gitignore
- [x] Setup ESLint, Prettier, and Husky pre-commit hooks

#### Key Files to Create
- `package.json` (root with workspace config)
- `apps/web/package.json`
- `packages/*/package.json`
- `turbo.json`
- `tailwind.config.js`
- `.env.local` and `.env.example`

### Week 2: Multi-tenancy & Core Models ✅ COMPLETED
#### Tasks
- [x] Implement NextAuth.js configuration
- [x] Create MongoDB connection utility
- [x] Build core Mongoose schemas (Org, User, Incident)
- [x] Implement tenant isolation middleware
- [x] Create feature flag system
- [x] Setup API route structure with orgId validation

#### Key Files Created ✅
- `packages/db/models/organization.ts` - Organization schema with feature flags
- `packages/db/models/user.ts` - User schema with roles
- `packages/db/models/incident.ts` - Incident schema with timeline
- `packages/lib/auth.ts` - NextAuth configuration
- `packages/lib/tenant.ts` - Tenant isolation utilities
- `packages/lib/feature-flags.ts` - Feature flag system
- `packages/types/src/next-auth.d.ts` - NextAuth type extensions
- `apps/web/src/middleware.ts` - Route protection middleware
- `apps/web/src/app/api/auth/[...nextauth]/route.ts` - NextAuth API
- `apps/web/src/app/api/orgs/[orgId]/` - Organization API routes
- `apps/web/src/app/auth/` - Authentication pages

### Week 3: Incident Management Core ✅ COMPLETED
#### Tasks
- [x] Build incident CRUD API endpoints
- [x] Implement incident status transitions
- [x] Create assignment and timeline functionality
- [x] Build basic incident dashboard UI
- [x] Create incident forms and modals

#### Key Files Created ✅
- `src/components/ui/` - Reusable UI components (Button, Card, Input, etc.)
- `src/components/incidents/incident-card.tsx` - Individual incident display component
- `src/components/incidents/incident-list.tsx` - Incident listing with filters and search
- `src/components/incidents/create-incident-modal.tsx` - Modal for creating new incidents
- `src/components/dashboard/dashboard-stats.tsx` - Dashboard statistics overview
- `src/app/dashboard/[orgId]/page.tsx` - Main dashboard page with full functionality
- `src/app/page.tsx` - Updated landing page with authentication redirect
- `src/lib/db/connection.ts` - Local MongoDB connection utility
- `src/lib/models/` - Local database models for development

### Week 4: Notifications & Billing
#### Tasks
- [ ] Integrate Slack webhook notifications
- [ ] Setup email notifications (SendGrid/Resend)
- [ ] Implement Stripe billing integration
- [ ] Create subscription tier enforcement
- [ ] Add basic audit logging

#### Key Files to Create
- `packages/lib/notifications/` (Slack, email utilities)
- `packages/lib/billing/` (Stripe integration)
- `apps/web/app/api/webhooks/stripe/` (webhook handlers)

## Phase 2: Advanced ITSM Features (Weeks 5-8)

### Week 5-6: Real-time & Problem Management
#### Tasks
- [ ] Integrate Ably for real-time updates
- [ ] Build Problem Management module
- [ ] Implement incident-problem linking
- [ ] Create escalation policies
- [ ] Enhance dashboard with real-time data

### Week 7-8: Change & Request Management
#### Tasks
- [ ] Build Change Management with approvals
- [ ] Implement Request Fulfillment module
- [ ] Create Service Catalog foundation
- [ ] Add SLA tracking and MTTR analytics

## Phase 3: Enterprise & Integrations (Weeks 9-12)

### Week 9-10: External Integrations
#### Tasks
- [ ] Build PagerDuty integration
- [ ] Add Twilio SMS notifications
- [ ] Implement webhook system
- [ ] Create comprehensive audit trails

### Week 11-12: Knowledge Management & Automation
#### Tasks
- [ ] Build Knowledge Base module
- [ ] Implement automation rules
- [ ] Add advanced analytics
- [ ] Performance optimization and testing

## API Endpoints Structure

### Authentication & Organizations
- `GET /api/auth/[...nextauth]` - NextAuth endpoints
- `GET /api/orgs` - List user organizations
- `POST /api/orgs` - Create organization
- `GET /api/orgs/[orgId]` - Get organization details

### Incident Management
- `GET /api/orgs/[orgId]/incidents` - List incidents
- `POST /api/orgs/[orgId]/incidents` - Create incident
- `GET /api/orgs/[orgId]/incidents/[id]` - Get incident
- `PATCH /api/orgs/[orgId]/incidents/[id]` - Update incident
- `POST /api/orgs/[orgId]/incidents/[id]/timeline` - Add timeline entry

### Feature-Gated Modules
- `GET /api/orgs/[orgId]/problems` - Problem management
- `GET /api/orgs/[orgId]/changes` - Change management
- `GET /api/orgs/[orgId]/requests` - Request fulfillment
- `GET /api/orgs/[orgId]/catalog` - Service catalog
- `GET /api/orgs/[orgId]/kb` - Knowledge base

## Environment Variables Required
```bash
# Database
MONGODB_URI=mongodb+srv://...

# Authentication
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Notifications
SLACK_WEBHOOK_URL=
SENDGRID_API_KEY=

# Real-time
ABLY_API_KEY=

# Monitoring
SENTRY_DSN=
```

## Progress Tracking Guidelines

### When Starting Each Week
1. Review the tasks for the current week
2. Create TodoWrite items for each major task
3. Check off completed items in this document
4. Note any blockers or changes needed

### When Completing Each Phase
1. Update phase status in this document
2. Document any architectural changes made
3. Note lessons learned or improvements for next phase
4. Verify all core functionality works as expected

### File Organization Standards
- Keep components small and focused (max 200 lines)
- Use TypeScript for all files
- Follow Next.js App Router conventions
- Use Tailwind for all styling
- Implement error boundaries for all major features

### Testing Standards
- Unit tests for all API endpoints
- Integration tests for auth flows
- E2E tests for critical user journeys
- Test feature flag functionality thoroughly

## Feature Flag Implementation

### Storage
Feature flags are stored in the `Org.settings.features` object in MongoDB.

### Usage in Code
```typescript
// API middleware check
if (!org.settings.features.problemManagement) {
  return NextResponse.json({ error: 'Feature not enabled' }, { status: 403 });
}

// UI conditional rendering
{org.features.problemManagement && (
  <ProblemManagementSection />
)}
```

### Plan-to-Feature Mapping
- **Free**: incidentManagement only
- **Pro**: incidentManagement, problemManagement, requestFulfillment, knowledgeBase
- **Enterprise**: All features enabled

## Critical Success Factors
1. **Multi-tenancy**: All data must be properly isolated by orgId
2. **Feature Flags**: All ITSM modules must respect feature toggle settings
3. **Real-time**: Incident updates must be real-time across all connected clients
4. **Security**: Implement proper RBAC and data validation
5. **Performance**: Sub-200ms API response times
6. **Scalability**: Design for horizontal scaling from day 1

## Emergency Procedures
If context is lost or project needs to be resumed:
1. Read this entire document first
2. Check current phase status and last completed tasks
3. Review existing codebase structure
4. Run `npm run dev` to verify current state
5. Continue from the next incomplete task in sequence

## Contact & Resources
- Original Requirements: `incidentmanagementplan.md`
- Architecture Reference: This document
- For questions: Refer to original plan and this instruction set

---
**Last Updated**: Phase 1 Week 3 Complete - Ready for Week 4 (Notifications & Billing)
**Current Status**: Incident Management Core Complete - Dashboard & UI Functional