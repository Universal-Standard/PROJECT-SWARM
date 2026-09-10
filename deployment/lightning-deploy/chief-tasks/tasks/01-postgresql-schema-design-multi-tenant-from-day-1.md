# Task 01: PostgreSQL Schema Design (Multi-Tenant from Day 1)

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5 hours (with Chief AI)
- **Component**: Database
- **Phase**: Phase 1 - Foundation
- **Stream**: Database Stream
- **Dependencies**: Task 00 (vinext migration)

## Objective
Create the complete multi-tenant PostgreSQL schema using Prisma ORM. Multi-tenancy MUST be in the foundation schema — not retrofitted later.

## Background
SWARM uses Supabase (PostgreSQL) with Prisma ORM. The schema must support Organizations as the top-level tenant boundary with Row Level Security (RLS) policies enforced at the database level. See `prisma/schema.prisma` — this is already the complete schema. This task verifies, tests, and migrates it.

## Implementation Steps

### 1. Verify Schema File
```bash
cat prisma/schema.prisma
# Should contain: Organization, OrgMember, User, Workflow, Agent, Execution, etc.
```

### 2. Set DATABASE_URL
```bash
export DATABASE_URL="postgresql://postgres.[ref]:[pwd]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
```

### 3. Validate Schema
```bash
npx prisma validate
```

### 4. Generate Prisma Client
```bash
npx prisma generate
```

### 5. Create Initial Migration
```bash
npx prisma migrate dev --name init_multitenant_schema
```

### 6. Enable Row Level Security in Supabase
```sql
-- Run in Supabase SQL editor
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE executions ENABLE ROW LEVEL SECURITY;

-- RLS policies (org isolation)
CREATE POLICY "org_workflows" ON workflows
  USING (organization_id = current_setting('app.org_id', true)::uuid);
  
CREATE POLICY "org_agents" ON agents
  USING (organization_id = current_setting('app.org_id', true)::uuid);
```

### 7. Create Database Client Singleton
```typescript
// src/lib/db/prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const db = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = db
}

// Org context setter for RLS
export async function withOrg<T>(orgId: string, fn: () => Promise<T>): Promise<T> {
  await db.$executeRaw`SELECT set_config('app.org_id', ${orgId}, true)`
  return fn()
}
```

## Acceptance Criteria
- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` succeeds
- [ ] Migration created and applied
- [ ] RLS policies enabled on all org-scoped tables
- [ ] Organization, Workflow, Agent, Execution models all present
- [ ] Multi-tenancy enforced at DB level

## Deliverables
- `prisma/schema.prisma` — Complete schema
- `prisma/migrations/` — Migration files
- `src/lib/db/prisma.ts` — Client singleton
- `.env.example` — DATABASE_URL placeholder

## Testing Requirements
- [ ] `npx prisma validate` clean
- [ ] Integration test: create org, create workflow, verify isolation
- [ ] RLS test: org A cannot read org B data

## Documentation Updates
- Document schema in `docs/DATABASE.md`
- Add ERD diagram
- Document RLS policies

## Rollback Plan
1. `npx prisma migrate reset` to rollback
2. Keep migration rollback scripts
3. Backup Supabase before major schema changes
