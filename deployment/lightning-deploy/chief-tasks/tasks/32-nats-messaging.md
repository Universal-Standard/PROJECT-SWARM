# Task 32: NATS JetStream Message Bus

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Infrastructure / Messaging
- **Phase**: Phase 2
- **Stream**: NATS Stream
- **Dependencies**: Task 22

## Objective
Set up NATS JetStream as the message bus for agent coordination, enabling durable pub/sub, request/reply, and event streaming.

## Implementation
- Deploy NATS server on Oracle Cloud Free Tier
- Configure JetStream with persistent streams for: agent-events, workflow-events
- Create src/lib/nats/client.ts for connecting/publishing/subscribing
- Implement: publish(subject, data), subscribe(subject, handler)
- Agent event stream: AGENT.started, AGENT.completed, AGENT.failed
- Workflow event stream: WORKFLOW.created, WORKFLOW.executed
- Message replay: re-process events from any point

## Acceptance Criteria
- [ ] NATS server running and accepting connections
- [ ] Agent events published to JetStream
- [ ] Subscribers receive events in <100ms
- [ ] Message replay works

## Deliverables
- `src/lib/nats/client.ts`
- `src/lib/nats/streams.ts`
- `docker-compose.nats.yml`
