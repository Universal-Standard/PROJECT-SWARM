# Task 12: Audit Logging System

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Security / Compliance
- **Phase**: Phase 1
- **Stream**: Security Stream
- **Dependencies**: Task 11

## Objective
Implement comprehensive audit logging for all user actions, API calls, and agent executions.

## Implementation
- Create src/lib/audit/logger.ts with structured logging
- Log all CRUD operations on workflows, agents, executions
- Log all authentication events (login, logout, token refresh)
- Log all API calls with request metadata
- Async logging to avoid blocking request handlers
- Implement audit log viewer API: GET /api/audit-logs
- Retention policy: 90 days free, 1 year pro, 7 years enterprise

## Acceptance Criteria
- [ ] All CRUD operations create audit log entries
- [ ] Auth events logged
- [ ] Audit logs queryable by orgId and date range
- [ ] Non-blocking async logging

## Deliverables
- `src/lib/audit/logger.ts`
- `src/lib/audit/types.ts`
- `src/app/api/audit-logs/route.ts`
