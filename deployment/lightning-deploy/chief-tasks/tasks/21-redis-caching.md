# Task 21: API Response Caching Layer

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Performance / Redis
- **Phase**: Phase 2
- **Stream**: Redis Stream
- **Dependencies**: Task 19

## Objective
Implement intelligent API response caching that reduces AI API calls by 60-80% using semantic similarity and exact key matching.

## Implementation
- Create CacheManager with configurable TTLs per endpoint
- Implement stale-while-revalidate pattern
- Cache AI responses by prompt hash (exact match first)
- Add cache hit/miss metrics to monitoring
- Cache busting on content mutations
- Implement cache warming for popular prompts
- Dashboard: cache hit rate, saved API costs

## Acceptance Criteria
- [ ] Cache hit rate >60% on repeated queries
- [ ] Stale-while-revalidate works
- [ ] Cache invalidates on mutations
- [ ] Cost savings tracked

## Deliverables
- `src/lib/redis/cache-manager.ts`
- `src/lib/cache/middleware.ts`
