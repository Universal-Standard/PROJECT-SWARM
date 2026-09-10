# Task 19: Upstash Redis Client & Session Store

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / Redis
- **Phase**: Phase 2
- **Stream**: Redis Stream
- **Dependencies**: Phase 1 complete

## Objective
Configure Upstash Redis client for edge-compatible caching with Cloudflare Workers, session storage, and pub/sub.

## Implementation
- Install @upstash/redis and configure for edge runtime
- Create src/lib/redis/client.ts with singleton pattern
- Implement session store: set, get, delete, refresh TTL
- Create cache helpers: cache(), invalidate(), invalidatePattern()
- Configure TTLs: sessions 7 days, API cache 5 min, rate limits 1 hour
- Implement Redis pub/sub for real-time agent status updates

## Acceptance Criteria
- [ ] Redis client connects to Upstash successfully
- [ ] Sessions persist across requests
- [ ] Cache invalidation works
- [ ] Pub/sub messages delivered

## Deliverables
- `src/lib/redis/client.ts`
- `src/lib/redis/session.ts`
- `src/lib/redis/cache.ts`
