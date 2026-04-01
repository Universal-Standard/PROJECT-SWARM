# GitHub-Only Architecture (Zero External Dependencies)

**PROJECT-SWARM: 100% GitHub-Native Multi-Agent AI Platform**
**Date:** 2025-12-30
**Philosophy:** Use GitHub infrastructure creatively to eliminate ALL external dependencies

---

## Executive Summary

**Goal:** Run PROJECT-SWARM entirely on GitHub's infrastructure with ZERO external services (no Azure, no Neon, no AWS).

**Cost:** $0/month (GitHub Free tier) or ~$4/month (GitHub Pro if needed)

**Key Innovation:** Use GitHub Actions as both compute AND API layer, with repository files as database.

---

## Complete Architecture

### Infrastructure Mapping

| Component            | Traditional Approach           | GitHub-Native Solution                 | Cost               |
| -------------------- | ------------------------------ | -------------------------------------- | ------------------ |
| **Database**         | PostgreSQL (Azure/Neon)        | Repository JSON files + SQLite in repo | Free               |
| **API Server**       | Express.js (Azure App Service) | GitHub Actions (workflow_dispatch)     | Free (2000 min/mo) |
| **Frontend**         | Vercel/Netlify                 | GitHub Pages                           | Free               |
| **Auth**             | Custom OAuth                   | GitHub OAuth                           | Free               |
| **Execution Engine** | Custom orchestrator            | GitHub Actions workflows               | Free (2000 min/mo) |
| **Logs**             | Azure Monitor                  | GitHub Actions logs                    | Free               |
| **Secrets**          | Azure Key Vault                | GitHub Secrets                         | Free               |
| **Containers**       | Azure Registry                 | GitHub Container Registry              | Free (public)      |
| **Knowledge Base**   | PostgreSQL                     | GitHub Discussions                     | Free               |
| **File Storage**     | Azure Blob                     | GitHub Releases + Git LFS              | Free (1GB LFS)     |
| **Webhooks**         | Custom server                  | GitHub webhooks → Actions              | Free               |
| **CI/CD**            | Azure Pipelines                | GitHub Actions                         | Free               |

**Total Monthly Cost: $0** 🎉

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│            GitHub Free Tier (Everything)            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐      ┌──────────────┐           │
│  │ GitHub Pages │◄─────┤  React App   │           │
│  │  (Frontend)  │      │   (Web UI)   │           │
│  └──────┬───────┘      └──────────────┘           │
│         │                                           │
│         │ GitHub OAuth                              │
│         ▼                                           │
│  ┌──────────────────────────────────────┐          │
│  │   GitHub Actions (API Layer)         │          │
│  │  • workflow_dispatch = API endpoint  │          │
│  │  • Reads/writes repo files           │          │
│  │  • Triggers workflow executions       │          │
│  └──────┬───────────────────────────────┘          │
│         │                                           │
│         ▼                                           │
│  ┌──────────────────────────────────────┐          │
│  │   Data Repository (Database)         │          │
│  │   .swarm-data/                       │          │
│  │   ├── executions/                    │          │
│  │   │   └── 2025-01-12-exec-123.json  │          │
│  │   ├── costs/                         │          │
│  │   │   └── 2025-01.json              │          │
│  │   └── swarm.db (SQLite)             │          │
│  └──────┬───────────────────────────────┘          │
│         │                                           │
│         ▼                                           │
│  ┌──────────────────────────────────────┐          │
│  │   User Repositories (.swarm/)        │          │
│  │   ├── workflows/code-review.yml      │          │
│  │   ├── agents/coordinator.yml         │          │
│  │   └── config.yml                     │          │
│  └──────────────────────────────────────┘          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 1. Database Strategy (GitHub as Database)

### Option A: Repository-Based SQLite (RECOMMENDED)

**Store a SQLite database file in the repository:**

```
PROJECT-SWARM-data/
├── swarm.db                    # SQLite database (< 2GB)
├── swarm.db.backup             # Backup copy
└── .github/
    └── workflows/
        ├── db-query.yml        # API endpoint for queries
        └── db-write.yml        # API endpoint for writes
```

**Advantages:**

- Real SQL queries (no scanning files)
- ACID transactions
- Indexes for fast queries
- Standard database tools
- Version controlled (every commit = backup)

**Limitations:**

- 2GB max file size (plenty for execution metadata)
- Concurrent writes need coordination (use GitHub Actions job queues)
- Git history grows (mitigate with Git LFS)

**Schema (Minimal):**

```sql
-- Store only metadata, not full execution logs
CREATE TABLE execution_runs (
  id TEXT PRIMARY KEY,
  github_repo TEXT NOT NULL,
  github_run_id BIGINT NOT NULL,    -- Link to actual GitHub Actions run
  workflow_path TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  cost_cents INTEGER DEFAULT 0
);

CREATE TABLE execution_costs (
  id TEXT PRIMARY KEY,
  execution_id TEXT REFERENCES execution_runs(id),
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_cents INTEGER NOT NULL
);

-- User installations (OAuth tokens stored in GitHub Secrets)
CREATE TABLE user_github_installations (
  github_user_id INTEGER PRIMARY KEY,
  username TEXT NOT NULL,
  installed_at INTEGER NOT NULL
);

-- Everything else stored in GitHub directly:
-- - Workflows: .swarm/ in user repos
-- - Knowledge: GitHub Discussions
-- - Logs: GitHub Actions logs
-- - Versions: git commits/tags
```

**Database Operations via GitHub Actions:**

```yaml
# .github/workflows/db-query.yml
name: Database Query API

on:
  workflow_dispatch:
    inputs:
      query_type:
        description: "Query type"
        required: true
        type: choice
        options:
          - list_executions
          - get_execution
          - get_costs
      params:
        description: "Query parameters (JSON)"
        required: false
        type: string

jobs:
  query:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Query SQLite Database
        id: query
        run: |
          # Install sqlite3
          sudo apt-get update && sudo apt-get install -y sqlite3

          # Execute query based on type
          case "${{ inputs.query_type }}" in
            list_executions)
              sqlite3 swarm.db "SELECT * FROM execution_runs ORDER BY started_at DESC LIMIT 50" -json > result.json
              ;;
            get_execution)
              EXEC_ID=$(echo '${{ inputs.params }}' | jq -r '.execution_id')
              sqlite3 swarm.db "SELECT * FROM execution_runs WHERE id='$EXEC_ID'" -json > result.json
              ;;
            get_costs)
              sqlite3 swarm.db "SELECT provider, model, SUM(cost_cents) as total FROM execution_costs GROUP BY provider, model" -json > result.json
              ;;
          esac

          # Output result for API response
          cat result.json
          echo "result=$(cat result.json | jq -c)" >> $GITHUB_OUTPUT

      - name: Return Result
        uses: actions/github-script@v7
        with:
          script: |
            // This result can be fetched via GitHub API
            console.log(${{ steps.query.outputs.result }});
```

**How Frontend Queries the Database:**

```typescript
// Frontend: Trigger "database query" via GitHub Actions API
async function listExecutions(owner: string, repo: string, token: string) {
  // 1. Trigger workflow_dispatch
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/db-query.yml/dispatches`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ref: "main",
        inputs: {
          query_type: "list_executions",
        },
      }),
    }
  );

  // 2. Wait for workflow to complete (poll)
  const runId = await waitForWorkflowRun(owner, repo, token);

  // 3. Get workflow run logs/outputs
  const result = await getWorkflowOutput(owner, repo, runId, token);

  return JSON.parse(result);
}
```

### Option B: JSON Files in Repository (Simpler)

**For lower volume, use JSON files:**

```
PROJECT-SWARM-data/
├── executions/
│   ├── 2025/
│   │   ├── 01/
│   │   │   ├── exec-123.json
│   │   │   └── exec-124.json
│   │   └── index.json          # Month index
│   └── index.json               # Year index
├── costs/
│   └── 2025-01.json             # Aggregated monthly costs
└── users/
    └── installations.json        # User installation data
```

**Query via GitHub API:**

```typescript
// Get execution
const response = await fetch(
  `https://api.github.com/repos/owner/PROJECT-SWARM-data/contents/executions/2025/01/exec-123.json`,
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
const content = JSON.parse(atob(response.data.content));
```

---

## 2. API Layer (GitHub Actions as Backend)

**Replace Express.js API with GitHub Actions triggered via workflow_dispatch.**

### API Endpoints → GitHub Actions Workflows

| Traditional Endpoint      | GitHub Actions Workflow |
| ------------------------- | ----------------------- |
| `POST /api/workflows`     | `create-workflow.yml`   |
| `GET /api/workflows/:id`  | `get-workflow.yml`      |
| `POST /api/executions`    | `execute-workflow.yml`  |
| `GET /api/executions/:id` | `get-execution.yml`     |
| `GET /api/costs`          | `get-costs.yml`         |

### Example: Create Workflow API

```yaml
# .github/workflows/api-create-workflow.yml
name: API - Create Workflow

on:
  workflow_dispatch:
    inputs:
      workflow_name:
        required: true
        type: string
      workflow_yaml:
        required: true
        type: string
      user_repo:
        required: true
        type: string

jobs:
  create-workflow:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout user repository
        uses: actions/checkout@v4
        with:
          repository: ${{ inputs.user_repo }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Create .swarm directory
        run: |
          mkdir -p .swarm/workflows

      - name: Write workflow file
        run: |
          echo '${{ inputs.workflow_yaml }}' > .swarm/workflows/${{ inputs.workflow_name }}.yml

      - name: Commit and push
        run: |
          git config user.name "PROJECT-SWARM Bot"
          git config user.email "bot@project-swarm.dev"
          git add .swarm/
          git commit -m "Create workflow: ${{ inputs.workflow_name }}"
          git push

      - name: Record in database
        run: |
          # Record workflow creation in SQLite
          sqlite3 ${{ github.workspace }}/swarm.db <<EOF
          INSERT INTO workflows (id, name, repo, created_at)
          VALUES ('wf_${{ github.run_id }}', '${{ inputs.workflow_name }}', '${{ inputs.user_repo }}', unixepoch());
          EOF
```

### Frontend API Client

```typescript
// Frontend calls GitHub Actions as API
class GitHubActionsAPI {
  constructor(private token: string) {}

  async createWorkflow(name: string, yaml: string, repo: string) {
    // Trigger GitHub Actions workflow
    const response = await fetch(
      "https://api.github.com/repos/PROJECT-SWARM/api/actions/workflows/api-create-workflow.yml/dispatches",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: { workflow_name: name, workflow_yaml: yaml, user_repo: repo },
        }),
      }
    );

    // Wait for completion and return result
    return this.waitForWorkflowResult(response);
  }

  async listExecutions() {
    // Read from repository files
    const response = await fetch(
      "https://api.github.com/repos/PROJECT-SWARM/data/contents/executions/index.json",
      { headers: { Authorization: `Bearer ${this.token}` } }
    );
    return JSON.parse(atob(response.data.content));
  }
}
```

---

## 3. Real-Time Updates (GitHub Events)

**Problem:** GitHub Actions aren't real-time for UI updates.

**Solution:** Use GitHub's event streaming:

### Option A: GitHub Actions Logs Streaming

```typescript
// Stream logs from running GitHub Actions
async function streamExecutionLogs(runId: string) {
  const eventSource = new EventSource(
    `https://api.github.com/repos/owner/repo/actions/runs/${runId}/logs/stream`
  );

  eventSource.onmessage = (event) => {
    console.log("New log:", event.data);
    updateUI(event.data);
  };
}
```

### Option B: Polling GitHub API (Simple)

```typescript
// Poll for execution status every 2 seconds
async function pollExecution(runId: string) {
  const interval = setInterval(async () => {
    const run = await fetch(`https://api.github.com/repos/owner/repo/actions/runs/${runId}`);
    const data = await run.json();

    if (data.status === "completed") {
      clearInterval(interval);
      showResults(data);
    } else {
      updateProgress(data);
    }
  }, 2000);
}
```

### Option C: GitHub Webhooks (Best)

```
User Repo → GitHub Webhook → GitHub Pages (Static)
                    ↓
         Store event in repo file
                    ↓
         Frontend polls file
```

---

## 4. Authentication (GitHub OAuth Only)

**No GitHub App needed - just use standard OAuth:**

```typescript
// Simple GitHub OAuth flow
function loginWithGitHub() {
  const clientId = "YOUR_GITHUB_OAUTH_APP_CLIENT_ID";
  const redirectUri = "https://project-swarm.github.io/callback";
  const scope = "repo,user,workflow";

  window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
}

// Callback page (GitHub Pages)
async function handleCallback() {
  const code = new URLSearchParams(window.location.search).get("code");

  // Exchange code for token (via GitHub Actions workflow!)
  const response = await fetch(
    "https://api.github.com/repos/PROJECT-SWARM/auth/actions/workflows/exchange-oauth-code.yml/dispatches",
    {
      method: "POST",
      body: JSON.stringify({
        ref: "main",
        inputs: { code },
      }),
    }
  );

  // Retrieve token from workflow output
  const token = await getWorkflowToken(response);
  localStorage.setItem("github_token", token);

  window.location.href = "/dashboard";
}
```

---

## 5. Cost Tracking (Still Works!)

**Track AI API costs and store in SQLite or JSON:**

```yaml
# .github/workflows/track-cost.yml
name: Track Execution Cost

on:
  workflow_call:
    inputs:
      execution_id:
        required: true
        type: string
      provider:
        required: true
        type: string
      input_tokens:
        required: true
        type: number
      output_tokens:
        required: true
        type: number

jobs:
  track-cost:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Calculate cost
        id: cost
        run: |
          # Calculate cost based on provider pricing
          COST=$(python3 << EOF
          provider = "${{ inputs.provider }}"
          input_tokens = ${{ inputs.input_tokens }}
          output_tokens = ${{ inputs.output_tokens }}

          pricing = {
            "anthropic": {"input": 0.003, "output": 0.015},
            "openai": {"input": 0.01, "output": 0.03},
            "gemini": {"input": 0.00125, "output": 0.00375}
          }

          cost = (input_tokens / 1000 * pricing[provider]["input"]) + \\
                 (output_tokens / 1000 * pricing[provider]["output"])
          print(int(cost * 100))  # Cost in cents
          EOF
          )
          echo "cost_cents=$COST" >> $GITHUB_OUTPUT

      - name: Record cost
        run: |
          sqlite3 swarm.db <<EOF
          INSERT INTO execution_costs (execution_id, provider, input_tokens, output_tokens, cost_cents)
          VALUES ('${{ inputs.execution_id }}', '${{ inputs.provider }}', ${{ inputs.input_tokens }}, ${{ inputs.output_tokens }}, ${{ steps.cost.outputs.cost_cents }});
          EOF

      - name: Commit database
        run: |
          git add swarm.db
          git commit -m "Track cost for execution ${{ inputs.execution_id }}"
          git push
```

---

## 6. File Structure (Complete)

```
PROJECT-SWARM/
├── .github/
│   └── workflows/
│       # API Layer (GitHub Actions as backend)
│       ├── api-create-workflow.yml
│       ├── api-get-workflow.yml
│       ├── api-execute-workflow.yml
│       ├── api-list-executions.yml
│       ├── api-get-costs.yml
│       ├── db-query.yml
│       ├── db-write.yml
│       ├── auth-oauth-exchange.yml
│       └── track-cost.yml
│
├── docs/
│   └── GITHUB-ONLY-ARCHITECTURE.md    # This doc
│
├── web/                                 # Frontend (GitHub Pages)
│   ├── index.html
│   ├── dashboard.html
│   ├── workflow-builder.html
│   └── js/
│       ├── github-api-client.ts       # API client for GitHub Actions
│       └── auth.ts                    # GitHub OAuth
│
├── swarm.db                            # SQLite database
├── swarm.db.backup                     # Daily backup
│
└── README.md
```

**Separate Data Repository:**

```
PROJECT-SWARM-data/ (Private repo for user data)
├── executions/
│   └── 2025/01/
│       ├── exec-123.json
│       └── index.json
├── costs/
│   └── 2025-01.json
└── users/
    └── installations.json
```

---

## 7. Deployment

### GitHub Pages Setup

```bash
# 1. Enable GitHub Pages
# Repository Settings → Pages → Source: main branch / docs folder

# 2. Build static frontend
npm run build
mv dist docs/

# 3. Push
git add docs/
git commit -m "Deploy to GitHub Pages"
git push

# Done! Site live at https://project-swarm.github.io
```

### Database Initialization

```bash
# 1. Create SQLite database
sqlite3 swarm.db < schema.sql

# 2. Commit to repo
git add swarm.db
git commit -m "Initialize database"
git push

# 3. Set up Git LFS (if needed for large DB)
git lfs track "*.db"
git add .gitattributes
git commit -m "Track database with Git LFS"
```

---

## 8. Limitations & Workarounds

### Limitation 1: GitHub Actions Rate Limits

**Limit:** 2000 minutes/month (free), 3000 for Pro

**Workaround:**

- Use GitHub Actions only for heavy compute (workflow execution)
- Use GitHub API directly for reads (5000 requests/hour)
- Cache aggressively
- Upgrade to Pro ($4/month → 3000 minutes)

### Limitation 2: API Response Time

**Problem:** workflow_dispatch takes ~10-30 seconds to start

**Workaround:**

- Use direct GitHub API for reads (instant)
- Use workflow_dispatch only for writes
- Show loading states in UI
- Pre-cache common queries

### Limitation 3: Concurrent Database Writes

**Problem:** SQLite in git = merge conflicts

**Workaround:**

- Use GitHub Actions job queue (sequential execution)
- OR use JSON files (each execution = separate file)
- OR use Git LFS with external locking

### Limitation 4: Storage Limits

**Repository Size:** 100GB recommended max, 1GB soft limit

**Workaround:**

- Use Git LFS for swarm.db (1GB free)
- Archive old executions to GitHub Releases
- Keep only last 90 days in active storage
- Upgrade to Pro for 2GB LFS

---

## 9. Cost Comparison

### Current (Azure-Based)

- Azure Database: $12-140/month
- Azure App Service: $13-70/month
- Azure Key Vault: $0.25/month
- **Total: $25-227/month**

### Proposed (GitHub-Only)

- GitHub Free: $0/month
  - 2000 Actions minutes
  - 500MB packages
  - 1GB LFS
  - Unlimited repos
  - Unlimited Pages

- GitHub Pro: $4/month (if needed)
  - 3000 Actions minutes
  - 2GB packages
  - 2GB LFS
  - Everything else same

**Savings: $21-223/month (84-98% reduction!)**

---

## 10. Migration Path

### Phase 1: Proof of Concept (1 week)

- [ ] Create SQLite database in repo
- [ ] Build one API endpoint (list executions) as GitHub Action
- [ ] Deploy simple frontend to GitHub Pages
- [ ] Test OAuth flow

### Phase 2: Core Features (2 weeks)

- [ ] Implement all API endpoints as Actions
- [ ] Build workflow execution engine
- [ ] Migrate cost tracking
- [ ] Add real-time log streaming

### Phase 3: Data Migration (1 week)

- [ ] Export existing data from Neon
- [ ] Import into SQLite
- [ ] Verify data integrity
- [ ] Switch over

### Phase 4: Polish (1 week)

- [ ] Optimize performance
- [ ] Add caching
- [ ] Documentation
- [ ] Launch

**Total: 5 weeks to fully GitHub-native**

---

## 11. Advantages of GitHub-Only Approach

1. **Zero Cost** - Run on GitHub's free tier
2. **Zero DevOps** - No servers to maintain
3. **Built-in Backup** - Every commit is a backup
4. **Transparent** - All data version controlled
5. **Portable** - Clone repo = full copy
6. **Simple** - One system, GitHub everywhere
7. **Reliable** - GitHub's 99.95% uptime
8. **Scalable** - GitHub handles scaling
9. **Secure** - GitHub's security team
10. **Community** - Open source by default

---

## 12. Proof of Concept Code

### Simple Example: Get Execution API

```yaml
# .github/workflows/api-get-execution.yml
name: Get Execution

on:
  workflow_dispatch:
    inputs:
      execution_id:
        required: true
        type: string

jobs:
  get:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Query database
        id: query
        run: |
          RESULT=$(sqlite3 swarm.db "SELECT json_object('id', id, 'status', status, 'started_at', started_at, 'github_run_id', github_run_id) FROM execution_runs WHERE id='${{ inputs.execution_id }}'")
          echo "result=$RESULT" >> $GITHUB_OUTPUT

      - name: Output result
        run: echo "${{ steps.query.outputs.result }}"
```

**Call from frontend:**

```typescript
async function getExecution(id: string): Promise<Execution> {
  // 1. Trigger action
  await octokit.actions.createWorkflowDispatch({
    owner: 'PROJECT-SWARM',
    repo: 'api',
    workflow_id: 'api-get-execution.yml',
    ref: 'main',
    inputs: { execution_id: id }
  });

  // 2. Wait for completion
  const run = await waitForRun();

  // 3. Get logs/output
  const result = await getRun Output(run.id);

  return JSON.parse(result);
}
```

---

## Conclusion

**This is a completely viable architecture!**

By using GitHub Actions as an API layer and repository files/SQLite as a database, we can eliminate ALL external dependencies and run entirely on GitHub's free tier.

**Key Innovations:**

1. GitHub Actions = Backend API (workflow_dispatch = HTTP endpoints)
2. SQLite in repo = SQL database
3. Repository JSON files = NoSQL option
4. GitHub Pages = Frontend hosting
5. GitHub OAuth = Authentication
6. GitHub Actions logs = Execution logs
7. GitHub Discussions = Knowledge base

**Next Steps:**

1. Build proof of concept (one API endpoint)
2. Measure performance/latency
3. Decide: SQLite vs JSON files for database
4. Implement full API layer
5. Migrate existing data

**Should we build this?** It's unconventional but potentially revolutionary - a full SaaS running entirely on GitHub's infrastructure for $0/month!
