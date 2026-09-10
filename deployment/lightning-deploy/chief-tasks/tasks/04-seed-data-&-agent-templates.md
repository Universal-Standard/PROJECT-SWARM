# Task 04: Seed Data & Agent Templates

## Context
- **Priority**: P1 - High
- **Estimated Hours**: 0.5 hours (with Chief AI)
- **Component**: Database / Content
- **Phase**: Phase 1 - Foundation
- **Stream**: Database Stream
- **Dependencies**: Task 03 (migrations)

## Objective
Create comprehensive seed data including 17 agent templates, 4 workflow templates, and default configuration for SWARM's agent marketplace.

## Background
SWARM ships with a pre-built library of AI agents and workflow templates that users can deploy immediately. This task populates the database with production-quality templates.

## Implementation Steps

### Create Complete Agent Template Seed
```typescript
// prisma/seeds/agent-templates.ts
export const AGENT_TEMPLATES = [
  // Development Agents
  { id: 'code-reviewer',    name: 'Code Reviewer',    category: 'Development',
    description: 'Reviews pull requests, suggests improvements, checks for bugs',
    capabilities: ['github', 'code-analysis', 'pr-review'],
    defaultModel: 'claude-sonnet-4-6', aiProvider: 'ANTHROPIC' },
  { id: 'test-generator',   name: 'Test Generator',   category: 'Development',
    description: 'Generates unit tests, integration tests, and E2E tests',
    capabilities: ['code-generation', 'testing'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  { id: 'bug-hunter',       name: 'Bug Hunter',       category: 'Development',
    description: 'Analyzes codebases for bugs, security issues, and anti-patterns',
    capabilities: ['code-analysis', 'security-scanning'],
    defaultModel: 'gemini-1.5-pro', aiProvider: 'GOOGLE' },
  { id: 'doc-writer',       name: 'Documentation Writer', category: 'Development',
    description: 'Generates API docs, README files, and code comments',
    capabilities: ['writing', 'code-analysis'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  // Research Agents
  { id: 'web-researcher',   name: 'Web Researcher',   category: 'Research',
    description: 'Searches, synthesizes, and summarizes web content',
    capabilities: ['web-search', 'summarization'],
    defaultModel: 'gemini-1.5-pro', aiProvider: 'GOOGLE' },
  { id: 'data-analyst',     name: 'Data Analyst',     category: 'Analytics',
    description: 'Analyzes structured data, creates insights and visualizations',
    capabilities: ['data-analysis', 'visualization'],
    defaultModel: 'claude-sonnet-4-6', aiProvider: 'ANTHROPIC' },
  { id: 'report-writer',    name: 'Report Writer',    category: 'Research',
    description: 'Synthesizes research into structured professional reports',
    capabilities: ['writing', 'summarization', 'research'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  // Operations Agents
  { id: 'issue-triager',    name: 'Issue Triager',    category: 'Operations',
    description: 'Triages GitHub issues, assigns labels, estimates complexity',
    capabilities: ['github', 'classification'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  { id: 'pr-merger',        name: 'PR Auto-Merger',   category: 'Operations',
    description: 'Reviews, approves, and merges passing pull requests',
    capabilities: ['github', 'code-review', 'ci-monitoring'],
    defaultModel: 'claude-sonnet-4-6', aiProvider: 'ANTHROPIC' },
  { id: 'deploy-monitor',   name: 'Deploy Monitor',   category: 'Operations',
    description: 'Monitors deployments, detects anomalies, triggers rollbacks',
    capabilities: ['monitoring', 'alerting'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  // Content Agents
  { id: 'content-writer',   name: 'Content Writer',   category: 'Marketing',
    description: 'Creates blog posts, social content, and marketing copy',
    capabilities: ['writing', 'seo'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  { id: 'email-composer',   name: 'Email Composer',   category: 'Marketing',
    description: 'Drafts personalized emails and outreach sequences',
    capabilities: ['writing', 'personalization'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  // Security Agents
  { id: 'sec-scanner',      name: 'Security Scanner', category: 'Security',
    description: 'Scans code and dependencies for vulnerabilities',
    capabilities: ['security-scanning', 'code-analysis'],
    defaultModel: 'claude-sonnet-4-6', aiProvider: 'ANTHROPIC' },
  { id: 'compliance-checker', name: 'Compliance Checker', category: 'Security',
    description: 'Checks code and configs for compliance violations',
    capabilities: ['compliance', 'policy-enforcement'],
    defaultModel: 'gemini-1.5-pro', aiProvider: 'GOOGLE' },
  // Utility Agents
  { id: 'file-organizer',   name: 'File Organizer',   category: 'Utility',
    description: 'Organizes, renames, and categorizes files and directories',
    capabilities: ['file-management'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  { id: 'api-tester',       name: 'API Tester',       category: 'Development',
    description: 'Tests API endpoints, generates Postman collections',
    capabilities: ['api-testing', 'documentation'],
    defaultModel: 'llama-3.1-70b-versatile', aiProvider: 'GROQ' },
  { id: 'orchestrator',     name: 'Master Orchestrator', category: 'System',
    description: 'Coordinates other agents, manages workflow execution',
    capabilities: ['orchestration', 'planning', 'delegation'],
    defaultModel: 'claude-sonnet-4-6', aiProvider: 'ANTHROPIC' },
]
```

## Acceptance Criteria
- [ ] All 17 agent templates seeded
- [ ] All 4 workflow templates seeded
- [ ] Seed is idempotent
- [ ] Templates are queryable by category

## Deliverables
- `prisma/seeds/agent-templates.ts` — 17 agents
- `prisma/seeds/workflow-templates.ts` — 4 workflows
- `prisma/seed.ts` — Master seed runner

## Testing Requirements
- [ ] Seed runs without errors
- [ ] Can query agents by category
- [ ] Template count assertions pass

## Documentation Updates
- Document available templates in `docs/TEMPLATES.md`

## Rollback Plan
1. `prisma migrate reset` to clear all seed data
2. Re-run `npm run db:seed`
