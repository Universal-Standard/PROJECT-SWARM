# GitHub-Centric Architecture Redesign

**PROJECT-SWARM: Multi-Agent AI Workflow Automation**
**Architecture Version:** 2.0 (GitHub-Native)
**Date:** 2025-12-30
**Status:** Design Proposal

---

## Executive Summary

This document outlines a comprehensive architectural redesign of PROJECT-SWARM to be **GitHub-centric**, using GitHub's services as the foundational infrastructure with Azure for external resources.

### Current Issues Identified

1. **Authentication**: Using Replit Auth (not GitHub-native)
2. **Database**: Using Neon PostgreSQL (not GitHub-integrated)
3. **Storage**: No clear file storage strategy
4. **Workflows**: Custom execution engine (not leveraging GitHub Actions)
5. **Version Control**: Using git but not GitHub-native features
6. **Deployment**: Generic Docker (not GitHub Packages/Container Registry)
7. **Secrets**: Local environment variables (not GitHub Secrets/Azure Key Vault)
8. **CI/CD**: GitHub Actions exists but underutilized

### Proposed GitHub-Native Stack

| Component              | Current               | Proposed GitHub-Centric             | Azure Fallback                |
| ---------------------- | --------------------- | ----------------------------------- | ----------------------------- |
| **Authentication**     | Replit Auth           | GitHub App + OAuth                  | Azure AD B2C                  |
| **Database**           | Neon PostgreSQL       | GitHub Discussions API (metadata)   | Azure Database for PostgreSQL |
| **File Storage**       | None                  | GitHub Repositories                 | Azure Blob Storage            |
| **Workflows**          | Custom Express API    | GitHub Actions Workflows            | Azure Functions               |
| **Version Control**    | Git                   | GitHub API + GraphQL                | N/A                           |
| **Container Registry** | Docker Hub            | GitHub Container Registry (ghcr.io) | Azure Container Registry      |
| **Secrets**            | .env files            | GitHub Secrets + Vault              | Azure Key Vault               |
| **Static Hosting**     | None                  | GitHub Pages                        | Azure Static Web Apps         |
| **Package Management** | npm registry          | GitHub Packages                     | Azure Artifacts               |
| **Knowledge Base**     | PostgreSQL            | GitHub Wiki + Discussions           | Azure Cognitive Search        |
| **Webhooks**           | Custom implementation | GitHub Webhooks                     | Azure Event Grid              |
| **API**                | Express.js            | GitHub GraphQL API                  | Azure API Management          |
| **Monitoring**         | None                  | GitHub Insights + Actions logs      | Azure Monitor                 |

---

## Detailed Architecture Design

### 1. GitHub App Architecture

**Transform PROJECT-SWARM into a GitHub App** that users install on their repositories.

#### GitHub App Features

- **Repository Access**: Read/write to user repos for workflow storage
- **Checks API**: Report workflow execution status as GitHub Checks
- **Deployments API**: Track workflow deployments
- **Issues/Projects**: Task management integration
- **Discussions**: Knowledge base and Q&A
- **Actions**: Execute multi-agent workflows as GitHub Actions

#### App Manifest Structure

```yaml
name: PROJECT-SWARM
description: Multi-Agent AI Workflow Automation
permissions:
  actions: write
  checks: write
  contents: write
  deployments: write
  discussions: write
  issues: write
  metadata: read
  pull_requests: write
  workflows: write
```

---

### 2. Workflow Storage Strategy

**Store workflows as YAML files in GitHub repositories** instead of database JSON.

#### Current Structure (Database)

```typescript
// workflows table
{
  id: string,
  name: string,
  nodes: JSON,
  edges: JSON,
  // ...stored in PostgreSQL
}
```

#### Proposed Structure (GitHub-Native)

```
.swarm/
├── workflows/
│   ├── my-workflow.yml          # Workflow definition
│   ├── code-review-swarm.yml    # Another workflow
│   └── repo-analyzer.yml
├── agents/
│   ├── coordinator.yml          # Agent configurations
│   ├── coder.yml
│   └── reviewer.yml
├── config.yml                   # Global SWARM config
└── knowledge/                   # Knowledge base entries
    ├── patterns.md
    └── best-practices.md
```

#### Workflow YAML Format

```yaml
# .swarm/workflows/code-review.yml
name: Code Review Swarm
version: 1
description: Multi-agent code review workflow

trigger:
  github:
    events:
      - pull_request.opened
      - pull_request.synchronize
  schedule:
    cron: "0 9 * * 1" # Weekly on Monday

agents:
  - id: coordinator
    role: Coordinator
    provider: anthropic
    model: claude-3-5-sonnet-20241022
    systemPrompt: |
      You coordinate the code review process...

  - id: security-analyst
    role: Analyst
    provider: openai
    model: gpt-4
    capabilities:
      - security-scan
      - vulnerability-detection

  - id: code-reviewer
    role: Reviewer
    provider: gemini
    model: gemini-1.5-pro

flow:
  - agent: coordinator
    inputs:
      pullRequest: ${{ github.event.pull_request }}
    outputs: review_plan

  - agent: security-analyst
    inputs:
      files: ${{ steps.coordinator.outputs.files }}
    outputs: security_report

  - agent: code-reviewer
    inputs:
      files: ${{ steps.coordinator.outputs.files }}
      security: ${{ steps.security-analyst.outputs.security_report }}
    outputs: code_review

outputs:
  - type: github_comment
    target: pull_request
    content: ${{ steps.code-reviewer.outputs.code_review }}
  - type: github_check
    name: SWARM Code Review
    status: ${{ steps.code-reviewer.outputs.status }}
```

---

### 3. GitHub Actions Integration

**Execute workflows using GitHub Actions** as the runtime engine.

#### Workflow Execution Flow

1. User triggers workflow (PR, schedule, manual)
2. GitHub webhook → SWARM API (Azure Function)
3. SWARM API reads `.swarm/workflows/[name].yml` from repo
4. SWARM generates GitHub Actions workflow dynamically
5. GitHub Actions executes multi-agent workflow
6. Results posted back to GitHub (comments, checks, deployments)

#### Generated GitHub Actions Workflow

```yaml
# Dynamically generated by SWARM
name: SWARM - Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  swarm-coordinator:
    runs-on: ubuntu-latest
    outputs:
      review_plan: ${{ steps.run.outputs.review_plan }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Coordinator Agent
        id: run
        uses: project-swarm/agent-action@v1
        with:
          agent-config: .swarm/agents/coordinator.yml
          provider: anthropic
          model: claude-3-5-sonnet-20241022
          inputs: ${{ toJson(github.event.pull_request) }}

  swarm-security-analyst:
    needs: swarm-coordinator
    runs-on: ubuntu-latest
    outputs:
      security_report: ${{ steps.run.outputs.report }}
    steps:
      - uses: actions/checkout@v4
      - name: Run Security Analyst
        id: run
        uses: project-swarm/agent-action@v1
        with:
          agent-config: .swarm/agents/security-analyst.yml
          inputs: ${{ needs.swarm-coordinator.outputs.review_plan }}
```

---

### 4. Data Storage Architecture

**Hybrid approach**: GitHub for workflow data, Azure for runtime data.

#### Storage Mapping

| Data Type            | Storage Location                 | Rationale                            |
| -------------------- | -------------------------------- | ------------------------------------ |
| Workflow Definitions | GitHub Repos (`.swarm/`)         | Version controlled, collaborative    |
| Agent Configurations | GitHub Repos (`.swarm/agents/`)  | Shareable, reusable                  |
| Execution History    | Azure Database for PostgreSQL    | High-volume, complex queries         |
| Execution Logs       | GitHub Actions Logs + Azure      | GitHub for recent, Azure for archive |
| Knowledge Base       | GitHub Discussions + Wiki        | Community-driven, searchable         |
| Secrets/API Keys     | GitHub Secrets + Azure Key Vault | Secure, environment-specific         |
| Cost Tracking        | Azure Database                   | Analytics, reporting                 |
| Templates            | GitHub Template Repos            | Easily forkable                      |

#### Database Schema (Azure PostgreSQL)

```sql
-- Core tables (reduced from current 17 tables)
CREATE TABLE execution_runs (
  id TEXT PRIMARY KEY,
  github_repo TEXT NOT NULL,      -- owner/repo
  github_run_id BIGINT,            -- GitHub Actions run ID
  workflow_path TEXT NOT NULL,     -- .swarm/workflows/name.yml
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  github_sha TEXT,                 -- commit SHA
  github_ref TEXT                  -- branch/tag
);

CREATE TABLE execution_costs (
  id TEXT PRIMARY KEY,
  execution_id TEXT REFERENCES execution_runs(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INT,
  output_tokens INT,
  estimated_cost DECIMAL(10,4)
);

CREATE TABLE user_github_installations (
  user_id TEXT PRIMARY KEY,
  github_user_id BIGINT NOT NULL,
  installation_id BIGINT NOT NULL,  -- GitHub App installation ID
  access_token_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 5. Authentication & Authorization

**GitHub App installation-based authentication**.

#### Authentication Flow

1. User installs SWARM GitHub App on their account/org
2. GitHub redirects to SWARM with `installation_id`
3. SWARM exchanges for installation access token
4. Store encrypted token in Azure Key Vault
5. Use GitHub GraphQL API for all operations

#### Implementation

```typescript
// server/auth/github-app.ts
import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";

export class GitHubAppAuth {
  private app: App;

  constructor() {
    this.app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
    });
  }

  async getInstallationOctokit(installationId: number): Promise<Octokit> {
    const octokit = await this.app.getInstallationOctokit(installationId);
    return octokit;
  }

  async getUserRepos(installationId: number) {
    const octokit = await this.getInstallationOctokit(installationId);
    return octokit.apps.listReposAccessibleToInstallation();
  }
}
```

---

### 6. GitHub GraphQL API Usage

**Replace REST API calls with GraphQL** for better performance.

#### Current (REST)

```typescript
// Multiple API calls
const repos = await octokit.repos.listForAuthenticatedUser();
const issues = await octokit.issues.listForRepo({ owner, repo });
const prs = await octokit.pulls.list({ owner, repo });
```

#### Proposed (GraphQL)

```typescript
// Single query
const { data } = await octokit.graphql(
  `
  query GetRepoData($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      name
      description
      issues(first: 10, states: OPEN) {
        nodes {
          title
          number
          author { login }
        }
      }
      pullRequests(first: 10, states: OPEN) {
        nodes {
          title
          number
          commits(first: 1) {
            nodes {
              commit {
                message
                additions
                deletions
              }
            }
          }
        }
      }
      discussions(first: 10) {
        nodes {
          title
          body
        }
      }
    }
  }
`,
  { owner, repo }
);
```

---

### 7. Knowledge Base → GitHub Discussions

**Replace PostgreSQL knowledge_entries with GitHub Discussions**.

#### Current Structure

```sql
CREATE TABLE knowledge_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  key TEXT,
  content TEXT,
  metadata JSONB,
  source_execution_id TEXT
);
```

#### Proposed Structure

```typescript
// Use GitHub Discussions API
interface KnowledgeEntry {
  discussionId: string;        // GitHub Discussion ID
  category: string;            // "Patterns", "Best Practices", etc.
  title: string;
  body: string;                // Markdown content
  labels: string[];
  sourceWorkflow?: string;     // Which workflow created this
  sourceCommit?: string;       // Which commit/execution
}

// Store in GitHub Discussions with custom labels
async createKnowledgeEntry(entry: KnowledgeEntry) {
  const { data } = await octokit.graphql(`
    mutation CreateDiscussion($repoId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
      createDiscussion(input: {
        repositoryId: $repoId
        categoryId: $categoryId
        title: $title
        body: $body
      }) {
        discussion {
          id
          url
        }
      }
    }
  `, {
    repoId: await this.getRepoId(owner, repo),
    categoryId: await this.getCategoryId('Knowledge Base'),
    title: entry.title,
    body: `${entry.body}\n\n---\n*Generated by: ${entry.sourceWorkflow || 'Manual'}*`
  });

  // Add labels
  await this.addLabels(data.createDiscussion.discussion.id, entry.labels);
}
```

---

### 8. Container & Deployment Strategy

**Use GitHub Container Registry and GitHub Pages**.

#### Container Registry

```yaml
# .github/workflows/build-and-publish.yml
name: Build and Publish

on:
  push:
    branches: [main]
    tags: ["v*"]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - uses: actions/checkout@v4

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
```

#### Deployment (Azure)

```yaml
# .github/workflows/deploy-azure.yml
name: Deploy to Azure

on:
  workflow_run:
    workflows: ["Build and Publish"]
    types: [completed]
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Azure Login
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy Container to Azure
        uses: azure/webapps-deploy@v2
        with:
          app-name: project-swarm-api
          images: ghcr.io/${{ github.repository }}:latest
```

---

### 9. Secrets Management

**Use GitHub Secrets for CI/CD, Azure Key Vault for runtime**.

#### GitHub Secrets (Actions)

- `AZURE_CREDENTIALS` - Azure service principal
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - OpenAI API key
- `GITHUB_APP_PRIVATE_KEY` - App authentication

#### Azure Key Vault (Runtime)

```typescript
// server/config/secrets.ts
import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

export class SecretsManager {
  private client: SecretClient;

  constructor() {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL!;
    this.client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  }

  async getSecret(name: string): Promise<string> {
    const secret = await this.client.getSecret(name);
    return secret.value!;
  }

  async getApiKeys() {
    return {
      anthropic: await this.getSecret("anthropic-api-key"),
      openai: await this.getSecret("openai-api-key"),
      gemini: await this.getSecret("gemini-api-key"),
    };
  }
}
```

---

### 10. Proposed File Structure

**Reorganize codebase to reflect GitHub-centric architecture**.

```
PROJECT-SWARM/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                        # Test & build
│   │   ├── publish-container.yml         # Push to ghcr.io
│   │   ├── deploy-azure.yml              # Deploy to Azure
│   │   └── release.yml                   # GitHub Releases
│   ├── ISSUE_TEMPLATE/
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── dependabot.yml
│
├── .swarm/                                # Example SWARM configuration
│   ├── workflows/
│   │   ├── code-review.yml
│   │   └── repo-analyzer.yml
│   ├── agents/
│   │   ├── coordinator.yml
│   │   └── coder.yml
│   └── config.yml
│
├── packages/
│   ├── github-app/                       # GitHub App server
│   │   ├── src/
│   │   │   ├── app.ts                   # App configuration
│   │   │   ├── webhooks/                # GitHub webhook handlers
│   │   │   ├── api/                     # REST API endpoints
│   │   │   └── services/
│   │   │       ├── workflow-executor.ts # Execute .swarm workflows
│   │   │       ├── github-api.ts        # GitHub GraphQL wrapper
│   │   │       └── azure-storage.ts     # Azure integration
│   │   └── package.json
│   │
│   ├── agent-action/                     # GitHub Actions for agents
│   │   ├── action.yml                   # Action definition
│   │   ├── src/
│   │   │   ├── main.ts                  # Action entrypoint
│   │   │   └── agents/                  # Agent runners
│   │   └── package.json
│   │
│   ├── web-ui/                           # Frontend (GitHub Pages)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   └── lib/github-client.ts     # GitHub API client
│   │   └── package.json
│   │
│   └── shared/                           # Shared types & schemas
│       ├── src/
│       │   ├── types/
│       │   ├── schemas/                 # Workflow YAML schemas
│       │   └── github/                  # GitHub API types
│       └── package.json
│
├── infrastructure/                        # Infrastructure as Code
│   ├── azure/
│   │   ├── main.bicep                   # Azure resources
│   │   ├── database.bicep               # PostgreSQL
│   │   └── keyvault.bicep               # Key Vault
│   └── terraform/                        # Alternative to Bicep
│
├── docs/
│   ├── GITHUB-APP-SETUP.md
│   ├── AZURE-SETUP.md
│   ├── WORKFLOW-YAML-SPEC.md
│   └── ARCHITECTURE.md
│
├── migrations/                            # Database migrations
│   └── azure-postgres/
│
├── scripts/
│   ├── setup-github-app.ts              # Setup wizard
│   └── migrate-from-v1.ts               # Migration from current
│
└── package.json                          # Root workspace
```

---

## Implementation Phases

### Phase 1: GitHub App Foundation (Weeks 1-2)

- [ ] Create GitHub App
- [ ] Set up authentication flow
- [ ] Implement basic webhook handlers
- [ ] Create `.swarm/` configuration format
- [ ] Build YAML parser for workflow definitions

### Phase 2: Azure Infrastructure (Weeks 2-3)

- [ ] Provision Azure Database for PostgreSQL
- [ ] Set up Azure Key Vault
- [ ] Configure Azure Container Registry (fallback)
- [ ] Deploy Azure Functions for API
- [ ] Set up monitoring with Azure Monitor

### Phase 3: Workflow Engine (Weeks 3-5)

- [ ] Build workflow YAML → GitHub Actions generator
- [ ] Implement agent execution in GitHub Actions
- [ ] Create reusable GitHub Actions for agents
- [ ] Build orchestrator for multi-agent flows
- [ ] Implement GitHub Checks integration

### Phase 4: Data Migration (Week 5-6)

- [ ] Migrate workflows to `.swarm/` YAML files
- [ ] Migrate knowledge base to GitHub Discussions
- [ ] Migrate execution history to Azure PostgreSQL
- [ ] Update all API endpoints
- [ ] Test data integrity

### Phase 5: Frontend Rebuild (Weeks 6-7)

- [ ] Rebuild UI for GitHub-native experience
- [ ] Replace workflow builder to output YAML
- [ ] Integrate GitHub file picker
- [ ] Add Discussions integration
- [ ] Deploy to GitHub Pages

### Phase 6: Testing & Polish (Week 8)

- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Documentation
- [ ] Security audit
- [ ] Beta release

---

## Azure Resources Needed

### Required Azure Services

1. **Azure Database for PostgreSQL**
   - Flexible Server
   - Tier: General Purpose (2 vCores, 8GB RAM)
   - Storage: 128 GB
   - Cost: ~$200/month

2. **Azure Key Vault**
   - Standard tier
   - For API keys and secrets
   - Cost: ~$5/month

3. **Azure Blob Storage** (optional, for large files)
   - Standard tier
   - Hot access tier
   - Cost: ~$20/month for 100GB

4. **Azure Functions** (optional, for serverless API)
   - Consumption plan
   - Node.js runtime
   - Cost: ~$10/month

5. **Azure Monitor**
   - Application Insights
   - Log Analytics
   - Cost: ~$30/month

**Total Estimated Cost: ~$265/month**

### Setup Required

```bash
# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Login
az login

# Create resource group
az group create \
  --name project-swarm-rg \
  --location eastus

# Create PostgreSQL
az postgres flexible-server create \
  --resource-group project-swarm-rg \
  --name project-swarm-db \
  --location eastus \
  --admin-user swarmadmin \
  --admin-password <secure-password> \
  --sku-name Standard_B2s \
  --tier Burstable \
  --storage-size 128 \
  --version 16

# Create Key Vault
az keyvault create \
  --name project-swarm-vault \
  --resource-group project-swarm-rg \
  --location eastus
```

---

## Migration Strategy

### 1. Backward Compatibility

**Run both systems in parallel** during migration.

```typescript
// Dual-mode workflow execution
async function executeWorkflow(workflowId: string) {
  const workflow = await storage.getWorkflow(workflowId);

  // Check if workflow has been migrated to .swarm/
  if (workflow.githubRepo && workflow.swarmConfigPath) {
    // Use GitHub-native execution
    return executeGitHubWorkflow(workflow);
  } else {
    // Use legacy execution
    return executeLegacyWorkflow(workflow);
  }
}
```

### 2. Gradual Migration

- **Month 1**: Deploy GitHub App alongside existing system
- **Month 2**: Migrate 20% of workflows
- **Month 3**: Migrate 50% of workflows
- **Month 4**: Migrate 80% of workflows
- **Month 5**: Deprecate legacy system
- **Month 6**: Full cutover

---

## Benefits of GitHub-Centric Architecture

### 1. **Native Integration**

- Workflows live in repos where code lives
- Version controlled with repository
- Pull request-based workflow updates
- No separate system to manage

### 2. **Collaboration**

- GitHub Issues for task tracking
- GitHub Discussions for knowledge sharing
- Pull requests for workflow review
- Team permissions via GitHub

### 3. **Reliability**

- GitHub's 99.9% uptime SLA
- Automatic backups
- Disaster recovery
- Geo-distributed

### 4. **Cost Efficiency**

- No separate database for workflows
- Free GitHub Actions minutes (2000/month)
- Free GitHub Container Registry
- Pay only for Azure runtime

### 5. **Developer Experience**

- Familiar GitHub UI
- Standard git workflow
- YAML configuration (industry standard)
- GitHub Copilot integration

### 6. **Security**

- GitHub's security scanning
- Dependabot for dependencies
- Secret scanning
- Azure Key Vault for sensitive data

---

## Naming Convention Fixes

### Current Issues

- Mixed naming: `rest-express` (package name) vs `PROJECT-SWARM`
- `server/routes.ts` (75KB monolith)
- Inconsistent `lib/` vs root-level files
- Missing `github-` prefix on GitHub-specific modules

### Proposed Naming

```
package.json → name: "@project-swarm/monorepo"
packages/github-app → @project-swarm/github-app
packages/agent-action → @project-swarm/agent-action
packages/web-ui → @project-swarm/web-ui
packages/shared → @project-swarm/shared

server/routes.ts → split into:
  - packages/github-app/src/api/workflows.ts
  - packages/github-app/src/api/executions.ts
  - packages/github-app/src/api/agents.ts
```

---

## Questions for User

1. **Azure Subscription**: Do you have an Azure subscription? Need to set one up?
2. **GitHub App**: Should I create the GitHub App now or in the implementation phase?
3. **Migration Timeline**: Prefer aggressive (2 months) or conservative (6 months) migration?
4. **Feature Priority**: Which features are most critical to preserve during migration?
5. **Budget**: Is ~$265/month Azure cost acceptable? Need optimization?

---

## Next Steps

Once approved, I can:

1. **Create GitHub App** - Set up app with required permissions
2. **Provision Azure Resources** - Database, Key Vault, etc.
3. **Build POC** - Simple workflow execution via GitHub Actions
4. **Update Codebase Structure** - Reorganize into monorepo
5. **Migrate First Workflow** - Convert one workflow to YAML
6. **Document Setup** - Complete setup guide

---

## Conclusion

This GitHub-centric architecture transforms PROJECT-SWARM from a standalone SaaS application into a **native GitHub ecosystem tool** that leverages:

- **GitHub** for version control, collaboration, execution, and storage
- **Azure** for heavy-duty database, secrets, and compute
- **Industry standards** (YAML, GraphQL, Actions) for familiarity

The result is a more **maintainable**, **scalable**, and **cost-effective** solution that integrates seamlessly with developers' existing workflows.
