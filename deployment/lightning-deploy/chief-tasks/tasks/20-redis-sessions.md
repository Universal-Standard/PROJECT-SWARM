# Task 20: Redis Session Management

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / Auth
- **Phase**: Phase 2
- **Stream**: Redis Stream
- **Dependencies**: Task 19

## Objective
Implement Redis-backed session management with sliding window expiry, device tracking, and revocation.

## Implementation
- Create SessionManager class with Redis backend
- Implement sliding window expiry (reset TTL on each request)
- Track active sessions per user (max 5 concurrent)
- Session revocation: logout all devices
- Store session metadata: device, IP, last_seen
- Session analytics: active sessions dashboard

## Acceptance Criteria
- [ ] Sessions store and retrieve from Redis
- [ ] Sliding window expiry works
- [ ] Multi-device sessions tracked
- [ ] Session revocation immediate

## Deliverables
- `src/lib/redis/session-manager.ts`
- `src/app/api/sessions/route.ts`
