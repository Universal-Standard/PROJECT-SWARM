# Task 06: Core Unit Tests

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 1h
- **Component**: Testing
- **Phase**: Phase 1
- **Stream**: Testing Stream
- **Dependencies**: Task 05

## Objective
Write unit tests for all core utilities, helpers, and business logic.

## Implementation
- Write tests for src/lib/db/repositories/ — all CRUD operations
- Write tests for src/lib/security/ — rate limiting, auth guards
- Write tests for src/lib/api/ — request validation, error handling
- Write tests for workflow execution logic
- Mock Prisma using jest.mock and prisma-mock library
- Achieve 80%+ coverage on all lib/* modules

## Acceptance Criteria
- [ ] 80%+ unit test coverage on lib/*
- [ ] All repository methods tested
- [ ] Rate limiting logic tested
- [ ] Auth guard unit tests pass

## Deliverables
- `src/__tests__/unit/db/`
- `src/__tests__/unit/lib/`
- `src/__tests__/unit/api/`
