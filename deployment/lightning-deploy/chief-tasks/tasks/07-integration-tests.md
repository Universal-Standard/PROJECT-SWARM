# Task 07: Integration Test Suite

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 1h
- **Component**: Testing
- **Phase**: Phase 1
- **Stream**: Testing Stream
- **Dependencies**: Task 06

## Objective
Create integration tests that test real database operations against a test Supabase instance.

## Implementation
- Set up test database using DATABASE_URL_TEST env variable
- Write integration tests for workflow CRUD with real DB
- Write integration tests for multi-tenant org isolation
- Write integration tests for auth flow (NextAuth)
- Create database cleanup fixtures (beforeEach/afterEach)
- Run integration tests in GitHub Actions with Supabase connection

## Acceptance Criteria
- [ ] Integration tests connect to test DB and pass
- [ ] Org isolation verified end-to-end
- [ ] Auth flow integration test passes
- [ ] DB cleanup runs after each test

## Deliverables
- `src/__tests__/integration/db/`
- `src/__tests__/integration/api/`
