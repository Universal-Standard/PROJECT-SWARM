# Task 02: Prisma ORM Configuration & Type Generation

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5 hours (with Chief AI)
- **Component**: Database / ORM
- **Phase**: Phase 1 - Foundation
- **Stream**: Database Stream
- **Dependencies**: Task 01 (PostgreSQL schema)

## Objective
Configure Prisma ORM with full TypeScript types, query helpers, and connection pooling for Supabase.

## Background
Prisma is the type-safe ORM layer between SWARM and PostgreSQL. This task sets up the Prisma client with proper connection pooling (required for serverless/edge), generates all TypeScript types, and creates query helper utilities.

## Implementation Steps

### 1. Configure Prisma for Edge/Serverless
```typescript
// prisma/schema.prisma — add to generator block
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}
```

### 2. Install Prisma Adapter for Neon/Supabase
```bash
npm install @prisma/adapter-pg pg
```

### 3. Update DB Client for Edge Compatibility
```typescript
// src/lib/db/client.ts
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

export const db = new PrismaClient({ adapter })
```

### 4. Create Repository Pattern Helpers
```typescript
// src/lib/db/repositories/workflow.ts
import { db } from '../client'
import type { Prisma } from '@prisma/client'

export const workflowRepo = {
  findMany: (orgId: string, opts?: Prisma.WorkflowFindManyArgs) =>
    db.workflow.findMany({ where: { organizationId: orgId }, ...opts }),
    
  findById: (id: string, orgId: string) =>
    db.workflow.findFirst({ where: { id, organizationId: orgId } }),
    
  create: (orgId: string, data: Prisma.WorkflowCreateInput) =>
    db.workflow.create({ data: { ...data, organizationId: orgId } }),
    
  update: (id: string, orgId: string, data: Prisma.WorkflowUpdateInput) =>
    db.workflow.update({ where: { id }, data, 
      // Verify org ownership
      ...({ where: { id, organizationId: orgId } } as any) }),
      
  delete: (id: string, orgId: string) =>
    db.workflow.delete({ where: { id, organizationId: orgId } as any }),
}
```

## Acceptance Criteria
- [ ] Prisma client generates without errors
- [ ] All TypeScript types available
- [ ] Repository pattern implemented for Workflow, Agent, Execution
- [ ] Connection pooling configured for serverless
- [ ] Edge-compatible client exported

## Deliverables
- `src/lib/db/client.ts` — Edge-compatible Prisma client
- `src/lib/db/repositories/` — Repository pattern helpers
- `src/lib/db/index.ts` — Barrel export

## Testing Requirements
- [ ] Type generation: `npx prisma generate` clean
- [ ] Unit tests for repository methods
- [ ] Mock Prisma client for test isolation

## Documentation Updates
- Document repository patterns in `docs/DATABASE.md`
- Add type usage examples

## Rollback Plan
1. Revert to standard PrismaClient if adapter issues
2. Remove driver adapter package if unused
