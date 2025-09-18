# ITSM Management SaaS Project — Plan & Documentation

> This markdown file provides the roadmap, architecture, and technical details for building the ITSM Management SaaS product using **Next.js, React, Tailwind, Vercel, and MongoDB Atlas**.

The name of the product is called "Simplicity"

---

## Table of Contents

1. Project Overview
2. Phases & Roadmap
3. MVP Feature List
4. Architecture & Tech Choices
5. Multi-tenancy & SaaS Architecture
6. ITSM Elements (Feature Toggles)
7. Data Model (Schemas)
8. API Endpoints
9. Realtime & Notifications
10. Security & Compliance
11. Observability & Monitoring
12. Repo Structure
13. CI/CD with Vercel
14. Integrations
15. Prioritized TODOs

---

## 1. Project Overview

A multi-tenant SaaS for engineering teams to:
- Create, triage, assign, and resolve incidents.
- Maintain a timeline of updates.
- Send real-time alerts (Slack, Email, SMS).
- Track SLAs/MTTR with dashboards.
- Support billing & subscription plans.
- Provide modular ITSM functionality that can be toggled on/off per account.

Stack:
- **Frontend**: Next.js (React + Tailwind)
- **Hosting**: Vercel
- **Database**: MongoDB Atlas
- **Realtime**: Ably/Pusher/Supabase Realtime
- **Auth**: NextAuth.js or Clerk
- **Billing**: Stripe Billing

---

## 2. Phases & Roadmap

- **Phase 1 (MVP)**: User/org auth, incident creation, dashboard, Slack/email notifications, billing.
- **Phase 2**: Realtime incident updates, escalation policies, audit logs.
- **Phase 3**: Advanced integrations (PagerDuty, Twilio), analytics, automation.
- **Phase 4**: Enterprise features (SSO/SAML, custom retention, regional hosting).
- **Phase 5**: Expand into full ITSM capabilities.

---

## 3. MVP Feature List

- User & org accounts with invites.
- Incident lifecycle: open → acknowledged → investigating → resolved.
- Assignment & ownership handoff.
- Timeline with notes & status changes.
- Email + Slack notifications.
- Dashboard for active incidents & SLA metrics.
- Billing/subscription with Stripe.
- Basic audit logs.

---

## 4. Architecture & Tech Choices

- **Frontend/UI**: Next.js App Router + Tailwind UI components.
- **APIs**: Next.js API routes (serverless functions). Use Edge Functions for reads when latency matters.
- **Database**: MongoDB Atlas (shared DB with `orgId` per document for MVP).
- **ORM/ODM**: Mongoose (Mongo-native) or Prisma (type-safe).
- **Realtime**: Ably/Pusher for event publishing and subscription.
- **Background Jobs**: Queue for escalations and batch notifications (Redis/BullMQ or managed workers).

---

## 5. Multi-tenancy & SaaS Architecture

To ensure this is a true SaaS product, the system will:

### Tenancy Model
- **Shared DB with `orgId` column** (recommended for MVP).
- **Separate DB per tenant** (optional for enterprise accounts).

### Account Structure
- **Organization** = customer account.
- **Users** with roles: `admin`, `member`, `oncall`.
- **Clients/projects** optionally nested under org.
- **Billing**: Stripe customer = organization.

### Routing
- **Option A: Subdomain per org** (`acme.incidentapp.com`).
- **Option B: Path-based** (`incidentapp.com/acme/...`).

➡️ MVP uses path-based; upgrade to subdomain routing later.

### Scalability
- Serverless scaling on Vercel.
- Cluster scaling on MongoDB Atlas.
- Feature toggles per plan.

---

## 6. ITSM Elements (Feature Toggles)

The platform should support modular **IT Service Management (ITSM)** elements. Each org can enable/disable modules based on subscription tier or preferences.

### Core ITSM Modules
1. **Incident Management** (always on): create, track, resolve incidents.
2. **Problem Management**: identify root causes, link related incidents.
3. **Change Management**: plan, approve, and track system changes.
4. **Request Fulfillment**: manage service requests and approvals.
5. **Service Catalog**: publish services and requestable items.
6. **Knowledge Management**: articles, FAQs, postmortems.
7. **Asset & Configuration Management**: track CI items, dependencies.
8. **Service Level Management**: define and monitor SLAs/OLAs.

### Implementation
- **Feature Flags**: stored in `Org.settings`:
```json
{
  "features": {
    "incidentManagement": true,
    "problemManagement": false,
    "changeManagement": false,
    "requestFulfillment": true,
    "serviceCatalog": false,
    "knowledgeBase": true,
    "assetManagement": false,
    "slaManagement": true
  }
}
```
- **UI/Routes**: conditionally show/hide based on enabled features.
- **Billing plans**: map to feature availability (e.g., enterprise = full ITSM).

---

## 7. Data Model (Schemas)

**Org**
```json
{
  "_id": "...",
  "name": "...",
  "plan": "free|pro|enterprise",
  "settings": {
    "features": { "incidentManagement": true, "problemManagement": false }
  },
  "billing": { "stripeCustomerId": "..." }
}
```

**User**
```json
{
  "_id": "...",
  "orgId": "...",
  "email": "...",
  "roles": ["admin", "oncall"]
}
```

**Incident**
```json
{
  "_id": "...",
  "orgId": "...",
  "title": "...",
  "severity": "P1|P2|P3",
  "status": "open|ack|investigating|resolved",
  "assignees": ["userId"],
  "timeline": [ { "userId": "...", "type": "note|status", "text": "...", "ts": "..." } ]
}
```

**Problem**
```json
{
  "_id": "...",
  "orgId": "...",
  "linkedIncidents": ["incidentId"],
  "rootCause": "...",
  "workaround": "...",
  "status": "identified|resolved"
}
```

**Change**
```json
{
  "_id": "...",
  "orgId": "...",
  "description": "...",
  "approvalStatus": "pending|approved|rejected",
  "window": { "start": "...", "end": "..." },
  "relatedProblems": ["problemId"]
}
```

---

## 8. API Endpoints

- `POST /api/orgs/:orgId/incidents`
- `GET /api/orgs/:orgId/problems`
- `POST /api/orgs/:orgId/changes`
- `POST /api/orgs/:orgId/requests`
- `GET /api/orgs/:orgId/catalog`
- `GET /api/orgs/:orgId/kb`

Endpoints enabled only if the org has the feature flag on.

---

## 9. Realtime & Notifications

- Publish incident updates to Ably/Pusher channels (`orgId` scoped).
- Slack, Email, SMS notifications.
- Escalation jobs for on-call handoff.

---

## 10. Security & Compliance

- Tenant isolation enforced by `orgId`.
- Immutable audit logs.
- Feature flags validated server-side.
- HTTPS enforced.

---

## 11. Observability & Monitoring

- Errors: Sentry.
- Logs: Datadog/Logflare.
- Metrics: Grafana.
- Backups: Atlas snapshots.

---

## 12. Repo Structure

```
/apps
  /web (Next.js app)
/packages
  /db (schemas/models)
  /lib (auth, billing, notifications, featureFlags)
  /ui (shared Tailwind components)
```

---

## 13. CI/CD with Vercel

- Git → Vercel deployments.
- Preview branches for PRs.
- Feature flag testing in staging.
- E2E tests with Playwright.

---

## 14. Integrations

1. Slack (MVP)
2. Email (MVP)
3. PagerDuty (Phase 2)
4. Twilio SMS (Phase 2)
5. Webhooks (Phase 2)
6. Jira/ServiceNow (Phase 3 ITSM integration)

---

## 15. Prioritized TODOs

- [ ] Repo scaffold with Next.js + Tailwind.
- [ ] Setup MongoDB Atlas + initial schemas.
- [ ] Auth with NextAuth.js/Clerk.
- [ ] Incident, Problem, Change models.
- [ ] CRUD APIs with feature flag checks.
- [ ] Notifications (Slack + email).
- [ ] Dashboard UI with conditional ITSM modules.
- [ ] Stripe billing integration with feature mapping.
- [ ] Audit logs.
- [ ] Realtime updates (Ably/Pusher).
- [ ] Tests + CI/CD pipeline.

---

*End of file.*

