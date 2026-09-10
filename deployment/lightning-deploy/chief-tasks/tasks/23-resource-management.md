# Task 23: Agent Resource Management

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / Agents
- **Phase**: Phase 2
- **Stream**: Parallel Execution Stream
- **Dependencies**: Task 22

## Objective
Implement resource management for agents: token budgets, timeout enforcement, memory limits, and cost tracking.

## Implementation
- Track token usage per agent execution
- Enforce max_tokens limits from agent config
- Implement execution timeout with graceful cancellation
- Cost calculation: tokens × provider rate → USD
- Aggregate cost per workflow, per org, per month
- Cost alerts: notify when monthly budget 80% consumed
- Resource usage API: GET /api/orgs/:id/usage

## Acceptance Criteria
- [ ] Token budgets enforced per agent
- [ ] Timeouts cancel gracefully
- [ ] Costs tracked per execution
- [ ] Monthly cost alerts fire

## Deliverables
- `src/lib/orchestrator/resource-manager.ts`
- `src/app/api/orgs/[id]/usage/route.ts`
