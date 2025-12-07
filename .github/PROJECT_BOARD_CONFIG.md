# GitHub Project Board Configuration

## Project Board Setup

This document provides the complete configuration for creating and managing the PROJECT-SWARM GitHub Project Board.

## Creating the Project Board

### Step 1: Create New Project
1. Navigate to: `https://github.com/orgs/Universal-Standard/projects`
2. Click **"New project"**
3. Select **"Board"** view
4. Name: **"PROJECT-SWARM Development Board"**
5. Description: **"Track bugs, features, tasks, fixes, and planned upgrades"**

### Step 2: Configure Project Settings
1. Click project settings (⚙️)
2. Enable the following:
   - ✅ Issue tracking
   - ✅ Pull request tracking
   - ✅ Draft issues
   - ✅ Automation
3. Set visibility: **Public** (or Organization)

## Column Configuration

Create the following columns in order:

### 1. 📥 New
**Purpose**: Newly created issues awaiting triage

**Automation**:
- Auto-add: All new issues
- Auto-add: All new PRs

### 2. 📋 Backlog
**Purpose**: Triaged and accepted, but not yet prioritized

**Move here when**:
- Issue labeled: `needs-triage` removed
- Manual move from New

### 3. 📝 To Do
**Purpose**: Prioritized work ready to start

**Move here when**:
- Issue labeled: `high`, `critical`, or `medium` priority
- Manual move with priority assigned

### 4. 🚧 In Progress
**Purpose**: Active development work

**Automation**:
- Auto-move: Issue labeled `in-progress`
- Auto-move: PR draft created linked to issue
- Auto-move: Issue assigned to developer

**Move here when**:
- Developer starts work
- Issue self-assigned or orchestrator-assigned

### 5. 👀 In Review
**Purpose**: Code review and testing phase

**Automation**:
- Auto-move: PR marked "Ready for Review"
- Auto-move: Issue labeled `in-review`

**Move here when**:
- PR submitted for review
- Awaiting approval

### 6. ✅ Ready to Merge
**Purpose**: Approved and tested, ready for merge

**Automation**:
- Auto-move: PR approved by required reviewers
- Auto-move: All CI checks pass
- Auto-move: Issue labeled `ready-to-merge`

**Move here when**:
- PR approved
- All checks green
- No merge conflicts

### 7. 🚀 Deployed
**Purpose**: Merged to main and deployed

**Automation**:
- Auto-move: PR merged
- Auto-move: Issue labeled `deployed`
- Auto-close: Issue (after 24 hours in Deployed)

**Move here when**:
- PR merged to main branch
- Deployment workflow succeeds

### 8. ✨ Done
**Purpose**: Completed and verified in production

**Automation**:
- Auto-close: Issue
- Auto-archive: After 30 days

**Move here when**:
- Feature verified working in production
- Manual move after verification

### 9. 💡 Feature Requests
**Purpose**: Community feature proposals with voting

**Filter**: Label = `feature-request`

**Sort by**: 👍 reactions (descending)

**Move here when**:
- Issue created with feature-request label
- Community can vote with 👍 reactions

### 10. 🔴 Blocked
**Purpose**: Work that cannot progress due to dependencies

**Move here when**:
- Issue labeled `blocked`
- Blocker reason documented in comment

**Return from here when**:
- Blocker resolved
- Returns to previous column

### 11. 🐛 Critical Bugs
**Purpose**: Critical bugs requiring immediate attention

**Filter**: Labels = `bug` AND `critical`

**Automation**:
- Alert team on Slack/Discord (if configured)
- Auto-assign to on-call engineer

### 12. 📊 Analytics View
**Purpose**: Track metrics and progress

**Custom fields to add**:
- Priority (Single select: Critical, High, Medium, Low)
- Effort (Single select: XS, S, M, L, XL)
- Component (Single select: Frontend, Backend, Database, etc.)
- Group (Single select: A, B, C, D, E, F, G)
- Sprint (Number)
- Story Points (Number)

## Custom Fields

Add these custom fields to all items:

### Priority
- Type: **Single select**
- Options:
  - 🔴 Critical
  - 🟡 High
  - 🟢 Medium
  - ⚪ Low

### Effort Estimate
- Type: **Single select**
- Options:
  - XS (< 1 hour)
  - S (1-2 hours)
  - M (3-5 hours)
  - L (1-2 days)
  - XL (2+ days)

### Component
- Type: **Single select**
- Options:
  - Workflow Builder
  - Execution Engine
  - AI Integration
  - GitHub Integration
  - UI/UX
  - Backend API
  - Database
  - Templates
  - Knowledge Base
  - Other

### Group
- Type: **Single select**
- Options:
  - Group A: Core
  - Group B: Auth
  - Group C: Monitoring
  - Group D: Knowledge
  - Group E: UX
  - Group F: Advanced
  - Group G: Future

### Sprint
- Type: **Iteration**
- Duration: 2 weeks
- Start date: Next Monday

### Assignee Type
- Type: **Single select**
- Options:
  - Self-assigned
  - Auto-assigned
  - Orchestrator-assigned
  - Team-assigned
  - Volunteer

## Views

Create these additional views:

### View 1: Board View (Default)
- Layout: **Board**
- Group by: **Status**
- Sort: **Priority** then **Created**
- Show: All items

### View 2: Priority Matrix
- Layout: **Board**
- Group by: **Priority**
- Sort: **Effort** (ascending)
- Show: To Do, In Progress items

### View 3: Team View
- Layout: **Board**
- Group by: **Assignee**
- Filter: Status = In Progress
- Show: In Progress items

### View 4: Sprint View
- Layout: **Board**
- Group by: **Status**
- Filter: Sprint = Current Sprint
- Show: Current sprint items

### View 5: Group View (Parallel Development)
- Layout: **Board**
- Group by: **Group**
- Filter: Status = To Do, In Progress
- Show: Active work by group

### View 6: Component View
- Layout: **Board**
- Group by: **Component**
- Filter: Status != Done
- Show: Active work by component

### View 7: Timeline View
- Layout: **Roadmap**
- Group by: **Component**
- Sort: **Priority**
- Date field: Target date

### View 8: Table View
- Layout: **Table**
- Columns: Title, Status, Priority, Effort, Assignee, Labels
- Sort: Priority (descending)
- Show: All items

### View 9: Feature Voting
- Layout: **Table**
- Filter: Label = `feature-request`
- Sort: 👍 reactions (descending)
- Columns: Title, Reactions, Comments, Priority, Effort
- Show: Only feature requests

### View 10: Metrics Dashboard
- Layout: **Table**
- Group by: **Status**
- Show: Count by status
- Calculate: Sum of story points per status

## Automation Rules

Configure these automation rules:

### Rule 1: New Issues to New Column
```
When: Issue opened
Then: Add to project → Move to "New"
```

### Rule 2: New PRs to In Review
```
When: PR opened
Then: Add to project → Move to "In Review"
```

### Rule 3: Labeled In Progress
```
When: Issue labeled "in-progress"
Then: Move to "In Progress"
```

### Rule 4: PR Ready for Review
```
When: PR ready for review
Then: Move to "In Review"
```

### Rule 5: PR Approved
```
When: PR approved AND checks pass
Then: Move to "Ready to Merge" AND add label "ready-to-merge"
```

### Rule 6: PR Merged
```
When: PR merged
Then: Move to "Deployed" AND add label "deployed"
```

### Rule 7: Issue Closed
```
When: Issue closed
Then: Move to "Done"
```

### Rule 8: Critical Bugs
```
When: Issue labeled "critical" AND "bug"
Then: Move to "Critical Bugs" AND notify team
```

### Rule 9: Blocked
```
When: Issue labeled "blocked"
Then: Move to "Blocked"
```

### Rule 10: Feature Requests
```
When: Issue labeled "feature-request"
Then: Move to "Feature Requests"
```

### Rule 11: Auto-assign
```
When: Issue labeled "auto-assign"
Then: Trigger orchestrator-assignment workflow
```

### Rule 12: Self-assigned
```
When: Issue labeled "self-assigned"
Then: Assign to issue creator AND move to "In Progress"
```

## Insights and Reports

Enable these insights:

### Burn-up Chart
- Track: Issues closed over time
- Group by: Sprint
- Show: Cumulative progress

### Velocity Chart
- Track: Story points completed per sprint
- Show: Average velocity

### Cycle Time
- Measure: Time from "To Do" to "Done"
- Group by: Component
- Show: Average and median

### Throughput
- Track: Items completed per week
- Show: Trend line

### Work in Progress
- Track: Items in "In Progress"
- Alert when: > 16 items (WIP limit)

### Lead Time
- Measure: Time from "New" to "Done"
- Group by: Priority
- Show: Distribution

## Labels to Sync

Ensure these labels exist and sync to project:

**Priority**: `critical`, `high`, `medium`, `low`
**Type**: `bug`, `enhancement`, `feature-request`, `task`, `fix`, `planned-upgrade`
**Status**: `in-progress`, `in-review`, `blocked`, `ready-to-merge`, `deployed`
**Component**: `workflow-builder`, `execution-engine`, `github-integration`, etc.
**Group**: `group-a-core`, `group-b-auth`, `group-c-monitoring`, etc.
**Assignment**: `self-assigned`, `auto-assign`, `orchestrator-assigned`, `help-wanted`
**Size**: `size/xs`, `size/s`, `size/m`, `size/l`, `size/xl`

## Team Configuration

### Roles
- **Maintainers**: Full access, can merge to main
- **Contributors**: Can create issues and PRs
- **Triagers**: Can label and assign issues
- **Reviewers**: Can review and approve PRs

### Teams
Create these GitHub teams:
- `@Universal-Standard/core-team` - Core functionality
- `@Universal-Standard/ux-team` - UI/UX work
- `@Universal-Standard/security-team` - Security reviews
- `@Universal-Standard/docs-team` - Documentation

## Integration with GitHub Actions

The project board integrates with these workflows:
- `advanced-issue-triage.yml` - Auto-labels and assigns issues
- `orchestrator-assignment.yml` - Assigns tasks based on expertise
- `pr-automation.yml` - Manages PR lifecycle
- `parallel-agent-workflow.yml` - Enables parallel development

## Maintenance Schedule

### Daily
- Review new issues in "New" column
- Check "Blocked" items for resolution
- Merge approved PRs in "Ready to Merge"

### Weekly
- Sprint planning: Move items from Backlog to To Do
- Review Feature Requests by vote count
- Update metrics and insights
- Team sync on "In Progress" items

### Bi-weekly (Sprint)
- Sprint retrospective
- Update velocity and burn-up charts
- Prioritize next sprint items
- Review and close Done items

### Monthly
- Review and update custom fields
- Archive items older than 30 days in Done
- Analyze metrics and trends
- Update automation rules if needed

## Success Metrics

Track these KPIs:
- **Velocity**: Average story points per sprint
- **Cycle Time**: Average time from To Do to Done
- **Throughput**: Issues closed per week
- **Bug Resolution Time**: Time to fix critical bugs
- **Feature Delivery**: Features completed per month
- **Community Engagement**: Feature request participation

## Troubleshooting

### Issues Not Auto-adding
- Check project automation settings
- Verify webhook is active
- Check workflow permissions

### Items Stuck in Column
- Review automation rules
- Check for missing labels
- Manually move if needed

### Automation Not Triggering
- Review GitHub Actions logs
- Check label spelling
- Verify workflow syntax

## Resources

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [PROJECT_BOARD.md](../PROJECT_BOARD.md) - Detailed issue list
- [PROJECT_BOARD_SETUP.md](../PROJECT_BOARD_SETUP.md) - Original setup guide
- [README_PROJECT_MANAGEMENT.md](../README_PROJECT_MANAGEMENT.md) - Management guide
