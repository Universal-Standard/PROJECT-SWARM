# Task 28: GitHub Repository Automation

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Automation / GitHub
- **Phase**: Phase 2
- **Stream**: GitHub Automation Stream
- **Dependencies**: Tasks 01-08

## Objective
Build GitHub automation capabilities: auto-create repos, manage branches, run workflows, and respond to webhooks.

## Implementation
- Create GitHubAutomation service using Octokit
- Implement: createRepo, createBranch, mergeBranch, deleteRepo
- Webhook handler: receive GitHub events and route to agents
- Auto-comment on PRs with agent analysis
- Auto-label issues based on content
- GitHub Actions trigger: launch workflows from SWARM
- Repository secrets management via API

## Acceptance Criteria
- [ ] Create/merge/delete repos via API
- [ ] Webhooks received and processed
- [ ] PRs auto-commented
- [ ] Issues auto-labeled
- [ ] GitHub Actions triggered from SWARM

## Deliverables
- `src/lib/github/automation.ts`
- `src/app/api/webhooks/github/route.ts`
