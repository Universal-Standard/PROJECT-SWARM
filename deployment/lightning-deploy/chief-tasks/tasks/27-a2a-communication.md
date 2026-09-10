# Task 27: Agent-to-Agent Communication Protocol

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Core / Protocols
- **Phase**: Phase 2
- **Stream**: A2A Stream
- **Dependencies**: Task 26

## Objective
Implement the Agent-to-Agent (A2A) communication protocol allowing agents to query, delegate to, and collaborate with each other.

## Implementation
- Create A2A message format: { from, to, type, payload, correlationId }
- Implement agent discovery: registry of active agents
- Direct messaging: agent A calls agent B synchronously
- Async delegation: agent A fires-and-forgets to agent B
- Shared context: agents can read/write shared state
- A2A via NATS JetStream for reliability
- A2A message tracing for debugging

## Acceptance Criteria
- [ ] Agent A can call Agent B and get response
- [ ] Async delegation works
- [ ] Shared state readable by all agents
- [ ] Message delivery guaranteed via NATS

## Deliverables
- `src/lib/a2a/messenger.ts`
- `src/lib/a2a/registry.ts`
- `src/lib/a2a/context.ts`
