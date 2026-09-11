# PROJECT-SWARM Setup Guide — GitHub-Only Architecture

> **Zero-cost multi-agent orchestration** using only GitHub infrastructure.
> No credit card, no external services — just GitHub.

---

## 🎯 What You're Setting Up

| Component | Technology | Cost |
|-----------|-----------|------|
| **Database** | SQLite in repository | $0 |
| **API Layer** | GitHub Actions (`workflow_dispatch`) | $0 (2K minutes/mo free) |
| **Frontend** | GitHub Pages (static HTML) | $0 |
| **Authentication** | GitHub OAuth (PAT) | $0 |

**Total:** $0/month

---

## 📋 Prerequisites

- GitHub account (free tier is fine)
- Repository: `Universal-Standard/PROJECT-SWARM`
- Branch: `claude/repo-review-cAxgA` (or your dev branch)

---

## Step 1: Enable GitHub Pages (2 minutes)

### Via Web UI

1. Go to repository **Settings** → **Pages**
2. Under **Source**, select:
   - **Deploy from a branch**
   - Branch: `claude/repo-review-cAxgA`
   - Folder: `/docs`
3. Click **Save**
4. Wait ~1 minute for deployment
5. Visit `https://universal-standard.github.io/PROJECT-SWARM/`

### Via GitHub CLI

```bash
gh repo edit Universal-Standard/PROJECT-SWARM \
  --enable-pages \
  --pages-branch claude/repo-review-cAxgA \
  --pages-path /docs
```

---

## Step 2: Create a GitHub Personal Access Token (3 minutes)

The frontend needs a PAT to trigger GitHub Actions workflows via the API.

### Token Permissions Required

- ✅ `repo` (full control of private repositories)
- ✅ `workflow` (update GitHub Actions workflows)

### Create Token

1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Click **Generate new token** → **Generate new token (classic)**
3. Name: `PROJECT-SWARM POC`
4. Expiration: 30 days (or custom)
5. Select scopes:
   - ✅ `repo`
   - ✅ `workflow`
6. Click **Generate token**
7. **Copy the token** (starts with `ghp_`) — you won't see it again

---

## Step 3: Test the Frontend (5 minutes)

1. Open `https://universal-standard.github.io/PROJECT-SWARM/`
2. In the **Configuration** section, enter:
   - **GitHub PAT:** `ghp_xxxxxxxxxxxx` (paste your token)
   - **Owner:** `Universal-Standard`
   - **Repo:** `PROJECT-SWARM`
   - **Branch:** `claude/repo-review-cAxgA`
3. Click **Save**
4. Click **Test connection** — should show: _"Connected: Universal-Standard/PROJECT-SWARM (public)"_

---

## Step 4: Create Your First Execution (30 seconds)

### Using the Web UI

1. Scroll to **Create Execution** card
2. Fill in:
   - **Target Repository:** `Universal-Standard/PROJECT-SWARM`
   - **Workflow Path:** `.swarm/workflows/demo.yml`
   - **Status:** `queued`
3. Click **Create execution**
4. Wait ~20 seconds
5. The output will show the GitHub Actions run URL

### Using GitHub CLI

```bash
gh workflow run api-create-execution.yml \
  --ref claude/repo-review-cAxgA \
  --field github_repo="Universal-Standard/PROJECT-SWARM" \
  --field github_run_id="123456" \
  --field workflow_path=".swarm/workflows/demo.yml" \
  --field status="queued"
```

---

## Step 5: List Executions (30 seconds)

### Using the Web UI

1. Scroll to **List Executions** card
2. Leave filters blank (to fetch all)
3. Click **List executions**
4. Wait ~20 seconds
5. Download the artifact from the workflow run to see the JSON response

### Using GitHub CLI

```bash
gh workflow run api-list-executions.yml \
  --ref claude/repo-review-cAxgA \
  --field limit="10" \
  --field offset="0"

# Wait ~20 seconds, then view runs
gh run list --workflow=api-list-executions.yml --limit 1
```

---

## Step 6: Update an Execution (30 seconds)

```bash
# Get an execution ID from the previous step, then:
gh workflow run api-update-execution.yml \
  --ref claude/repo-review-cAxgA \
  --field execution_id="exec_abc123..." \
  --field status="completed" \
  --field mark_completed="true" \
  --field add_cost_cents="150"
```

---

## Step 7: Generate a Cost Report (30 seconds)

```bash
gh workflow run api-cost-report.yml \
  --ref claude/repo-review-cAxgA \
  --field start_date="2026-03-01" \
  --field end_date="2026-03-31" \
  --field create_issue="false"

# Wait ~20 seconds, then download the artifact
gh run list --workflow=api-cost-report.yml --limit 1
```

Or trigger manually from the **Actions** tab → **API: Cost Report** → **Run workflow**.

---

## 🎯 Expected Latency

| Operation | Expected Time | Why? |
|-----------|--------------|------|
| **First API call** | 25–35 seconds | GitHub Actions cold start + npm install |
| **Subsequent calls** | 15–25 seconds | Cold start (no cache between runs) |
| **Future optimization** | < 10 seconds | Pre-build Docker image with deps |

**This is a proof of concept.** For production < 200ms latency, see `docs/AZURE-SETUP-GUIDE.md`.

---

## 📊 Monitoring & Debugging

### View Workflow Runs

```bash
# List recent API calls
gh run list --workflow=api-list-executions.yml --limit 5
gh run list --workflow=api-create-execution.yml --limit 5

# View a specific run
gh run view 123456789 --log

# Download artifacts
gh run download 123456789
```

### Check Database Size

```bash
ls -lh swarm.db
# Target: < 1.5 GB (free tier limit: 2 GB)
```

### Query Database Locally

```bash
npm install -g better-sqlite3
node -e "
  const db = require('better-sqlite3')('swarm.db', {readonly: true});
  const rows = db.prepare('SELECT * FROM execution_runs ORDER BY started_at DESC LIMIT 5').all();
  console.table(rows);
"
```

---

## 🔒 Security Best Practices

1. **Never commit your PAT** — it's stored only in browser `localStorage`
2. **Use token expiration** — set 30-day expiry, rotate regularly
3. **Limit token scope** — only `repo` + `workflow`, nothing else
4. **Enable 2FA** — protect your GitHub account
5. **Review workflow logs** — check for unexpected activity

---

## 🚨 Troubleshooting

### "Workflow not found" error

**Cause:** The workflow file doesn't exist on the branch you're targeting.

**Fix:**
```bash
git checkout claude/repo-review-cAxgA
ls .github/workflows/api-*.yml
# Ensure all API workflows are present
```

### "Resource not accessible by integration" error

**Cause:** `GITHUB_TOKEN` doesn't have `contents: write` permission.

**Fix:** Check the workflow YAML has:
```yaml
permissions:
  contents: write
  actions: write
```

### Artifacts not appearing

**Cause:** Workflow failed before the upload step.

**Fix:**
```bash
gh run view <run-id> --log
# Look for errors in the "Query database" or "Create execution" step
```

### Database locked error

**Cause:** Multiple workflows writing to `swarm.db` simultaneously.

**Fix:** SQLite WAL mode handles this, but if persistent:
1. Check for long-running workflows
2. Add retry logic with exponential backoff
3. Consider migrating to PostgreSQL (Phase 4)

---

## 📈 Scaling to Production

When you hit these limits, see `docs/IMPLEMENTATION-PLAN.md` Phase 4:

| Limit | Action |
|-------|--------|
| > 500 executions/month | Archive old data |
| > 1 GB database size | Enable Git LFS |
| > 1.5 GB database size | Migrate to Azure PostgreSQL |
| Need < 200 ms API latency | Deploy to Azure App Service |

---

## 🎉 Next Steps

- ✅ You now have a working zero-cost multi-agent orchestration system
- ✅ SQLite database is version-controlled in your repo
- ✅ GitHub Actions workflows act as your API layer
- ✅ GitHub Pages serves your frontend

**Build your first swarm:**
1. Create `.swarm/workflows/my-first-swarm.yml`
2. Define agents, triggers, and outputs
3. Record executions via the API
4. Track costs automatically

See `docs/IMPLEMENTATION-PLAN.md` for the full roadmap.
