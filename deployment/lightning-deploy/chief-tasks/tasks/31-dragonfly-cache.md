# Task 31: DragonflyDB High-Performance Cache Layer

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / Performance
- **Phase**: Phase 2
- **Stream**: DragonflyDB Stream
- **Dependencies**: Task 19

## Objective
Integrate DragonflyDB as a high-performance Redis-compatible cache for hot data, with Upstash as the persistent backing store.

## Implementation
- Deploy DragonflyDB on Oracle Cloud Free Tier (ARM, 24GB RAM)
- Configure as Redis-compatible cache (same API as ioredis)
- Hot data layer: agent execution results, model responses
- Cache-aside pattern: check Dragonfly → Redis → DB
- Cache warming on startup for top 100 workflow templates
- Monitoring: cache hit rate, memory usage, eviction rate

## Acceptance Criteria
- [ ] DragonflyDB connected and responding
- [ ] Cache hit rate >70% for hot data
- [ ] Fallback to Redis on Dragonfly failure
- [ ] Memory usage <80%

## Deliverables
- `src/lib/dragonfly/client.ts`
- `src/lib/cache/multi-tier.ts`
