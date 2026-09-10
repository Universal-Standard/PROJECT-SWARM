# Task 43: Example Workflows & Agent Templates

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Content / Examples
- **Phase**: Phase 3
- **Stream**: Examples Stream
- **Dependencies**: Task 04

## Objective
Create production-quality example workflows and agent configurations that demonstrate SWARM's capabilities.

## Implementation
- Create 4 production-ready workflow examples in examples/workflows/
- PR Review Workflow: GitHub webhook → Code Review Agent → Post comment
- Research Pipeline: User query → Web Search → Summarize → Report Agent
- Deployment Monitor: Cron trigger → Health Check → Alert Agent
- Content Generation: Brief input → Research → Write → Review → Publish
- Each example includes: workflow.json, README.md, expected output
- Import examples into the live database as templates

## Acceptance Criteria
- [ ] 4 workflow examples complete and importable
- [ ] Each example runs end-to-end
- [ ] README documents setup and expected results
- [ ] Templates appear in UI

## Deliverables
- `examples/workflows/pr-review/`
- `examples/workflows/research-pipeline/`
- `examples/workflows/deploy-monitor/`
- `examples/workflows/content-generation/`
