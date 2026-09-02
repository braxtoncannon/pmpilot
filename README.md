# PMPilot

PMPilot is an AI-powered project management application designed to help users create, organize, monitor, and reason about projects from one workspace.

## Current Status

**Stage:** MVP complete / pre-deployment

The core MVP is built and the production build passes. Vercel and Supabase are configured; final production deployment, domain setup, and Resend email configuration are the current launch tasks.

## Core Features

- User authentication and persistent project data
- AI-assisted project creation and generated project plans
- Project dashboard / command center
- Task creation, editing, deletion, assignment, and workflow movement
- Milestones, timeline, and calendar views
- Team member management and workload visibility
- Project reports and analytics
- AI Project Insights
- Project-aware AI assistant
- Messages and notification history
- Project search, sorting, filtering, and status management
- Responsive navigation and first-use / empty states

## Tech Stack

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- Supabase (database, authentication, row-level security)
- OpenAI API
- Resend (email; deployment configuration in progress)
- Vercel
- Git / GitHub

## Application Structure

Key routes currently include:

- `/` — PMPilot home / project generator
- `/auth` — authentication
- `/projects` — saved projects and project workspace
- `/api/generate` — AI project-plan generation

Reusable UI is organized under `components/`, with shared application logic under `lib/`.

## Local Development

1. Clone the repository.
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and provide your own credentials.
4. Start the development server:

```bash
npm run dev
```

5. Open the local URL shown by Next.js.

## Validation

Before committing a release:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Environment Variables

See `.env.example`.

Never commit `.env.local`, API keys, service-role keys, or other secrets.

## Product Roadmap

### Phase 1 — MVP Build
Core project-management experience, persistence, AI planning, tasks, milestones, team management, reports, and project-aware AI.

### Phase 2 — Pre-Deployment
Production configuration, environment variables, security review, domain, Resend, and Vercel deployment.

### Phase 3 — Production Validation
End-to-end production testing, persistence checks, mobile testing, error-state testing, and launch fixes.

### Phase 4 — Beta Testing
Real-user usability testing, feedback collection, bug tracking, and product validation.

### Phase 5 — MVP Iteration
Prioritized improvements based on beta evidence.

### Phase 6 — Decision Intelligence
Project Health Engine, proactive risk detection, recommendations, and stronger project memory.

### Phase 7 — Advanced PMPilot
Potential Mission Autopilot, what-if simulation, predictive deadlines, dependency intelligence, and cross-project intelligence.

## Product Direction

PMPilot's long-term direction is an **AI Project Command Center** focused on project decision intelligence rather than AI chat alone. The goal is to help users understand project health, identify risk, determine what needs attention, and make better project decisions.

## Deployment

Production deployment is currently in progress. A live demo URL will be added after deployment and production validation.

## Version History

See `CHANGELOG.md`.
