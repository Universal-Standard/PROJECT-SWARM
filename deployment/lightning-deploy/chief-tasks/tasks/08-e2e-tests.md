# Task 08: End-to-End Test Suite (Playwright)

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 1h
- **Component**: Testing / QA
- **Phase**: Phase 1
- **Stream**: Testing Stream
- **Dependencies**: Task 07

## Objective
Set up Playwright E2E tests covering critical user flows: auth, workflow creation, agent execution.

## Implementation
- Install and configure Playwright: npx playwright install
- Create playwright.config.ts with base URL and browser config
- Write E2E test: user signs in via GitHub OAuth
- Write E2E test: create a new workflow
- Write E2E test: execute a workflow and view results
- Write E2E test: multi-tenant org switching
- Configure GitHub Actions Playwright runner

## Acceptance Criteria
- [ ] Playwright tests run in CI
- [ ] Sign-in E2E test passes
- [ ] Workflow creation E2E passes
- [ ] Agent execution E2E passes
- [ ] Screenshots captured on failure

## Deliverables
- `playwright.config.ts`
- `e2e/auth.spec.ts`
- `e2e/workflows.spec.ts`
- `e2e/agents.spec.ts`
