# GitHub Project Board Configuration

## 🚀 Quick Start with GitHub CLI Automation

This document provides the complete configuration for creating and managing the PROJECT-SWARM GitHub Project Board, with **comprehensive GitHub CLI commands** for automation.

## Prerequisites

### Install GitHub CLI

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux (Debian/Ubuntu)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Verify installation
gh --version
```

### Authenticate with GitHub

```bash
# Login to GitHub
gh auth login

# Select:
# - GitHub.com
# - HTTPS
# - Login with a web browser (or paste a token)
# - Follow the prompts

# Verify authentication
gh auth status
```

## 🤖 Automated Project Board Setup

### Step 1: Create the Project Board

```bash
# Set your organization name
ORG_NAME="Universal-Standard"
REPO_NAME="PROJECT-SWARM"

# Create the project board (organization-level)
gh project create \
  --owner "$ORG_NAME" \
  --title "PROJECT-SWARM Development Board"

# Note: Projects are created in "Board" view by default
# You can change the view later in the web interface

# Save the project number from the output (e.g., 123)
# Replace with your actual project number after creation
PROJECT_NUMBER=123  # Example: change this to your project number

# View your project to verify
# gh project view 123 --owner Universal-Standard
```

### Step 2: Configure Custom Fields

Add custom fields to organize and track work:

#### Priority Field
```bash
gh project field-create "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --name "Priority" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "🔴 Critical,🟡 High,🟢 Medium,⚪ Low"
```

#### Effort Estimate Field
```bash
gh project field-create "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --name "Effort" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "XS (<1h),S (1-2h),M (3-5h),L (1-2d),XL (2+d)"
```

#### Component Field
```bash
gh project field-create "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --name "Component" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Workflow Builder,Execution Engine,AI Integration,GitHub Integration,UI/UX,Backend API,Database,Templates,Knowledge Base,Other"
```

#### Group Field (for parallel development)
```bash
gh project field-create "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --name "Group" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "Group A: Core,Group B: Auth,Group C: Monitoring,Group D: Knowledge,Group E: UX,Group F: Advanced,Group G: Future"
```

#### Sprint Field
```bash
gh project field-create "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --name "Sprint" \
  --data-type "NUMBER"
```

### Step 3: Link Repository to Project

```bash
# Link the repository to the project board
gh project link "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --repo "$REPO_NAME"

# Set as default project for the repository
gh variable set PROJECT_BOARD_URL \
  --repo "$ORG_NAME/$REPO_NAME" \
  --body "https://github.com/orgs/$ORG_NAME/projects/$PROJECT_NUMBER"
```

### Step 4: Add Issues to Project

```bash
# Add all open issues to the project
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state open \
  --limit 1000 \
  --json number \
  --jq '.[].number' | while read issue_number; do
    gh project item-add "$PROJECT_NUMBER" \
      --owner "$ORG_NAME" \
      --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/$issue_number"
done

# Add specific issues by number
gh project item-add "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/1"
```

### Step 5: Configure Saved Views

GitHub CLI doesn't directly support view creation, but you can configure them via the web UI or GraphQL API:

#### Using GraphQL API for Views
```bash
# Get project ID (needed for GraphQL)
PROJECT_ID=$(gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        id
      }
    }
  }' -f org="$ORG_NAME" -F number=$PROJECT_NUMBER --jq '.data.organization.projectV2.id')

echo "Project ID: $PROJECT_ID"
```

## 📋 Column Structure (10 Canonical Columns)

The board uses these columns for workflow management:

1. **📥 New** - Newly created issues awaiting triage
2. **📋 Backlog** - Triaged and accepted, not yet prioritized
3. **📝 To Do** - Prioritized work ready to start
4. **🚧 In Progress** - Active development work
5. **👀 In Review** - Code review and testing phase
6. **✅ Ready to Merge** - Approved and tested, ready for merge
7. **🚀 Deployed** - Merged to main and deployed
8. **✨ Done** - Completed and verified in production
9. **💡 Feature Requests** - Community proposals (filtered view)
10. **🔴 Blocked** - Cannot progress due to dependencies

### Additional Filtered Views

11. **🐛 Critical Bugs** - Filter: `label:bug AND label:critical`
12. **📊 Metrics Dashboard** - Analytics and progress tracking

## 🎯 Intake Workflow

### For Bug Reports
```bash
# When a bug is reported, auto-label and triage:
# 1. Issue created with bug template
# 2. Auto-labeled: bug, needs-triage
# 3. Moved to "New" column
# 4. Team reviews and adds priority (critical/high/medium/low)
# 5. Moved to "To Do" if critical/high, "Backlog" otherwise
# 6. Assigned to developer or labeled "help-wanted"
```

### For Feature Requests
```bash
# Community feature request workflow:
# 1. Issue created with feature request template
# 2. Auto-labeled: enhancement, feature-request
# 3. Moved to "Feature Requests" view
# 4. Community votes with 👍 reactions
# 5. High-voted features reviewed monthly
# 6. Accepted features moved to "Backlog" with priority
# 7. Scheduled for upcoming sprint
```

### For Maintenance Tasks
```bash
# Maintenance and tech debt workflow:
# 1. Issue created with task or fix template
# 2. Auto-labeled: task or fix, needs-triage
# 3. Component auto-detected from content
# 4. Group assigned for parallel development
# 5. Self-assignment or orchestrator assignment
# 6. Moved to "In Progress" when work starts
```

## 🗺️ Roadmap Integration

### Phase 1: Foundation (Weeks 1-2)
**Focus**: Critical bugs and core functionality
**Issues**: #1-5 from PROJECT_BOARD.md
**Groups**: Group A (Core), Group B (Auth)

```bash
# Label Phase 1 issues
# Note: Update issue numbers based on your actual repository issues
# These are example issue numbers from PROJECT_BOARD.md
for issue in 1 2 4 5 9; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-1,critical" \
    --milestone "Phase 1: Foundation"
done

# Or use label-based selection (more maintainable):
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "group-a-core,group-b-auth" \
  --state open \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-1,critical" \
    --milestone "Phase 1: Foundation"
done
```

### Phase 2: Monitoring & Knowledge (Weeks 3-4)
**Focus**: Real-time monitoring and knowledge base
**Issues**: #3, #6-8 from PROJECT_BOARD.md
**Groups**: Group C (Monitoring), Group D (Knowledge)

```bash
# Label Phase 2 issues (update numbers as needed)
for issue in 3 6 7 8; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-2,high" \
    --milestone "Phase 2: Monitoring"
done

# Or use group labels:
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "group-c-monitoring,group-d-knowledge" \
  --state open \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-2,high" \
    --milestone "Phase 2: Monitoring"
done
```

### Phase 3: User Experience (Weeks 5-6)
**Focus**: UX improvements and onboarding
**Issues**: #11-17 from PROJECT_BOARD.md
**Groups**: Group E (UX)

```bash
# Label Phase 3 issues (update range as needed)
for issue in {11..17}; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-3,medium" \
    --milestone "Phase 3: UX"
done

# Or use group label:
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "group-e-ux" \
  --state open \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-3,medium" \
    --milestone "Phase 3: UX"
done
```

### Phase 4: Advanced Features (Weeks 7-8)
**Focus**: Advanced capabilities and optimization
**Issues**: #10, #18-20 from PROJECT_BOARD.md
**Groups**: Group F (Advanced)

```bash
# Label Phase 4 issues (update as needed)
for issue in 10 18 19 20; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-4,medium" \
    --milestone "Phase 4: Advanced"
done

# Or use group label:
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "group-f-advanced" \
  --state open \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-4,medium" \
    --milestone "Phase 4: Advanced"
done
```

### Phase 5+: Future Enhancements (Weeks 9+)
**Focus**: Long-term features and innovation
**Issues**: #21-32 from PROJECT_BOARD.md
**Groups**: Group G (Future)

```bash
# Label Phase 5+ issues (update range as needed)
for issue in {21..32}; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-5,low,future" \
    --milestone "Phase 5: Future"
done

# Or use group label:
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "group-g-future" \
  --state open \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit $issue \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "phase-5,low,future" \
    --milestone "Phase 5: Future"
done
```

## Manual Web UI Setup (Alternative)

If you prefer using the web interface:

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

## 🔄 Automation Rules

### Automation via GitHub Actions

The project uses GitHub Actions workflows for advanced automation. These are configured in `.github/workflows/`:

#### Advanced Issue Triage (`advanced-issue-triage.yml`)
```bash
# This workflow auto-labels and routes issues
# Triggered on: issue opened, edited, labeled
# Actions:
# - Detects component from issue content
# - Assigns priority based on keywords
# - Adds to appropriate group for parallel work
# - Moves to correct column on project board
# - Posts welcome comment for first-time contributors

# Test the workflow
gh workflow run advanced-issue-triage.yml \
  --repo "$ORG_NAME/$REPO_NAME"
```

#### Orchestrator Assignment (`orchestrator-assignment.yml`)
```bash
# Intelligently assigns tasks based on:
# - Developer expertise (from past contributions)
# - Current workload (issues in progress)
# - Issue component and complexity
# - Team availability

# Trigger manual assignment
gh workflow run orchestrator-assignment.yml \
  --repo "$ORG_NAME/$REPO_NAME"

# Runs automatically every hour for issues labeled "auto-assign"
```

#### PR Automation (`pr-automation.yml`)
```bash
# Manages PR lifecycle:
# - Labels PR by size (XS, S, M, L, XL)
# - Links to related issues
# - Updates issue status to "in-review"
# - Warns on large PRs (>400 lines)
# - Auto-labels by changed files
# - Moves to appropriate project column

# View PR automation runs
gh run list --workflow=pr-automation.yml \
  --repo "$ORG_NAME/$REPO_NAME"
```

### Built-in Project Automation

Configure these rules in the Project Settings → Workflows:

#### Rule 1: New Issues to New Column
```yaml
# Navigate to: Project Settings → Workflows → Add workflow
# Name: New Issues
# When: Item added to project
# Event: Issues
# Conditions: Item added
# Action: Set Status to "New"
```

**Via GraphQL API:**
```bash
# Note: Get these IDs from the earlier field query in "Step 5: Configure Saved Views"
# - PROJECT_ID: From the project GraphQL query
# - ITEM_ID: From listing project items
# - STATUS_FIELD_ID: The ID of the "Status" field
# - NEW_STATUS_OPTION_ID: The ID of the "New" status option

gh api graphql -f query='
  mutation {
    updateProjectV2ItemFieldValue(
      input: {
        projectId: "'$PROJECT_ID'"
        itemId: "<ITEM_ID>"
        fieldId: "<STATUS_FIELD_ID>"
        value: { 
          singleSelectOptionId: "<NEW_STATUS_OPTION_ID>"
        }
      }
    ) {
      projectV2Item {
        id
      }
    }
  }'
```

#### Rule 2: In Progress Label → Column
```yaml
# When: Issue labeled "in-progress"
# Action: Set Status to "In Progress"
```

**CLI helper script:**
```bash
#!/bin/bash
# move-to-in-progress.sh
ISSUE_NUMBER=$1
gh project item-add "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/$ISSUE_NUMBER"
gh issue edit "$ISSUE_NUMBER" \
  --repo "$ORG_NAME/$REPO_NAME" \
  --add-label "in-progress"
```

#### Rule 3: PR Merged → Deployed
```yaml
# When: Pull request merged
# Action: 
#   - Set Status to "Deployed"
#   - Add label "deployed"
#   - Update linked issues
```

**Automation script:**
```bash
#!/bin/bash
# on-pr-merge.sh
PR_NUMBER=$1
# Get linked issues
ISSUES=$(gh pr view "$PR_NUMBER" --json body --jq '.body' | grep -oP '#\K\d+')
for issue in $ISSUES; do
  gh issue edit "$issue" \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "deployed"
  echo "Marked issue #$issue as deployed"
done
```

#### Rule 4: Critical Bug Alert
```yaml
# When: Issue labeled "critical" AND "bug"
# Action:
#   - Move to "Critical Bugs" view
#   - Pin issue
#   - Add to current sprint
#   - Notify team (via webhook)
```

**CLI implementation:**
```bash
#!/bin/bash
# critical-bug-alert.sh
ISSUE_NUMBER=$1
gh issue edit "$ISSUE_NUMBER" \
  --repo "$ORG_NAME/$REPO_NAME" \
  --add-label "critical,bug" \
  --milestone "Current Sprint"
gh issue pin "$ISSUE_NUMBER" --repo "$ORG_NAME/$REPO_NAME"
# Send notification (requires additional setup)
echo "🚨 Critical bug #$ISSUE_NUMBER reported!" | \
  gh api repos/$ORG_NAME/$REPO_NAME/dispatches \
    -f event_type=critical_bug \
    -f client_payload[issue]=$ISSUE_NUMBER
```

#### Rule 5: Feature Request Voting
```yaml
# When: Issue labeled "feature-request"
# Action:
#   - Move to "Feature Requests" view
#   - Sort by 👍 reactions
#   - Review monthly if >10 votes
```

**CLI query for top-voted features:**
```bash
# List feature requests by vote count
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "feature-request" \
  --state open \
  --json number,title,reactions \
  --jq 'sort_by(-.reactions."+1") | .[] | "#\(.number) (\(.reactions."+1") 👍): \(.title)"'
```

#### Rule 6: Self-Assignment
```yaml
# When: Issue created with "self-assigned" option
# Action:
#   - Assign to issue creator
#   - Add label "self-assigned"
#   - Move to "In Progress"
#   - Set status to active
```

**CLI implementation:**
```bash
# self-assign-issue.sh
ISSUE_NUMBER=$1
CREATOR=$(gh issue view "$ISSUE_NUMBER" --repo "$ORG_NAME/$REPO_NAME" --json author --jq '.author.login')
gh issue edit "$ISSUE_NUMBER" \
  --repo "$ORG_NAME/$REPO_NAME" \
  --add-assignee "$CREATOR" \
  --add-label "self-assigned,in-progress"
```

#### Rule 7: Blocked Item Tracking
```yaml
# When: Issue labeled "blocked"
# Action:
#   - Move to "Blocked" column
#   - Require blocker comment
#   - Review weekly in standup
#   - Alert if blocked >5 days
```

**CLI helper:**
```bash
# List blocked issues with duration
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "blocked" \
  --state open \
  --json number,title,createdAt \
  --jq '.[] | "#\(.number): \(.title) (blocked since \(.createdAt[:10]))"'
```

#### Rule 8: Auto-Archive Completed
```yaml
# When: Issue in "Done" for >30 days
# Action:
#   - Archive from project
#   - Keep issue open for reference
```

**CLI script:**
```bash
# archive-old-done-items.sh
# Find issues done more than 30 days ago
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "done" \
  --state closed \
  --json number,closedAt \
  --jq '.[] | select((now - (.closedAt | fromdateiso8601)) > 2592000) | .number' | \
while read issue; do
  echo "Archiving issue #$issue"
  # Remove from project (via GraphQL API)
  # gh api graphql -f query='...'
done
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

## 🔨 Bulk Operations & Advanced CLI Usage

### Bulk Label Operations

#### Add Priority Labels in Bulk
```bash
# Label all critical bugs
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "bug" \
  --state open \
  --search "critical in:title,body" \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit "$issue" --repo "$ORG_NAME/$REPO_NAME" --add-label "critical"
  echo "Labeled #$issue as critical"
done

# Label issues by component based on file paths
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state open \
  --search "client/ in:title,body" \
  --json number --jq '.[].number' | \
while read issue; do
  gh issue edit "$issue" --repo "$ORG_NAME/$REPO_NAME" --add-label "component:frontend"
done
```

#### Assign Group Labels for Parallel Development
```bash
# Group A: Core functionality issues
for issue in 2 4 5; do
  gh issue edit "$issue" \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "group-a-core"
done

# Group E: All UX issues
for issue in 11 12 13 14 15 16 17; do
  gh issue edit "$issue" \
    --repo "$ORG_NAME/$REPO_NAME" \
    --add-label "group-e-ux"
done
```

### Bulk Project Operations

#### Add All Issues to Project
```bash
# Add all open issues
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state open \
  --limit 1000 \
  --json number --jq '.[].number' | \
while read issue; do
  gh project item-add "$PROJECT_NUMBER" \
    --owner "$ORG_NAME" \
    --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/$issue"
  echo "Added issue #$issue to project"
  sleep 1  # Rate limiting
done

# Add all PRs to project
gh pr list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state open \
  --limit 100 \
  --json number --jq '.[].number' | \
while read pr; do
  gh project item-add "$PROJECT_NUMBER" \
    --owner "$ORG_NAME" \
    --url "https://github.com/$ORG_NAME/$REPO_NAME/pull/$pr"
  echo "Added PR #$pr to project"
  sleep 1
done
```

#### Bulk Update Custom Fields
```bash
# Set priority for multiple issues using GraphQL
# First, get field IDs
gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }' -f org="$ORG_NAME" -F number=$PROJECT_NUMBER

# Then use the IDs to update items
# (Store PRIORITY_FIELD_ID and CRITICAL_OPTION_ID from above query)
```

### Query and Reporting

#### Generate Sprint Report
```bash
#!/bin/bash
# sprint-report.sh
echo "📊 Sprint Report for PROJECT-SWARM"
echo "=================================="
echo ""
echo "✅ Completed this sprint:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "done" \
  --state closed \
  --search "closed:>=$(date -d '14 days ago' +%Y-%m-%d)" \
  --json number,title --jq '.[] | "  #\(.number): \(.title)"'

echo ""
echo "🚧 In Progress:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "in-progress" \
  --state open \
  --json number,title,assignees \
  --jq '.[] | "  #\(.number): \(.title) (@\(.assignees[0].login // "unassigned"))"'

echo ""
echo "🔴 Blocked:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "blocked" \
  --state open \
  --json number,title --jq '.[] | "  #\(.number): \(.title)"'

echo ""
echo "📋 Ready for Next Sprint:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "high" \
  --state open \
  --search "-label:in-progress -label:blocked" \
  --limit 10 \
  --json number,title --jq '.[] | "  #\(.number): \(.title)"'
```

#### Team Velocity Metrics
```bash
#!/bin/bash
# team-velocity.sh
echo "📈 Team Velocity Metrics"
echo "======================="

# Issues closed per week (last 4 weeks)
for week in {0..3}; do
  start_date=$(date -d "$((week * 7 + 7)) days ago" +%Y-%m-%d)
  end_date=$(date -d "$((week * 7)) days ago" +%Y-%m-%d)
  count=$(gh issue list \
    --repo "$ORG_NAME/$REPO_NAME" \
    --state closed \
    --search "closed:$start_date..$end_date" \
    --json number --jq 'length')
  echo "Week of $start_date: $count issues"
done

# Average time to close (cycle time)
echo ""
echo "⏱️ Average Cycle Time (last 10 closed issues):"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state closed \
  --limit 10 \
  --json number,createdAt,closedAt \
  --jq '.[] | "#\(.number): \(((.closedAt | fromdateiso8601) - (.createdAt | fromdateiso8601)) / 86400 | floor) days"'
```

#### Component Breakdown
```bash
# Issues by component
echo "📦 Issues by Component:"
for component in "workflow-builder" "execution-engine" "ai-integration" "github-integration" "ui-ux"; do
  count=$(gh issue list \
    --repo "$ORG_NAME/$REPO_NAME" \
    --label "$component" \
    --state open \
    --json number --jq 'length')
  echo "  $component: $count open issues"
done
```

### Maintenance Scripts

#### Weekly Triage Script
```bash
#!/bin/bash
# weekly-triage.sh
echo "🔍 Weekly Issue Triage"
echo "====================="
echo ""

# Untriaged issues (needs-triage label)
echo "📥 Issues needing triage:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "needs-triage" \
  --state open \
  --json number,title,createdAt \
  --jq '.[] | "  #\(.number) (created \(.createdAt[:10])): \(.title)"'

echo ""
echo "⏰ Stale issues (no activity >30 days):"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state open \
  --search "updated:<$(date -d '30 days ago' +%Y-%m-%d)" \
  --json number,title \
  --jq '.[] | "  #\(.number): \(.title)"'

echo ""
echo "🎯 High priority without assignee:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "high" \
  --state open \
  --search "no:assignee" \
  --json number,title \
  --jq '.[] | "  #\(.number): \(.title)"'
```

#### Sprint Planning Helper
```bash
#!/bin/bash
# plan-next-sprint.sh
SPRINT_NUMBER=$1

echo "📅 Planning Sprint $SPRINT_NUMBER"
echo "================================"
echo ""

# High priority issues without sprint
echo "🎯 High priority candidates:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "high" \
  --state open \
  --search "-label:in-progress" \
  --limit 15 \
  --json number,title,labels \
  --jq '.[] | "  #\(.number): \(.title) [\(.labels | map(.name) | join(", "))]"'

echo ""
echo "💡 Top voted feature requests:"
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --label "feature-request" \
  --state open \
  --json number,title,reactions \
  --jq 'sort_by(-.reactions."+1") | .[0:5] | .[] | "  #\(.number) (\(.reactions."+1") 👍): \(.title)"'

echo ""
echo "To add issues to sprint $SPRINT_NUMBER, run:"
echo "  gh issue edit <NUMBER> --repo $ORG_NAME/$REPO_NAME --milestone \"Sprint $SPRINT_NUMBER\""
```

## Integration with GitHub Actions

The project board integrates with these workflows:
- `advanced-issue-triage.yml` - Auto-labels and assigns issues
- `orchestrator-assignment.yml` - Assigns tasks based on expertise
- `pr-automation.yml` - Manages PR lifecycle
- `parallel-agent-workflow.yml` - Enables parallel development

### Triggering Workflows via CLI

```bash
# Manually trigger issue triage
gh workflow run advanced-issue-triage.yml \
  --repo "$ORG_NAME/$REPO_NAME"

# Trigger orchestrator assignment
gh workflow run orchestrator-assignment.yml \
  --repo "$ORG_NAME/$REPO_NAME"

# View workflow runs
gh run list --repo "$ORG_NAME/$REPO_NAME" --limit 10

# View specific workflow run logs
gh run view <RUN_ID> --repo "$ORG_NAME/$REPO_NAME" --log
```

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

## 🔧 Troubleshooting with CLI

### Issues Not Auto-adding to Project

**Diagnose:**
```bash
# Check if project exists and is accessible
gh project view "$PROJECT_NUMBER" --owner "$ORG_NAME"

# Check repository connection
gh repo view "$ORG_NAME/$REPO_NAME"

# Verify PROJECT_BOARD_URL variable
gh variable list --repo "$ORG_NAME/$REPO_NAME"
```

**Fix:**
```bash
# Re-link repository to project
gh project link "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --repo "$REPO_NAME"

# Manually add recent issues
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state open \
  --limit 10 \
  --json number --jq '.[].number' | \
while read issue; do
  gh project item-add "$PROJECT_NUMBER" \
    --owner "$ORG_NAME" \
    --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/$issue"
done
```

### Items Stuck in Wrong Column

**Diagnose:**
```bash
# Check item status in project
gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue {
                number
                title
              }
            }
            fieldValues(first: 10) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field {
                    ... on ProjectV2SingleSelectField {
                      name
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }' -f org="$ORG_NAME" -F number=$PROJECT_NUMBER
```

**Fix:**
```bash
# Check labels on issue
gh issue view <ISSUE_NUMBER> --repo "$ORG_NAME/$REPO_NAME" --json labels

# Add missing labels
gh issue edit <ISSUE_NUMBER> \
  --repo "$ORG_NAME/$REPO_NAME" \
  --add-label "in-progress"

# Manually move in web UI or via GraphQL API
```

### Automation Not Triggering

**Diagnose:**
```bash
# Check workflow status
gh workflow view advanced-issue-triage.yml \
  --repo "$ORG_NAME/$REPO_NAME"

# View recent workflow runs
gh run list \
  --workflow=advanced-issue-triage.yml \
  --repo "$ORG_NAME/$REPO_NAME" \
  --limit 5

# View failed run logs
gh run view <RUN_ID> \
  --repo "$ORG_NAME/$REPO_NAME" \
  --log-failed
```

**Fix:**
```bash
# Re-run failed workflow
gh run rerun <RUN_ID> --repo "$ORG_NAME/$REPO_NAME"

# Manually trigger workflow
gh workflow run advanced-issue-triage.yml \
  --repo "$ORG_NAME/$REPO_NAME"

# Check workflow permissions
gh api repos/$ORG_NAME/$REPO_NAME/actions/permissions

# Enable workflow if disabled
gh api -X PUT repos/$ORG_NAME/$REPO_NAME/actions/permissions \
  -f enabled=true
```

### Labels Not Syncing

**Diagnose:**
```bash
# List all labels
gh label list --repo "$ORG_NAME/$REPO_NAME"

# Check specific label
gh label view "in-progress" --repo "$ORG_NAME/$REPO_NAME"
```

**Fix:**
```bash
# Re-run label creation script
cd /home/runner/work/PROJECT-SWARM/PROJECT-SWARM
./scripts/create-labels.sh

# Or create specific missing label
gh label create "in-progress" \
  --repo "$ORG_NAME/$REPO_NAME" \
  --color "0E8A16" \
  --description "Work in progress"
```

### Rate Limiting Issues

**Diagnose:**
```bash
# Check rate limit status
gh api rate_limit

# View rate limit for GraphQL
gh api rate_limit | jq '.resources.graphql'
```

**Fix:**
```bash
# Add delays in bulk operations (already shown in scripts above)
# Use authenticated requests (gh auth login)
# Split large operations into smaller batches

# Example with rate limit checking:
while read issue; do
  # Check rate limit before each operation
  remaining=$(gh api rate_limit | jq '.resources.core.remaining')
  if [ "$remaining" -lt 10 ]; then
    echo "Rate limit low, waiting 60 seconds..."
    sleep 60
  fi
  gh project item-add "$PROJECT_NUMBER" \
    --owner "$ORG_NAME" \
    --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/$issue"
done
```

### Custom Field Not Appearing

**Diagnose:**
```bash
# List all custom fields
gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
      }
    }
  }' -f org="$ORG_NAME" -F number=$PROJECT_NUMBER
```

**Fix:**
```bash
# Recreate missing custom field (example: Priority)
gh project field-create "$PROJECT_NUMBER" \
  --owner "$ORG_NAME" \
  --name "Priority" \
  --data-type "SINGLE_SELECT" \
  --single-select-options "🔴 Critical,🟡 High,🟢 Medium,⚪ Low"
```

### Backup and Recovery

**Backup Project Configuration:**
```bash
#!/bin/bash
# backup-project.sh
BACKUP_DIR="project-backups"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/project-$PROJECT_NUMBER-$(date +%Y%m%d-%H%M%S).json"

# Export project data
gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        title
        shortDescription
        public
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field {
              id
              name
              dataType
            }
            ... on ProjectV2SingleSelectField {
              id
              name
              options {
                id
                name
              }
            }
          }
        }
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue {
                number
                title
                url
              }
              ... on PullRequest {
                number
                title
                url
              }
            }
          }
        }
      }
    }
  }' -f org="$ORG_NAME" -F number=$PROJECT_NUMBER > "$BACKUP_FILE"

echo "Backup saved to: $BACKUP_FILE"
```

**Export Issues with Metadata:**
```bash
#!/bin/bash
# export-issues.sh
gh issue list \
  --repo "$ORG_NAME/$REPO_NAME" \
  --state all \
  --limit 1000 \
  --json number,title,body,state,labels,assignees,createdAt,closedAt,comments \
  > "issues-backup-$(date +%Y%m%d).json"

echo "Issues exported successfully"
```

## 📚 Resources and References

### Official Documentation
- [GitHub Projects V2 Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub CLI Manual](https://cli.github.com/manual/)
- [GitHub GraphQL API](https://docs.github.com/en/graphql)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### PROJECT-SWARM Specific Docs
- [PROJECT_BOARD.md](../PROJECT_BOARD.md) - All 32 planned issues with details
- [PROJECT_BOARD_MASTER_GUIDE.md](../PROJECT_BOARD_MASTER_GUIDE.md) - Complete guide overview
- [PROJECT_BOARD_SETUP.md](../PROJECT_BOARD_SETUP.md) - Original manual setup guide
- [PROJECT_BOARD_README.md](../PROJECT_BOARD_README.md) - Quick start README
- [README_PROJECT_MANAGEMENT.md](../README_PROJECT_MANAGEMENT.md) - Daily workflow guide

### Scripts and Automation
- `scripts/create-labels.sh` - Creates all project labels
- `scripts/generate-issues.js` - Generates issues from roadmap
- `.github/workflows/advanced-issue-triage.yml` - Auto-triage workflow
- `.github/workflows/orchestrator-assignment.yml` - Smart assignment
- `.github/workflows/pr-automation.yml` - PR lifecycle management

### Additional Tools
- [GitHub Desktop](https://desktop.github.com/) - GUI for Git operations
- [gh-dash](https://github.com/dlvhdr/gh-dash) - Terminal dashboard for GitHub
- [gh-projects](https://github.com/github/gh-projects) - Enhanced CLI for projects

## 🎯 Quick Reference Commands

### Essential Commands
```bash
# View project
gh project view $PROJECT_NUMBER --owner $ORG_NAME

# Add issue to project
gh project item-add $PROJECT_NUMBER --owner $ORG_NAME \
  --url "https://github.com/$ORG_NAME/$REPO_NAME/issues/<NUMBER>"

# List project items
gh project item-list $PROJECT_NUMBER --owner $ORG_NAME --limit 100

# Create issue with labels
gh issue create --repo $ORG_NAME/$REPO_NAME \
  --title "Title" \
  --body "Description" \
  --label "bug,critical"

# Edit issue
gh issue edit <NUMBER> --repo $ORG_NAME/$REPO_NAME \
  --add-label "in-progress" \
  --add-assignee "@me"

# View issue
gh issue view <NUMBER> --repo $ORG_NAME/$REPO_NAME

# List issues by label
gh issue list --repo $ORG_NAME/$REPO_NAME --label "critical"

# Trigger workflow
gh workflow run <WORKFLOW_NAME> --repo $ORG_NAME/$REPO_NAME

# View workflow runs
gh run list --repo $ORG_NAME/$REPO_NAME --limit 10
```

## ✅ Post-Setup Checklist

After completing the automated setup, verify:

- [ ] Project board created and visible at org/projects
- [ ] All custom fields added (Priority, Effort, Component, Group, Sprint)
- [ ] Repository linked to project
- [ ] PROJECT_BOARD_URL variable set
- [ ] Labels created (run `./scripts/create-labels.sh`)
- [ ] Issues added to project board
- [ ] Workflows enabled and running
- [ ] Automation rules configured
- [ ] Team members have access
- [ ] Sample issue triaged successfully
- [ ] Documentation reviewed by team

### Verification Commands
```bash
# Run these from any directory (not path-specific)

# 1. Verify project exists
gh project view $PROJECT_NUMBER --owner $ORG_NAME

# 2. Verify labels exist
gh label list --repo $ORG_NAME/$REPO_NAME | grep -E "(critical|high|medium|low)"

# 3. Verify workflows are enabled
gh workflow list --repo $ORG_NAME/$REPO_NAME

# 4. Check recent workflow runs
gh run list --repo $ORG_NAME/$REPO_NAME --limit 5

# 5. Verify PROJECT_BOARD_URL variable
gh variable get PROJECT_BOARD_URL --repo $ORG_NAME/$REPO_NAME

# 6. Test issue creation and auto-add
gh issue create --repo $ORG_NAME/$REPO_NAME \
  --title "Test Issue" \
  --body "Testing automation" \
  --label "test"

# 7. Verify test issue appears in project
gh project item-list $PROJECT_NUMBER --owner $ORG_NAME --limit 5
```

### Label Creation Script
```bash
# Run label creation script
# Note: Adjust path based on your current directory
cd /path/to/PROJECT-SWARM  # Or navigate to your repo root
./scripts/create-labels.sh

# For GitHub Actions environment specifically:
# cd /home/runner/work/PROJECT-SWARM/PROJECT-SWARM
# ./scripts/create-labels.sh
```

## 🚀 Next Steps

1. **Train your team** on the project board workflow
2. **Create initial issues** from PROJECT_BOARD.md roadmap
3. **Set up sprint milestones** for tracking progress
4. **Configure notifications** (Slack/Discord webhooks)
5. **Establish review cadence** (daily triage, weekly planning)
6. **Monitor metrics** using the built-in dashboards
7. **Iterate and improve** based on team feedback

---

**Version:** 2.0 - Enhanced with GitHub CLI Automation  
**Last Updated:** 2025-12-11  
**Maintained By:** PROJECT-SWARM Team

For questions or issues, open a discussion or create an issue with label `project-management`.
