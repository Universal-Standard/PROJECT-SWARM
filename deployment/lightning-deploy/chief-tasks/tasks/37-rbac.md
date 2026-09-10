# Task 37: Role-Based Access Control

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Security / Auth
- **Phase**: Phase 3
- **Stream**: RBAC Stream
- **Dependencies**: Task 36

## Objective
Implement RBAC with predefined roles (Owner, Admin, Member, Viewer) and custom permission sets.

## Implementation
- Define permission matrix: roles × resources × actions
- OWNER: full access to all org resources
- ADMIN: manage users, workflows, agents — no billing
- MEMBER: create/run workflows — no user management
- VIEWER: read-only access to all resources
- Implement can(user, action, resource) helper
- UI permission guards: hide buttons/pages based on role
- API guards: middleware that checks permissions per endpoint

## Acceptance Criteria
- [ ] All 4 roles have correct permissions
- [ ] can() helper returns correct boolean
- [ ] UI hides unauthorized actions
- [ ] API returns 403 for unauthorized actions

## Deliverables
- `src/lib/rbac/permissions.ts`
- `src/lib/rbac/guards.ts`
- `src/components/rbac/PermissionGuard.tsx`
