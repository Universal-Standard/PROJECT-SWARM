# Task 44: Notification System

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / UX
- **Phase**: Phase 3
- **Stream**: Notifications Stream
- **Dependencies**: Phase 2 complete

## Objective
Build a multi-channel notification system for workflow completion, agent failures, cost alerts, and system events.

## Implementation
- Create NotificationService with channels: email, Slack, webhook, in-app
- Email notifications via Resend API (free tier: 100 emails/day)
- Slack webhook notifications: workflow complete, agent failed, budget alert
- In-app notifications: Bell icon with unread count
- Notification preferences: per-channel, per-event-type settings
- Notification history: last 30 days searchable
- Batch digest: daily/weekly summary email option

## Acceptance Criteria
- [ ] Email notifications sent on workflow completion
- [ ] Slack webhook delivers within 30s
- [ ] In-app notifications appear without page refresh
- [ ] Preferences saved and respected

## Deliverables
- `src/lib/notifications/service.ts`
- `src/lib/notifications/channels/`
- `src/components/NotificationBell.tsx`
- `src/app/api/notifications/route.ts`
