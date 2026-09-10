# Task 25: Hive Mind Master Coordinator

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 1h
- **Component**: Core / AI
- **Phase**: Phase 2
- **Stream**: Hive Mind Stream
- **Dependencies**: Tasks 01-08

## Objective
Build the Hive Mind — a master AI coordinator that decomposes complex tasks, delegates to specialized agents, and synthesizes results into coherent outputs.

## Implementation
- Create HiveMind class with Claude as the master reasoning model
- Implement task decomposition: break complex requests into subtasks
- Agent selection: match subtask requirements to agent capabilities
- Parallel delegation: dispatch subtasks to specialist agents
- Result synthesis: combine agent outputs into final answer
- Implement spot-checker agents that verify agent work quality
- Iterative improvement: failed subtasks get reassigned
- Explanation generation: show reasoning chain to users

## Acceptance Criteria
- [ ] Hive Mind decomposes complex tasks correctly
- [ ] Correct agents selected for subtasks
- [ ] Results synthesized into coherent output
- [ ] Quality check catches errors

## Deliverables
- `src/lib/hive-mind/coordinator.ts`
- `src/lib/hive-mind/decomposer.ts`
- `src/lib/hive-mind/synthesizer.ts`
