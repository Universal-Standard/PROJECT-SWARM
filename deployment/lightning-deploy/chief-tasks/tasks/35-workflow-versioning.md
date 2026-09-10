# Task 35: Workflow Version Control

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Core / Versioning
- **Phase**: Phase 2
- **Stream**: Workflow Versioning Stream
- **Dependencies**: Tasks 01-08

## Objective
Implement semantic versioning for workflows with diff visualization, rollback, and A/B testing support.

## Implementation
- Add version field to Workflow model (already in schema)
- Auto-increment version on every save
- Store workflow snapshot history in workflow_versions table
- Diff API: compare two versions visually
- Rollback: revert to any previous version
- Branch workflows: create variant for A/B testing
- Lock versions: prevent editing production workflows

## Acceptance Criteria
- [ ] Version increments on every save
- [ ] Full history queryable
- [ ] Rollback restores previous version
- [ ] Diff shows node/edge changes
- [ ] Locked versions reject edits

## Deliverables
- `src/lib/versioning/workflow-versioner.ts`
- `src/app/api/workflows/[id]/versions/route.ts`
