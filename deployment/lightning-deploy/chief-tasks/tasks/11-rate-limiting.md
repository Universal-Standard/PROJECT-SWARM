# Task 11: Rate Limiting Middleware

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Security
- **Phase**: Phase 1
- **Stream**: Security Stream
- **Dependencies**: Task 02

## Objective
Implement tiered rate limiting using Upstash Redis with plan-based limits (free/pro/enterprise).

## Implementation
- Install @upstash/ratelimit
- Create src/lib/rate-limit/index.ts with plan-based limiters
- Free plan: 50 API calls/hour, 5 agents max
- Pro plan: 1000 API calls/hour, unlimited agents
- Enterprise: unlimited
- Implement rate limit middleware for Next.js API routes
- Return Retry-After header on 429 responses
- Log rate limit violations to audit table

## Acceptance Criteria
- [ ] 429 returned when limit exceeded
- [ ] Retry-After header present
- [ ] Plan limits enforced per org
- [ ] Rate limit resets after window
- [ ] Violations logged to audit_logs

## Deliverables
- `src/lib/rate-limit/index.ts`
- `src/middleware.ts (rate limit integration)`
