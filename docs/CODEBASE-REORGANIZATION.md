# Codebase Reorganization Plan

**Current State Analysis & Refactoring Roadmap**
**Date:** 2025-12-30

---

## Current Structure Analysis

### Issues Identified

#### 1. **Monolithic routes.ts** (75KB, 2,257 lines)

**Location:** `server/routes.ts`

**Problems:**

- Single file handles 30+ endpoints
- Mixes workflow, execution, agent, auth, template, knowledge routes
- Difficult to test, maintain, and navigate
- No separation of concerns

**Solution:** Split into domain-based route modules

```
server/routes.ts (75KB) →
  packages/github-app/src/api/
    ├── workflows.ts        # Workflow CRUD
    ├── executions.ts       # Execution management
    ├── agents.ts           # Agent configuration
    ├── templates.ts        # Template marketplace
    ├── knowledge.ts        # Knowledge base (→ GitHub Discussions)
    ├── webhooks.ts         # Webhook management
    ├── schedules.ts        # Scheduling
    └── github.ts           # GitHub integration endpoints
```

#### 2. **Inconsistent Module Organization**

**Current:**

```
server/
├── lib/                    # Some business logic
│   ├── cost-tracker.ts
│   ├── scheduler.ts
│   └── webhooks.ts
├── ai/                     # AI-specific logic
│   ├── orchestrator.ts
│   └── executor.ts
├── webhooks.ts             # Duplicate of lib/webhooks.ts?
├── scheduler.ts            # Duplicate of lib/scheduler.ts?
└── storage.ts              # Data access layer
```

**Issue:** Unclear boundaries between `lib/`, root-level, and `ai/` modules.

**Proposed:**

```
packages/github-app/src/
├── services/               # Business logic
│   ├── workflow-executor.ts
│   ├── cost-tracker.ts
│   ├── scheduler.ts
│   └── webhook-manager.ts
├── agents/                 # AI agent logic
│   ├── orchestrator.ts
│   ├── executor.ts
│   └── providers/
├── data/                   # Data access
│   ├── repositories/       # Repository pattern
│   │   ├── workflow-repository.ts
│   │   ├── execution-repository.ts
│   │   └── github-repository.ts
│   └── azure-storage.ts
└── api/                    # HTTP endpoints
    └── (routes as above)
```

#### 3. **Mixed Authentication Systems**

**Current:**

```
server/
├── replitAuth.ts           # Replit-specific auth
├── auth/
│   ├── github-oauth.ts     # GitHub OAuth
│   └── encryption.ts
└── middleware/
    └── github-auth.ts
```

**Issue:** Two auth systems (Replit + GitHub) causing confusion.

**Proposed:** Single GitHub-native auth

```
packages/github-app/src/auth/
├── github-app-auth.ts      # GitHub App authentication
├── installation.ts         # Installation token management
├── oauth.ts                # User OAuth flow
└── middleware/
    ├── require-installation.ts
    └── require-user.ts
```

#### 4. **Storage Abstraction Missing**

**Current:**

```typescript
// Direct database calls everywhere
import { db } from "./db";
import { workflows } from "@shared/schema";

await db.insert(workflows).values(data);
```

**Issue:** Tight coupling to database, difficult to switch storage backends.

**Proposed:** Repository pattern

```typescript
// packages/github-app/src/data/repositories/workflow-repository.ts
export class WorkflowRepository {
  // Abstract storage implementation
  async getByGitHubRepo(owner: string, repo: string): Promise<Workflow[]> {
    // Could query Azure DB or GitHub API
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    // Could save to Azure DB AND commit to GitHub
  }
}
```

#### 5. **Client-Side Structure Issues**

**Current:**

```
client/
├── components/             # Old structure
│   ├── ErrorBoundary.tsx
│   └── __tests__/
└── src/
    ├── components/         # New structure (duplicates)
    │   ├── workflow/
    │   └── execution/
    └── pages/
```

**Issue:** Duplicate component directories, unclear organization.

**Proposed:**

```
packages/web-ui/
├── src/
│   ├── features/           # Feature-based organization
│   │   ├── workflows/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── api.ts
│   │   ├── executions/
│   │   ├── agents/
│   │   └── github/
│   ├── shared/
│   │   ├── components/     # Shared UI components
│   │   └── lib/
│   └── app/
│       ├── layout.tsx
│       └── providers.tsx
```

---

## Detailed File Reorganization

### Phase 1: Create Monorepo Structure

```bash
# Create monorepo with npm workspaces
mkdir -p packages/{github-app,agent-action,web-ui,shared}
```

#### Root package.json

```json
{
  "name": "@project-swarm/monorepo",
  "version": "2.0.0",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  }
}
```

---

### Phase 2: Migrate Server Code

#### File Migration Map

| Current File                       | New Location                                           | Changes                           |
| ---------------------------------- | ------------------------------------------------------ | --------------------------------- |
| `server/routes.ts`                 | Split into 8 files                                     | Break into domain modules         |
| `server/lib/cost-tracker.ts`       | `packages/github-app/src/services/cost-tracker.ts`     | No changes needed ✅              |
| `server/lib/scheduler.ts`          | `packages/github-app/src/services/scheduler.ts`        | Update to use GitHub-native cron  |
| `server/lib/webhooks.ts`           | `packages/github-app/src/services/webhook-manager.ts`  | Integrate with GitHub webhooks    |
| `server/lib/workflow-version.ts`   | `packages/github-app/src/services/workflow-version.ts` | Use GitHub commits/tags           |
| `server/ai/orchestrator.ts`        | `packages/github-app/src/agents/orchestrator.ts`       | Generate GitHub Actions           |
| `server/ai/executor.ts`            | `packages/github-app/src/agents/executor.ts`           | Run in GitHub Actions             |
| `server/storage.ts`                | `packages/github-app/src/data/repositories/*.ts`       | Split by domain                   |
| `server/replitAuth.ts`             | DELETE                                                 | Replace with GitHub App auth      |
| `server/auth/github-oauth.ts`      | `packages/github-app/src/auth/oauth.ts`                | Enhance for GitHub App            |
| `server/middleware/github-auth.ts` | `packages/github-app/src/auth/middleware/*.ts`         | Simplify                          |
| `server/websocket.ts`              | `packages/github-app/src/realtime/websocket.ts`        | Optional: Use GitHub Actions logs |

#### Breaking Down routes.ts

**Current:** Single 75KB file

**New Structure:**

```typescript
// packages/github-app/src/api/workflows.ts
import { Router } from "express";
import { requireInstallation } from "../auth/middleware";
import { WorkflowService } from "../services/workflow-service";

const router = Router();
const workflowService = new WorkflowService();

router.get("/api/workflows", requireInstallation, async (req, res) => {
  const { owner, repo } = req.installation;
  const workflows = await workflowService.listWorkflows(owner, repo);
  res.json(workflows);
});

router.post("/api/workflows", requireInstallation, async (req, res) => {
  const workflow = await workflowService.createWorkflow(req.body);
  res.json(workflow);
});

// ... 5-10 endpoints per file
export default router;
```

```typescript
// packages/github-app/src/api/index.ts
import express from "express";
import workflowsRouter from "./workflows";
import executionsRouter from "./executions";
import agentsRouter from "./agents";
// ... other routers

export function createApiRouter() {
  const router = express.Router();

  router.use(workflowsRouter);
  router.use(executionsRouter);
  router.use(agentsRouter);
  // ... register all routers

  return router;
}
```

---

### Phase 3: Migrate Client Code

#### File Migration Map

| Current File                            | New Location                                                 | Changes                  |
| --------------------------------------- | ------------------------------------------------------------ | ------------------------ |
| `client/src/pages/workflow-builder.tsx` | `packages/web-ui/src/features/workflows/pages/builder.tsx`   | Update to output YAML    |
| `client/src/components/workflow/*.tsx`  | `packages/web-ui/src/features/workflows/components/*.tsx`    | GitHub file integration  |
| `client/src/pages/app-executions.tsx`   | `packages/web-ui/src/features/executions/pages/list.tsx`     | Show GitHub Actions runs |
| `client/src/components/execution/*.tsx` | `packages/web-ui/src/features/executions/components/*.tsx`   | Link to GitHub logs      |
| `client/src/hooks/useAuth.ts`           | `packages/web-ui/src/features/auth/hooks/use-github-auth.ts` | GitHub App OAuth         |
| `client/src/lib/authUtils.ts`           | `packages/web-ui/src/features/auth/lib/auth-utils.ts`        | Update for GitHub        |

#### New GitHub Integration Components

```typescript
// packages/web-ui/src/features/github/components/repo-picker.tsx
export function RepoPicker() {
  const { data: installations } = useGitHubInstallations();
  const { data: repos } = useInstallationRepos(selectedInstallation);

  return (
    <Select>
      {repos?.map(repo => (
        <SelectItem key={repo.id} value={repo.full_name}>
          {repo.full_name}
        </SelectItem>
      ))}
    </Select>
  );
}

// packages/web-ui/src/features/github/components/file-editor.tsx
export function WorkflowFileEditor({ owner, repo, path }: Props) {
  const { data: file } = useGitHubFile(owner, repo, path);
  const { mutate: saveFile } = useSaveGitHubFile();

  return (
    <CodeEditor
      value={file?.content}
      language="yaml"
      onSave={(content) => {
        saveFile({ owner, repo, path, content, message: 'Update workflow' });
      }}
    />
  );
}
```

---

### Phase 4: Create Shared Package

```typescript
// packages/shared/src/types/workflow.ts
export interface SwarmWorkflow {
  name: string;
  version: number;
  description?: string;
  trigger: WorkflowTrigger;
  agents: AgentConfig[];
  flow: FlowStep[];
  outputs: Output[];
}

export interface AgentConfig {
  id: string;
  role: "Coordinator" | "Coder" | "Reviewer" | "Analyst" | "QA";
  provider: "anthropic" | "openai" | "gemini";
  model: string;
  systemPrompt?: string;
  capabilities?: string[];
}

export interface WorkflowTrigger {
  github?: {
    events: string[];
  };
  schedule?: {
    cron: string;
    timezone?: string;
  };
  manual?: boolean;
}

// packages/shared/src/schemas/workflow.ts
import { z } from "zod";

export const swarmWorkflowSchema = z.object({
  name: z.string().min(1),
  version: z.number().int().positive(),
  description: z.string().optional(),
  trigger: z.object({
    github: z
      .object({
        events: z.array(z.string()),
      })
      .optional(),
    schedule: z
      .object({
        cron: z.string(),
        timezone: z.string().optional(),
      })
      .optional(),
    manual: z.boolean().optional(),
  }),
  agents: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["Coordinator", "Coder", "Reviewer", "Analyst", "QA"]),
      provider: z.enum(["anthropic", "openai", "gemini"]),
      model: z.string(),
      systemPrompt: z.string().optional(),
      capabilities: z.array(z.string()).optional(),
    })
  ),
  flow: z.array(
    z.object({
      agent: z.string(),
      inputs: z.record(z.any()),
      outputs: z.string(),
    })
  ),
  outputs: z.array(
    z.object({
      type: z.string(),
      target: z.string(),
      content: z.string(),
    })
  ),
});
```

---

## Naming Convention Standardization

### Package Names

```json
// Before
{
  "name": "rest-express"
}

// After
{
  "name": "@project-swarm/monorepo",
  "workspaces": [
    "packages/github-app",
    "packages/agent-action",
    "packages/web-ui",
    "packages/shared"
  ]
}
```

### Import Paths

```typescript
// Before
import { logger } from "./lib/logger";
import { storage } from "./storage";
import { WorkflowNode } from "./types/workflow";

// After
import { logger } from "@project-swarm/shared/logger";
import { WorkflowRepository } from "@project-swarm/github-app/data";
import { SwarmWorkflow } from "@project-swarm/shared/types";
```

### File Naming Conventions

**Current Issues:**

- Mixed PascalCase and kebab-case: `ErrorBoundary.tsx` vs `app-sidebar.tsx`
- Inconsistent test file naming: `__tests__/` vs `.test.ts`
- No clear pattern for route handlers vs services

**Proposed Standard:**

```
├── ComponentName.tsx           # React components (PascalCase)
├── component-name.test.tsx     # Test files (kebab-case + .test)
├── service-name.ts             # Services (kebab-case)
├── useCustomHook.ts            # Hooks (camelCase starting with 'use')
├── CONSTANTS.ts                # Constants (UPPERCASE)
└── types.ts                    # Type definitions
```

---

## Database Schema Simplification

### Current Schema (17 tables)

```sql
users, workflows, agents, executions, agent_messages, execution_logs,
templates, knowledge_entries, user_settings, assistant_chats,
workflow_versions, workflow_schedules, workflow_webhooks, webhook_logs,
execution_costs, provider_pricing, github_tokens
```

### Proposed Schema (6 tables)

**Why fewer tables?**

- Workflows → stored in GitHub repos as YAML
- Knowledge → moved to GitHub Discussions
- Templates → GitHub template repos
- Schedules → GitHub Actions cron
- Webhooks → GitHub webhooks
- Versions → git commits and tags

**Remaining tables:**

```sql
-- Core execution data (can't be in GitHub)
CREATE TABLE execution_runs (
  id TEXT PRIMARY KEY,
  github_repo TEXT NOT NULL,
  github_run_id BIGINT,
  workflow_path TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  github_sha TEXT,
  github_ref TEXT
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
  installation_id BIGINT NOT NULL,
  access_token_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE provider_pricing (
  -- Keep for cost calculations
);

CREATE TABLE user_settings (
  -- Keep for user preferences
);

CREATE TABLE github_api_cache (
  -- Cache GitHub API responses to reduce rate limits
  cache_key TEXT PRIMARY KEY,
  response JSONB,
  expires_at TIMESTAMPTZ
);
```

**Migration Impact:** 11 tables eliminated, 60% reduction in database complexity.

---

## Reference Cleanup

### Current Import Issues

**Circular Dependencies:**

```typescript
// server/routes.ts imports storage
import { storage } from "./storage";

// server/storage.ts imports from schema
import { workflows } from "@shared/schema";

// @shared/schema imports drizzle
import { pgTable } from "drizzle-orm/pg-core";
```

**Absolute vs Relative Imports:**

```typescript
// Mixed imports in same file
import { logger } from "./lib/logger"; // Relative
import { orchestrator } from "./ai/orchestrator"; // Relative
import type { User } from "@shared/schema"; // Absolute
```

### Proposed Import Standard

**Use Absolute Imports Everywhere:**

```typescript
// packages/github-app/tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/services/*": ["services/*"],
      "@/data/*": ["data/*"],
      "@/agents/*": ["agents/*"],
      "@/api/*": ["api/*"],
      "@/auth/*": ["auth/*"]
    }
  }
}

// Usage
import { logger } from '@project-swarm/shared/logger';
import { WorkflowService } from '@/services/workflow-service';
import { requireInstallation } from '@/auth/middleware';
```

---

## Content References Between Files

### Current GitHub Integration Files

**server/github.ts** (2.3KB)

```typescript
import { Octokit } from "@octokit/rest";

export async function getGitHubClient(token: string) {
  return new Octokit({ auth: token });
}
```

**Issue:** Too generic, not leveraging GitHub App features.

**Proposed:**

```typescript
// packages/github-app/src/github/client.ts
import { App } from "@octokit/app";
import { Octokit } from "@octokit/rest";

export class GitHubClientFactory {
  private app: App;

  constructor() {
    this.app = new App({
      appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_APP_PRIVATE_KEY!,
    });
  }

  async getInstallationClient(installationId: number): Promise<Octokit> {
    return this.app.getInstallationOctokit(installationId);
  }

  async getUserClient(userId: string): Promise<Octokit> {
    // Get user's OAuth token from database
    const token = await this.getUserToken(userId);
    return new Octokit({ auth: token });
  }
}

// packages/github-app/src/github/graphql.ts
export class GitHubGraphQLClient {
  async queryWorkflowFiles(owner: string, repo: string) {
    return this.client.graphql(
      `
      query GetSwarmWorkflows($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: "HEAD:.swarm/workflows/") {
            ... on Tree {
              entries {
                name
                type
                object {
                  ... on Blob {
                    text
                  }
                }
              }
            }
          }
        }
      }
    `,
      { owner, repo }
    );
  }

  async createDiscussionEntry(repoId: string, title: string, body: string) {
    return this.client.graphql(
      `
      mutation CreateKnowledge($repoId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
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
    `,
      { repoId, categoryId: await this.getKnowledgeCategoryId(), title, body }
    );
  }
}
```

---

## Action Items

### Immediate (This Week)

1. **Create monorepo structure**

   ```bash
   mkdir -p packages/{github-app,agent-action,web-ui,shared}/{src,tests}
   npm init -w packages/github-app
   npm init -w packages/agent-action
   npm init -w packages/web-ui
   npm init -w packages/shared
   ```

2. **Set up GitHub App**
   - Create app at https://github.com/settings/apps/new
   - Configure webhooks, permissions
   - Generate private key
   - Save app ID and credentials to Azure Key Vault

3. **Provision Azure Resources**
   - Create Azure resource group
   - Set up PostgreSQL database
   - Configure Key Vault
   - Set up monitoring

### Short-term (Next 2 Weeks)

4. **Migrate core services**
   - Move `server/lib/*` to `packages/github-app/src/services/`
   - Split `server/routes.ts` into domain modules
   - Create repository abstractions

5. **Build GitHub integration layer**
   - Implement `GitHubClientFactory`
   - Create `GitHubGraphQLClient`
   - Build webhook handlers

6. **Create .swarm/ spec**
   - Define YAML schema
   - Build parser and validator
   - Create example workflows

### Medium-term (Next Month)

7. **Migrate frontend**
   - Set up feature-based structure
   - Build GitHub integration components
   - Update workflow builder to output YAML

8. **Data migration**
   - Export existing workflows to YAML
   - Migrate knowledge to Discussions
   - Archive old data

9. **Testing**
   - Update all tests for new structure
   - Add integration tests with GitHub API
   - E2E tests with real GitHub repos

---

## Summary

**Files to Delete:** 3

- server/replitAuth.ts
- server/webhooks.ts (duplicate)
- server/scheduler.ts (duplicate)

**Files to Split:** 1

- server/routes.ts → 8 domain modules

**Files to Move:** 30+

- All server/\* → packages/github-app/src/
- All client/src/\* → packages/web-ui/src/

**New Files to Create:** 20+

- GitHub App webhook handlers
- GitHub GraphQL client
- Repository abstractions
- Azure integration layer

**Total Effort:** ~4-6 weeks for complete reorganization
