# Simplicity ITSM

A modern, multi-tenant IT Service Management (ITSM) SaaS platform built with Next.js, MongoDB, and Tailwind CSS.

## Features

- 🎯 **Incident Management** - Create, track, and resolve incidents with real-time updates
- 🏢 **Multi-tenant Architecture** - Secure organization isolation with feature toggles
- ⚡ **Real-time Collaboration** - Live updates across all connected clients
- 📊 **Analytics & Reporting** - SLA tracking, MTTR metrics, and custom dashboards
- 🔧 **Modular ITSM** - Problem, Change, Request, and Knowledge Management modules
- 💰 **Subscription Billing** - Stripe integration with tier-based features
- 🔔 **Smart Notifications** - Slack, Email, and SMS alerts with escalation policies

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS
- **Backend**: Next.js API routes (serverless functions)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Authentication**: NextAuth.js
- **Payments**: Stripe Billing
- **Real-time**: Ably
- **Hosting**: Vercel
- **Monitoring**: Sentry + Vercel Analytics

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- MongoDB Atlas account (or local MongoDB)
- Vercel account for deployment

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd simplicity-itsm
\`\`\`

2. Install dependencies:
\`\`\`bash
pnpm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env.local
# Edit .env.local with your configuration
\`\`\`

4. Start the development server:
\`\`\`bash
pnpm dev
\`\`\`

## Project Structure

\`\`\`
apps/
  web/                 # Next.js application
packages/
  db/                  # MongoDB schemas and models
  ui/                  # Shared Tailwind components
  lib/                 # Utilities (auth, billing, notifications)
  types/               # TypeScript type definitions
\`\`\`

## Development

- \`pnpm dev\` - Start development server
- \`pnpm build\` - Build for production
- \`pnpm lint\` - Run ESLint
- \`pnpm type-check\` - Run TypeScript checks
- \`pnpm format\` - Format code with Prettier

## Deployment

This project is optimized for deployment on Vercel:

1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## License

Private - All rights reserved