# Task 38: Application Monitoring & Alerting

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Operations / Monitoring
- **Phase**: Phase 3
- **Stream**: Monitoring Stream
- **Dependencies**: Phase 2 complete

## Objective
Set up comprehensive application monitoring: uptime, performance, error tracking, and cost monitoring.

## Implementation
- Configure Uptime Robot for 50 monitors (free tier)
- Add health check endpoint: GET /api/health with component status
- Integrate Better Stack for log aggregation
- Error tracking: capture and alert on 5xx errors
- Performance monitoring: P50/P95/P99 response times
- Cost monitoring: daily/monthly AI API spend alerts
- Alert channels: email, Slack webhook, PagerDuty (optional)

## Acceptance Criteria
- [ ] Health endpoint returns component status
- [ ] 5xx errors trigger alerts within 60s
- [ ] Response time percentiles tracked
- [ ] Cost alerts fire at 80% and 100% budget

## Deliverables
- `src/app/api/health/route.ts`
- `src/lib/monitoring/`
- `docs/MONITORING.md`
