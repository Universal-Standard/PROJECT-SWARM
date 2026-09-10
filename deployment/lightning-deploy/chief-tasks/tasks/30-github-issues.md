# Task 30: GitHub Issue Management Agent

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Automation / GitHub
- **Phase**: Phase 2
- **Stream**: GitHub Issues Stream
- **Dependencies**: Task 28

## Objective
Build an AI agent that triages GitHub issues: classifies, labels, estimates complexity, and routes to appropriate teams.

## Implementation
- Create IssueTriageAgent that analyzes new issues
- Classification: bug, feature, question, docs, security
- Complexity estimation: trivial/small/medium/large/epic
- Auto-labeling based on content and keywords
- Duplicate detection: find similar existing issues
- Auto-assignment to team members based on expertise
- Priority scoring: P0-P3 based on impact and urgency

## Acceptance Criteria
- [ ] New issues auto-labeled within 60s
- [ ] Duplicates flagged
- [ ] Complexity estimates accurate
- [ ] Auto-assignment works for known team members

## Deliverables
- `src/lib/agents/issue-triager.ts`
- `src/lib/github/issue-manager.ts`
