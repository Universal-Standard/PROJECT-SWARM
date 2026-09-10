# Task 33: Business Rules Engine (Drools/JSON Rules)

## Context
- **Priority**: P1 - Medium
- **Estimated Hours**: 0.5h
- **Component**: Core / Rules
- **Phase**: Phase 2
- **Stream**: Drools Stream
- **Dependencies**: Task 22

## Objective
Implement a rules engine for agent decision making: route requests, enforce policies, and apply business logic without code changes.

## Implementation
- Implement JSON-based rules engine (or integrate json-rules-engine npm)
- Rule structure: { conditions, actions, priority }
- Built-in rules: rate limit enforcement, model selection, cost gates
- Rule editor UI: create/edit rules without code
- Rule versioning: track rule changes with history
- Rule testing: validate rules against sample data
- Hot reload: update rules without redeployment

## Acceptance Criteria
- [ ] Rules engine evaluates conditions correctly
- [ ] Model selection rules work
- [ ] Cost gate rules block over-budget requests
- [ ] Rules hot-reload without restart

## Deliverables
- `src/lib/rules/engine.ts`
- `src/lib/rules/types.ts`
- `src/app/api/rules/route.ts`
