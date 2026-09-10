# Task 36: Multi-Tenant Architecture Hardening

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 1h
- **Component**: Security / Multi-Tenancy
- **Phase**: Phase 3
- **Stream**: Multi-Tenant Stream
- **Dependencies**: Phase 2 complete

## Objective
Harden multi-tenant isolation: verify RLS policies, implement tenant provisioning flow, and add cross-tenant access prevention tests.

## Implementation
- Audit all DB queries for missing organizationId filters
- Verify Prisma middleware enforces org context on all queries
- Implement OrganizationMiddleware that sets RLS context per request
- Tenant provisioning: create org, default roles, invite first user
- Tenant deletion: cascade delete all org data (GDPR compliance)
- Cross-tenant isolation test suite: verify org A cannot see org B data
- Penetration test: attempt cross-org data access 10 different ways

## Acceptance Criteria
- [ ] All queries filtered by org (audit passes)
- [ ] RLS blocks cross-org access
- [ ] Tenant provisioning flow complete
- [ ] Isolation test suite passes 100%

## Deliverables
- `src/lib/tenant/middleware.ts`
- `src/lib/tenant/provisioner.ts`
- `src/__tests__/security/tenant-isolation.test.ts`
