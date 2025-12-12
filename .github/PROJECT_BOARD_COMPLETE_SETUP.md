# Complete Project Board Setup Guide

## Overview

This guide provides step-by-step instructions to set up the complete project board system for PROJECT-SWARM, including GitHub issues, pull requests, labels, workflows, actions, wiki, and GitHub Copilot integration.

## Features

The project board system includes:

✅ **Issue Templates** (5 types)
- Bug reports with severity tracking
- Feature requests with community voting
- Tasks with assignment options
- Planned upgrades with phases
- Fixes for non-critical issues

✅ **Automated Workflows** (4 workflows)
- Advanced issue triage and auto-labeling
- Orchestrator-based task assignment
- PR automation and lifecycle management
- Parallel agent workflow execution

✅ **Label System** (40+ labels)
- Priority: critical, high, medium, low
- Type: bug, enhancement, feature-request, task, fix
- Status: in-progress, in-review, blocked, ready-to-merge
- Components: workflow-builder, execution-engine, etc.
- Groups: group-a-core through group-g-future

✅ **Assignment Options**
- Self-assigned (automatic assignment to creator)
- Auto-assign (orchestrator assigns based on expertise)
- Team assignment (requires team review)
- Open for volunteers (community contribution)

✅ **Pull Request Templates**
- Comprehensive PR template with checklists
- Automated PR labeling and size warnings
- Review request automation
- Merge lifecycle tracking

✅ **Wiki Integration**
- Complete wiki structure planned
- Documentation templates
- Setup guides for all features

✅ **GitHub Copilot**
- Project-specific coding guidelines
- TypeScript and React patterns
- Security and performance best practices

## Quick Start (5 Minutes)

### Step 1: Create Labels
```bash
cd /home/runner/work/PROJECT-SWARM/PROJECT-SWARM
chmod +x scripts/create-labels.sh
./scripts/create-labels.sh
```

This creates all 40+ labels for the project.

### Step 2: Create Project Board
1. Go to: https://github.com/orgs/Universal-Standard/projects
2. Click "New project"
3. Select "Board" view
4. Name: "PROJECT-SWARM Development Board"
5. Click "Create"

### Step 3: Configure Project Board

**Option A: Automated Setup with GitHub CLI (Recommended)**

Follow the automated setup in `.github/PROJECT_BOARD_CONFIG.md`:
```bash
# See PROJECT_BOARD_CONFIG.md for complete CLI commands including:
# - Automated project board creation
# - Custom field creation (Priority, Effort, Component, Group, Sprint)
# - Bulk issue operations
# - Automation rules setup
# - View configuration via GraphQL API
```

**Option B: Manual Setup via Web Interface**

Follow the manual configuration steps in `.github/PROJECT_BOARD_CONFIG.md`:
- Create columns (New, Backlog, To Do, In Progress, etc.)
- Add custom fields (Priority, Effort, Component, Group)
- Configure automation rules
- Create multiple views (Board, Priority Matrix, Team View, etc.)

### Step 4: Set Repository Variable
```bash
# Using GitHub CLI
gh variable set PROJECT_BOARD_URL --body "https://github.com/orgs/Universal-Standard/projects/YOUR_PROJECT_NUMBER"

# Or via GitHub web interface:
# Settings → Secrets and variables → Actions → Variables → New repository variable
# Name: PROJECT_BOARD_URL
# Value: https://github.com/orgs/Universal-Standard/projects/YOUR_PROJECT_NUMBER
```

### Step 5: Enable Wiki
1. Go to repository Settings
2. Scroll to "Features"
3. Check "Wikis"
4. Click "Save"

### Step 6: Create Wiki Pages
Follow the guide in `docs/WIKI_SETUP.md` to create wiki pages:
- Home page with navigation
- Getting Started guide
- Project Board Guide
- API Reference
- Developer Guide

### Step 7: Test the System
1. Create a test issue using one of the templates
2. Verify it gets auto-labeled and added to project board
3. Test self-assignment option
4. Check that workflows trigger correctly

## Detailed Setup

### Issue Templates Setup

All issue templates are already created in `.github/ISSUE_TEMPLATE/`:
- `01-bug-report.yml` - For critical bugs
- `02-feature-request.yml` - For new features
- `03-task.yml` - For development tasks
- `04-planned-upgrade.yml` - For major upgrades
- `05-fix.yml` - For non-critical fixes
- `config.yml` - Template configuration

**No action needed** - templates are ready to use!

### Workflows Setup

Four workflows are configured in `.github/workflows/`:

#### 1. Advanced Issue Triage (`advanced-issue-triage.yml`)
**Triggers**: When issues are opened, edited, or labeled
**Actions**:
- Auto-labels based on content
- Detects priority from severity
- Assigns component labels
- Maps to group labels
- Handles assignment types (self, auto, team, volunteer)
- Adds to project board
- Posts welcome comment

**No configuration needed** - works automatically!

#### 2. Orchestrator Assignment (`orchestrator-assignment.yml`)
**Triggers**: 
- Hourly cron schedule
- Manual workflow dispatch
**Actions**:
- Finds unassigned tasks with `auto-assign` label
- Assigns based on expertise and workload
- Updates labels to `orchestrator-assigned`
- Posts assignment comment

**Configuration needed**:
Edit the workflow to add team member usernames:
```yaml
const team = {
  'core-engine': {
    labels: ['group-a-core', 'execution-engine'],
    members: ['username1', 'username2'] // Add actual usernames
  },
  // ... more teams
};
```

#### 3. PR Automation (`pr-automation.yml`)
**Triggers**: PR events (opened, edited, reviewed, merged)
**Actions**:
- Labels PRs based on content
- Warns on large PRs
- Links issues to PRs
- Updates issue status throughout PR lifecycle
- Marks issues as deployed on merge

**No configuration needed** - works automatically!

#### 4. Parallel Agent Workflow (`parallel-agent-workflow.yml`)
**Triggers**: 
- Issue labeled with group labels
- Manual workflow dispatch
**Actions**:
- Runs parallel jobs based on group
- Executes group-specific tasks
- Reports progress

**Configuration**: Add test commands if needed

### Labels Configuration

All labels are defined in `scripts/create-labels.sh`:
- Priority labels (4): critical, high, medium, low
- Type labels (5): bug, enhancement, documentation, testing, fix
- Status labels (4): in-progress, blocked, needs-review, ready-for-testing
- Component labels (30+): workflow-builder, execution-engine, etc.
- Group labels (7): group-a-core through group-g-future
- Assignment labels (4): self-assigned, auto-assign, orchestrator-assigned, help-wanted

Run the script to create all labels:
```bash
./scripts/create-labels.sh
```

### Project Board Configuration

See `.github/PROJECT_BOARD_CONFIG.md` for complete configuration including:
- 12 columns (New, Backlog, To Do, In Progress, In Review, Ready to Merge, Deployed, Done, Feature Requests, Blocked, Critical Bugs, Analytics View)
- 6 custom fields (Priority, Effort, Component, Group, Sprint, Assignee Type)
- 10 views (Board, Priority Matrix, Team, Sprint, Group, Component, Timeline, Table, Feature Voting, Metrics)
- 12 automation rules
- Integration with GitHub Actions

### Wiki Setup

See `docs/WIKI_SETUP.md` for:
- Complete wiki structure
- Page templates
- Content guidelines
- Maintenance schedule

Create these key pages:
1. **Home** - Navigation and overview
2. **Getting Started** - Installation and quick start
3. **User Guide** - How to use features
4. **Developer Guide** - How to contribute
5. **Project Board Guide** - How to use the board
6. **API Reference** - API documentation
7. **Roadmap** - Future plans

### GitHub Copilot Setup

The file `.github/copilot-instructions.md` contains:
- Project-specific coding guidelines
- TypeScript and React patterns
- API and database conventions
- Security best practices
- Testing guidelines
- Git workflow conventions

**No configuration needed** - Copilot will automatically use these instructions when suggesting code!

## Usage Guide

### Creating Issues

#### Bug Report
1. Go to Issues → New Issue
2. Select "🐛 Bug Report"
3. Fill in all required fields:
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Severity (Critical/High/Medium/Low)
   - Component
4. Submit
5. Issue is auto-labeled and added to board

#### Feature Request
1. Go to Issues → New Issue
2. Select "✨ Feature Request"
3. Fill in details:
   - Feature description
   - Problem it solves
   - Proposed solution
   - Use case
   - Priority assessment
4. Submit
5. Community can vote with 👍 reactions
6. High-voted features get prioritized

#### Task
1. Go to Issues → New Issue
2. Select "📋 Task"
3. Choose assignment type:
   - **Self-assigned**: You'll be automatically assigned
   - **Auto-assign**: Orchestrator will assign
   - **Team assignment**: Needs team review
   - **Open for volunteers**: Anyone can pick up
4. Fill in task details and checklist
5. Submit

#### Planned Upgrade
1. Go to Issues → New Issue
2. Select "🚀 Planned Upgrade"
3. Describe the upgrade:
   - What's being upgraded
   - Why it's needed
   - Implementation plan (phases)
   - Testing strategy
   - Rollback plan
4. Submit

#### Fix
1. Go to Issues → New Issue
2. Select "🔧 Fix"
3. Describe what needs fixing (non-critical issues)
4. Submit

### Working on Tasks

#### Self-Assigned Tasks
1. Create task with "Self-assigned" option
2. You're automatically assigned
3. Label `in-progress` is added
4. Task moves to "In Progress" column
5. Create feature branch: `feature/123-task-description`
6. Work on task
7. Open PR when ready

#### Auto-Assigned Tasks
1. Create task with "Auto-assign" option
2. Label `auto-assign` and `awaiting-assignment` added
3. Orchestrator workflow runs hourly
4. Task is assigned based on expertise
5. Label updates to `orchestrator-assigned` and `in-progress`
6. Assigned developer receives notification
7. Work begins

#### Team Assignment
1. Create task with "Team assignment needed"
2. Label `needs-team-assignment` added
3. Team reviews and assigns manually
4. Work begins

#### Volunteer Tasks
1. Create task with "Open for volunteers"
2. Labels `help-wanted` and `good-first-issue` added
3. Anyone can comment to volunteer
4. Maintainer assigns volunteer
5. Work begins

### Pull Request Flow

1. **Create PR**
   - Use PR template
   - Link to issue: "Closes #123"
   - Fill in checklist
   - Submit

2. **Auto-labeling**
   - PR is automatically labeled based on content
   - Size label added (xs/s/m/l/xl)
   - Component labels added
   - Linked issue moves to "In Review"

3. **Review**
   - Mark PR "Ready for Review"
   - Reviewers are notified
   - Reviews are submitted

4. **Approval**
   - PR approved by reviewers
   - All checks pass
   - Label `ready-to-merge` added
   - Issue moves to "Ready to Merge"

5. **Merge**
   - PR merged to main
   - Issue labeled `deployed`
   - Issue moves to "Deployed"
   - Deployment triggers

6. **Verification**
   - Feature verified in production
   - Issue moved to "Done"
   - Issue closed automatically

### Monitoring Progress

#### View by Status (Default Board)
Shows all items grouped by status column

#### View by Priority
See critical items first, sorted by priority

#### View by Team
See what each person is working on

#### View by Component
See work grouped by system component

#### View by Group (Parallel Development)
See work organized for parallel execution

#### Feature Voting View
See community feature requests sorted by votes

#### Metrics Dashboard
See statistics and progress metrics

## Automation Details

### Auto-Labeling
Issues are automatically labeled based on:
- **Keywords in title/body**: "critical", "bug", "feature", "workflow", etc.
- **Component mentions**: Detects which component is affected
- **Priority indicators**: "critical", "high priority", "severity: high"
- **Group mapping**: Maps components to parallel work groups

### Auto-Assignment
Tasks with "Auto-assign" option are assigned based on:
- **Expertise**: Matches component labels to team specializations
- **Workload**: Round-robin within team to balance load
- **Availability**: Only assigns to configured team members

Configure team members in `.github/workflows/orchestrator-assignment.yml`

### PR Automation
- **Size warnings**: Large PRs get warning comment
- **Issue linking**: PRs update linked issue status
- **Ready to merge**: Auto-labeled when approved and checks pass
- **Post-merge**: Updates issue to deployed status

### Project Board Automation
- **New issues**: Auto-add to "New" column
- **Labeled in-progress**: Move to "In Progress"
- **PR opened**: Move to "In Review"
- **PR approved**: Move to "Ready to Merge"
- **PR merged**: Move to "Deployed"
- **Issue closed**: Move to "Done"

## Customization

### Adding Custom Labels
Edit `scripts/create-labels.sh`:
```bash
gh label create "your-label" -d "Description" -c "ff0000" -f
```

### Adding Team Members
Edit `.github/workflows/orchestrator-assignment.yml`:
```yaml
const team = {
  'core-engine': {
    labels: ['group-a-core'],
    members: ['user1', 'user2', 'user3']
  }
};
```

### Adding Custom Fields
In project board settings:
1. Click "Settings"
2. Go to "Custom fields"
3. Click "New field"
4. Choose type and options
5. Save

### Adding Views
In project board:
1. Click "+" next to view tabs
2. Select layout (Board, Table, Roadmap)
3. Configure filters and grouping
4. Save view

## Troubleshooting

### Labels Not Created
```bash
# Check if gh CLI is authenticated
gh auth status

# Login if needed
gh auth login

# Re-run script
./scripts/create-labels.sh
```

### Issues Not Auto-Adding to Board
1. Check that `PROJECT_BOARD_URL` variable is set
2. Verify workflow has permissions
3. Check GitHub Actions logs

### Workflows Not Running
1. Go to Actions tab
2. Check workflow runs for errors
3. Verify workflow file syntax
4. Check that workflows are enabled

### Orchestrator Not Assigning
1. Check that team members are configured
2. Verify usernames are correct
3. Check that `auto-assign` label exists
4. Review workflow logs

## Maintenance

### Daily
- Review new issues in "New" column
- Check blocked items
- Merge approved PRs

### Weekly
- Sprint planning (Backlog → To Do)
- Review feature request votes
- Team sync on in-progress items
- Update metrics

### Monthly
- Archive old done items
- Review and update automation
- Analyze metrics and trends
- Update documentation

## Next Steps

1. ✅ Run `./scripts/create-labels.sh`
2. ✅ Create project board
3. ✅ Set `PROJECT_BOARD_URL` variable
4. ✅ Configure team members in orchestrator workflow
5. ✅ Enable wiki
6. ✅ Create wiki home page
7. ✅ Test with a sample issue
8. ✅ Review metrics after first sprint

## Support

- 📖 Read [PROJECT_BOARD.md](../PROJECT_BOARD.md) for detailed issue list
- 📖 Read [PROJECT_BOARD_SETUP.md](../PROJECT_BOARD_SETUP.md) for original setup
- 📖 Read [README_PROJECT_MANAGEMENT.md](../README_PROJECT_MANAGEMENT.md) for management guide
- 💬 Ask in [Discussions](https://github.com/Universal-Standard/PROJECT-SWARM/discussions)
- 🐛 Report issues with the board system as bugs

## Success Criteria

- ✅ All issue templates working
- ✅ Labels created and organized
- ✅ Project board configured with all columns
- ✅ Automation workflows running
- ✅ Team members configured
- ✅ Wiki pages created
- ✅ First issues created and progressing through board
- ✅ PRs being auto-labeled and linked
- ✅ Metrics tracking progress

---

**Last Updated**: 2025-12-07
**Version**: 2.0
**Maintainer**: PROJECT-SWARM Team
