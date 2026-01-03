# PROJECT-SWARM Wiki Setup Guide

## Overview

This document provides instructions for setting up and maintaining the PROJECT-SWARM wiki to complement the project board system.

## Wiki Structure

### Home
The wiki home page provides an overview and navigation to all sections.

### Sections to Create

#### 1. Getting Started
- **Installation Guide**: Step-by-step setup instructions
- **Quick Start**: 5-minute workflow creation tutorial
- **Configuration**: Environment variables and settings
- **Troubleshooting**: Common issues and solutions

#### 2. User Guide
- **Workflow Builder**: How to create and edit workflows
- **Agent Configuration**: Setting up AI agents
- **Templates**: Using and creating templates
- **Execution**: Running workflows and monitoring
- **Knowledge Base**: Managing workflow knowledge
- **Scheduling**: Setting up automated runs
- **Webhooks**: Configuring external triggers

#### 3. Developer Guide
- **Architecture**: System architecture overview
- **API Reference**: REST API documentation
- **Database Schema**: Database structure and relationships
- **Contributing**: How to contribute to the project
- **Code Style**: Coding standards and conventions
- **Testing**: How to write and run tests
- **Deployment**: Deployment options and procedures

#### 4. Project Management
- **Project Board Guide**: How to use the project board
- **Issue Templates**: Guide to creating issues
- **Labels System**: Understanding and using labels
- **Workflow Automation**: GitHub Actions workflows
- **Task Assignment**: How tasks get assigned
- **Release Process**: How releases are managed

#### 5. Features
- **Feature Overview**: All features at a glance
- **Roadmap**: Planned features and timeline
- **Changelog**: Release notes and updates
- **Feature Requests**: How to request features

#### 6. Integration Guides
- **GitHub Integration**: Connecting to GitHub
- **OpenAI Setup**: Configuring OpenAI
- **Anthropic Setup**: Configuring Claude
- **Google AI Setup**: Configuring Gemini
- **Slack Integration**: (Future)
- **Discord Integration**: (Future)

#### 7. Best Practices
- **Workflow Design Patterns**: Common patterns and anti-patterns
- **Performance Optimization**: Tips for efficient workflows
- **Security Best Practices**: Keeping your workflows secure
- **Cost Optimization**: Minimizing AI API costs
- **Error Handling**: Robust error handling strategies

#### 8. Reference
- **Glossary**: Terms and definitions
- **FAQ**: Frequently asked questions
- **Resources**: External resources and links
- **Support**: How to get help

## Creating Wiki Pages

### Step 1: Enable Wiki
1. Go to repository Settings
2. Scroll to "Features" section
3. Check "Wikis"
4. Click "Save"

### Step 2: Create Home Page
1. Go to Wiki tab
2. Click "Create the first page"
3. Title: "Home"
4. Content:

```markdown
# Welcome to PROJECT-SWARM Wiki

PROJECT-SWARM is an AI workflow orchestration platform that enables you to build, execute, and monitor multi-agent AI workflows with a visual drag-and-drop interface.

## Quick Links

- 🚀 [Getting Started](Getting-Started)
- 📖 [User Guide](User-Guide)
- 💻 [Developer Guide](Developer-Guide)
- 📊 [Project Management](Project-Management)
- ✨ [Features & Roadmap](Features)

## Navigation

### For Users
- [Installation Guide](Installation-Guide)
- [Quick Start Tutorial](Quick-Start)
- [Workflow Builder](Workflow-Builder)
- [Templates Library](Templates)

### For Developers
- [Architecture Overview](Architecture)
- [API Reference](API-Reference)
- [Contributing Guide](Contributing)
- [Database Schema](Database-Schema)

### For Project Management
- [Project Board Guide](Project-Board-Guide)
- [Issue Templates](Issue-Templates)
- [Labels System](Labels-System)
- [Roadmap](Roadmap)

## Support

- 💬 [Discussions](https://github.com/Universal-Standard/PROJECT-SWARM/discussions)
- 🐛 [Report a Bug](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=01-bug-report.yml)
- ✨ [Request a Feature](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=02-feature-request.yml)

## Project Status

- ✅ Visual Workflow Builder
- ✅ Multi-AI Provider Support (OpenAI, Anthropic, Gemini)
- ✅ Workflow Versioning & History
- ✅ Scheduled Executions
- ✅ Cost Tracking & Analytics
- 🚧 Real-time Monitoring (In Progress)
- 🚧 Advanced Templates (In Progress)
- 📋 Knowledge Base Enhancement (Planned)

See [Roadmap](Roadmap) for complete feature list.
```

### Step 3: Create Key Pages

Create the following essential pages:

#### Getting Started
```markdown
# Getting Started

## Prerequisites
- Node.js 22+ installed
- PostgreSQL database (or Neon/Supabase account)
- API keys for AI providers (OpenAI, Anthropic, or Google)

## Installation

### Option 1: Local Development
\`\`\`bash
# Clone repository
git clone https://github.com/Universal-Standard/PROJECT-SWARM.git
cd PROJECT-SWARM

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Setup database
npm run db:push

# Start development server
npm run dev
\`\`\`

### Option 2: Deploy to Cloudflare
See [Cloudflare Deployment Guide](Cloudflare-Deployment)

### Option 3: Deploy to GitHub Pages
See [GitHub Pages Deployment Guide](GitHub-Pages-Deployment)

## Next Steps
1. [Quick Start Tutorial](Quick-Start) - Create your first workflow
2. [Configuration Guide](Configuration) - Configure AI providers
3. [User Guide](User-Guide) - Learn all features
```

#### Project Board Guide
```markdown
# Project Board Guide

## Overview
PROJECT-SWARM uses a comprehensive project board system to track bugs, features, tasks, and planned upgrades.

## Issue Types

### 🐛 Bug Reports
For critical issues that prevent functionality. Use [Bug Report template](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=01-bug-report.yml).

### ✨ Feature Requests
For new features or enhancements. Use [Feature Request template](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=02-feature-request.yml).

### 📋 Tasks
For general development work. Use [Task template](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=03-task.yml).

### 🚀 Planned Upgrades
For major system upgrades. Use [Planned Upgrade template](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=04-planned-upgrade.yml).

### 🔧 Fixes
For non-critical issues. Use [Fix template](https://github.com/Universal-Standard/PROJECT-SWARM/issues/new?template=05-fix.yml).

## Task Assignment

### Self-Assigned
Choose "Self-assigned" in the task template to be automatically assigned.

### Auto-Assigned
Choose "Auto-assign" to let the orchestrator assign the task based on expertise and workload.

### Team Assignment
Choose "Team assignment needed" for tasks requiring specific team review.

### Open for Volunteers
Choose "Open for volunteers" to mark the task as available for community contribution.

## Labels System
See [Labels System](Labels-System) for complete label reference.

## Workflow Automation
Tasks automatically progress through stages:
1. **Backlog** → New issues
2. **To Do** → Prioritized and ready
3. **In Progress** → Being worked on
4. **In Review** → PR submitted
5. **Ready to Merge** → Approved and tested
6. **Deployed** → Merged to main
7. **Done** → Verified in production

## Parallel Development
Tasks are organized into groups for parallel development:
- **Group A**: Core Functionality
- **Group B**: Authentication & Security
- **Group C**: Execution Monitoring
- **Group D**: Knowledge & Templates
- **Group E**: UX Improvements
- **Group F**: Advanced Features
- **Group G**: Future Enhancements
```

## Maintenance

### Regular Updates
- **Weekly**: Update feature status and roadmap
- **Monthly**: Review and update best practices
- **Per Release**: Update changelog and version info

### Wiki Guidelines
1. Keep content concise and scannable
2. Use code blocks for commands and code
3. Include screenshots for UI features
4. Link between related pages
5. Update navigation when adding pages
6. Keep documentation synchronized with code

## Automation

### Auto-sync from Docs
Consider setting up a workflow to sync wiki from docs folder:

```yaml
name: Sync Wiki

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Sync to Wiki
        # Add wiki sync automation
```

## Best Practices

1. **Use Clear Headings**: Hierarchical structure (H1 → H2 → H3)
2. **Link Liberally**: Connect related content
3. **Update Regularly**: Keep wiki current with code
4. **Include Examples**: Show don't tell
5. **Version Information**: Note which version features were added
6. **Search Optimization**: Use keywords users might search for
7. **Mobile Friendly**: Test on mobile devices

## Contributing to Wiki

Anyone can contribute to the wiki:
1. Click "Edit" on any wiki page
2. Make changes using Markdown
3. Preview changes
4. Add edit summary
5. Click "Save page"

For major changes, open an issue first to discuss.

## Wiki Templates

Use these templates for consistency:

### Feature Page Template
```markdown
# Feature Name

## Overview
Brief description of the feature.

## Use Cases
- Use case 1
- Use case 2

## How to Use
Step-by-step instructions.

## Configuration
Configuration options and settings.

## Examples
Practical examples.

## Troubleshooting
Common issues and solutions.

## Related Features
- [Related Feature 1](Link)
- [Related Feature 2](Link)
```

### Tutorial Template
```markdown
# Tutorial: Task Name

## What You'll Learn
- Learning objective 1
- Learning objective 2

## Prerequisites
- Prerequisite 1
- Prerequisite 2

## Steps

### Step 1: Title
Description and instructions.

### Step 2: Title
Description and instructions.

## Next Steps
- [Related Tutorial](Link)
- [Advanced Guide](Link)

## Additional Resources
- [Documentation](Link)
```

## Resources

- [Markdown Guide](https://guides.github.com/features/mastering-markdown/)
- [GitHub Wiki Documentation](https://docs.github.com/en/communities/documenting-your-project-with-wikis)
