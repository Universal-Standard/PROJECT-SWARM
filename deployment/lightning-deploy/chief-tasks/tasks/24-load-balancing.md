# Task 24: AI Provider Load Balancing

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / AI
- **Phase**: Phase 2
- **Stream**: Parallel Execution Stream
- **Dependencies**: Task 22

## Objective
Implement intelligent load balancing across AI providers with health checking, failover, and cost optimization.

## Implementation
- Create ProviderRouter with health check ping every 30s
- Route by: speed (Groq), quality (Claude), cost (Groq/Google free)
- Automatic failover: if Groq rate-limited, switch to Google
- Round-robin for identical-capability requests
- Provider health dashboard
- SLA tracking: response time P50/P95/P99 per provider

## Acceptance Criteria
- [ ] Requests route to healthy providers
- [ ] Failover works when provider down
- [ ] P95 latency <2s for Groq, <5s for Claude
- [ ] Cost per request tracked

## Deliverables
- `src/lib/ai/load-balancer.ts`
- `src/lib/ai/health-checker.ts`
