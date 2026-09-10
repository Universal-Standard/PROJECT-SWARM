# Task 03: Database Migrations & Deployment Pipeline

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5 hours (with Chief AI)
- **Component**: Database / DevOps
- **Phase**: Phase 1 - Foundation
- **Stream**: Database Stream
- **Dependencies**: Task 02 (Prisma ORM)

## Objective
Establish a safe database migration pipeline with automated deployment, rollback capability, and environment-specific migration strategies.

## Background
Database migrations must be automated, safe, and reversible. This task creates the migration infrastructure that runs on every deployment, with separate strategies for dev (migrate dev) and production (migrate deploy).

## Implementation Steps

### 1. Create Migration Scripts
```json
// package.json additions
{
  "scripts": {
    "db:migrate:dev": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:migrate:status": "prisma migrate status",
    "db:migrate:reset": "prisma migrate reset --force",
    "db:push": "prisma db push",
    "db:diff": "prisma migrate diff"
  }
}
```

### 2. Create Migration GitHub Action
```yaml
# .github/workflows/db-migrate.yml
name: Database Migration (Production)
on:
  push:
    branches: [main]
    paths: ['prisma/migrations/**']
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### 3. Create Initial Seed Data
```typescript
// prisma/seed.ts
import { db } from '../src/lib/db/client'

async function main() {
  // Create default organization
  const defaultOrg = await db.organization.upsert({
    where: { slug: 'default' },
    update: {},
    create: { name: 'Default Organization', slug: 'default', plan: 'FREE' }
  })
  
  // Seed workflow templates
  const templates = [
    { name: 'Code Review Agent', category: 'Development', 
      description: 'Automated PR review with AI feedback' },
    { name: 'Research Assistant', category: 'Research',
      description: 'Multi-source research and synthesis agent' },
    { name: 'Data Analysis Pipeline', category: 'Analytics',
      description: 'Structured data analysis with visualization' },
    { name: 'Content Generation', category: 'Marketing',
      description: 'Multi-step content creation workflow' },
  ]
  
  for (const template of templates) {
    await db.workflowTemplate.upsert({
      where: { id: template.name.toLowerCase().replace(/ /g, '-') },
      update: {},
      create: { ...template, nodes: [], edges: [], config: {} }
    })
  }
  
  console.log('✅ Seed data created')
}

main().catch(console.error).finally(() => db.$disconnect())
```

## Acceptance Criteria
- [ ] `prisma migrate status` shows clean state
- [ ] Seed script runs without errors
- [ ] 4 workflow templates seeded
- [ ] Production migration action created
- [ ] Rollback procedure documented

## Deliverables
- `prisma/migrations/` — All migration files
- `prisma/seed.ts` — Seed data
- `.github/workflows/db-migrate.yml` — Auto-migration

## Testing Requirements
- [ ] Seed script idempotent (run twice, same result)
- [ ] Migration rollback test
- [ ] CI migration test on PR

## Documentation Updates
- Document migration workflow in `docs/MIGRATIONS.md`

## Rollback Plan
1. `prisma migrate resolve --rolled-back [migration_name]`
2. Manual SQL rollback scripts in `prisma/rollbacks/`
