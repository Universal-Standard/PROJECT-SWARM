# Task 42: Plugin Developer SDK

## Context
- **Priority**: P2 - Medium
- **Estimated Hours**: 0.5h
- **Component**: Developer Tools / SDK
- **Phase**: Phase 3
- **Stream**: Plugin SDK Stream
- **Dependencies**: Task 41

## Objective
Create a developer SDK for building SWARM plugins with TypeScript types, local testing tools, and documentation.

## Implementation
- Create sdk/ directory with full TypeScript types
- SDK exports: defineAgent, defineTool, defineIntegration
- Type-safe plugin manifest generation
- Local testing: swarm-plugin test command
- Publishing: swarm-plugin publish command
- Example plugins: Hello World, GitHub Stars Counter, Weather Agent
- Comprehensive SDK documentation

## Acceptance Criteria
- [ ] SDK exports all required types
- [ ] Example plugin builds and runs
- [ ] Local testing tool works
- [ ] Publish command packages plugin correctly

## Deliverables
- `sdk/index.ts`
- `sdk/types.ts`
- `sdk/cli/`
- `sdk/examples/`
- `docs/PLUGIN-SDK.md`
