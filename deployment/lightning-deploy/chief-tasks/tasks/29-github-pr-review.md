# Task 29: AI-Powered Pull Request Review

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5h
- **Component**: Automation / GitHub
- **Phase**: Phase 2
- **Stream**: GitHub PR Review Stream
- **Dependencies**: Task 28

## Objective
Build an AI agent that performs intelligent pull request reviews: code quality, security, performance, and breaking changes.

## Implementation
- Create PRReviewAgent using Claude for deep code analysis
- Analyze diff for: bugs, security vulns, performance issues, style
- Generate inline review comments on specific lines
- Provide overall review summary with approval/request changes decision
- Check for breaking API changes
- Verify test coverage hasn't decreased
- Post review as GitHub bot comment

## Acceptance Criteria
- [ ] Agent reviews PRs and posts GitHub comments
- [ ] Inline comments on specific lines
- [ ] Security issues flagged
- [ ] Breaking changes detected

## Deliverables
- `src/lib/agents/pr-reviewer.ts`
- `src/lib/github/review.ts`
