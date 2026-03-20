# PROJECT-SWARM — Implementation Plan

> **Architecture Decision: GitHub-Only (Path C — Hybrid)**
> Start free on GitHub infrastructure, migrate to Azure PostgreSQL only when
> volume demands it. This document covers the full path.

---

## Executive Summary

| What we have | Status |
|---|---|
| Production codebase (Express + React) | ✅ |
| 92 passing tests | ✅ |
| Structured logging & type safety | ✅ |
| GitHub-centric architecture docs | ✅ |
| SQLite schema (`schema.sql`) | ✅ |
| API endpoints (GitHub Actions workflows) | ✅ |
| GitHub Pages frontend POC (`docs/index.html`) | ✅ |

---

## Architecture Comparison

| | Path A — GitHub Only | Path B — GitHub + Azure | Path C — Hybrid ★ |
|---|---|---|---|
| **Cost** | $0 / month | $25–227 / month | $0 → $25+ when needed |
| **Timeline** | 5 weeks | 8 weeks | 5 weeks + scale when ready |
| **API latency** | 10–30 s | < 200 ms | Starts slow, goes fast |
| **Concurrent writes** | Limited (WAL) | Unlimited | Grows with you |
| **Best for** | MVP / side projects | Enterprise / high volume | Most startups ★ |

---

## Phase 1 — GitHub-Native POC (Weeks 1–2)

### Week 1: Foundation ✅ (done in this session)

- [x] `schema.sql` — 6-table SQLite schema
- [x] `scripts/init-db.ts` — initialise `swarm.db`
- [x] `.github/workflows/api-list-executions.yml` — read endpoint
- [x] `.github/workflows/api-create-execution.yml` — write endpoint
- [x] `docs/index.html` — GitHub Pages frontend
- [x] `better-sqlite3` added to dependencies

### Week 2: Core API surface

Extend the GitHub Actions API layer with the remaining endpoints:

| Endpoint | Workflow file |
|---|---|
| GET  executions       | `api-list-executions.yml` ✅ |
| POST execution        | `api-create-execution.yml` ✅ |
| PATCH execution       | `api-update-execution.yml` |
| GET  costs summary    | `api-cost-report.yml` |
| POST agent message    | `api-log-message.yml` |
| GET  workflow stats   | `api-workflow-stats.yml` |

---

## Phase 2 — Workflow Engine (Weeks 3–4)

Move workflow definitions out of the database into `.swarm/` YAML files
tracked in the repository:

```
.swarm/
├── workflows/
│   ├── code-review.yml        # PR analysis swarm
│   ├── issue-triage.yml       # GitHub Issue classifier
│   └── weekly-digest.yml      # Summary report
└── agents/
    ├── coordinator.yml        # Orchestrator config
    └── analyst.yml            # Analyst config
```

### Workflow YAML format

```yaml
# .swarm/workflows/code-review.yml
name: Code Review Swarm
version: 1

trigger:
  github:
    events: [pull_request.opened, pull_request.synchronize]

agents:
  - id: coordinator
    provider: anthropic
    model: claude-sonnet-4-6
    role: Coordinator
    system_prompt: |
      You orchestrate the code review. Delegate security review to the
      security-analyst and style review to the style-reviewer.

  - id: security-analyst
    provider: anthropic
    model: claude-sonnet-4-6
    role: Analyst
    focus: security vulnerabilities, OWASP top 10

  - id: style-reviewer
    provider: openai
    model: gpt-4o
    role: Reviewer
    focus: code style, naming, readability

output:
  format: github_review   # Posts review comments on the PR
  post_summary: true
```

---

## Phase 3 — Frontend (Week 5)

Evolve `docs/index.html` into a proper React SPA built with Vite and
deployed to GitHub Pages via `deploy-github-pages.yml`.

```
docs/
├── index.html          # Entry point (Vite output)
├── api-demo.html       # Raw POC (keep for reference)
└── _redirects          # SPA fallback route
```

Key pages:
- **Dashboard** — live execution list (polls GitHub API)
- **Workflow editor** — visual YAML editor for `.swarm/` files
- **Cost report** — charts from `execution_costs` table
- **Settings** — GitHub PAT + provider API keys

---

## Phase 4 — Scale to Azure (when needed)

Trigger: > 500 executions/month or > 1 GB database size.

```bash
# 1. Provision Azure PostgreSQL (Flexible Server — Burstable B2s)
az postgres flexible-server create \
  --resource-group project-swarm-rg \
  --name project-swarm-db \
  --sku-name Standard_B2s \
  --tier Burstable

# 2. Export SQLite → PostgreSQL
pgloader sqlite:///swarm.db postgresql://...

# 3. Switch DATABASE_URL in GitHub Secrets
# 4. Deploy API to Azure App Service (B1 ~$13/mo)
```

See `docs/AZURE-SETUP-GUIDE.md` for the full walkthrough.

---

## Database Size Management

| When | Action |
|---|---|
| > 500 MB | Archive executions older than 90 days to separate repo |
| > 1 GB   | Enable Git LFS for `swarm.db` |
| > 1.5 GB | Migrate to Azure PostgreSQL |

Archiving script: `.github/workflows/db-archive.yml` (runs on a cron).

---

## Cost Tracking Without External Services

Every agent invocation logs to `execution_costs`:

```sql
INSERT INTO execution_costs (id, execution_id, provider, model,
  input_tokens, output_tokens, cost_cents)
VALUES (…)
```

Monthly report workflow (`.github/workflows/api-cost-report.yml`):
- Aggregates `execution_costs` by provider/model
- Posts results as a GitHub Actions summary
- Optionally opens a GitHub Issue with the monthly bill

---

## Decision Checklist

```
[ ] Free tier is fine       → Stay on Path A, ship Phase 1 this week
[ ] Need < 200ms latency    → Add Azure App Service (Phase 4)
[ ] > 500 users/month       → Migrate DB to Azure PostgreSQL (Phase 4)
[ ] Enterprise compliance   → Add Azure Key Vault for secrets
[ ] Multi-repo support      → Install as a GitHub App (oauth scope: repo)
```

---

## Immediate Next Steps (This Week)

1. **Deploy GitHub Pages** — enable `docs/` as the Pages source in repo Settings
2. **Test the POC** — open `https://universal-standard.github.io/PROJECT-SWARM/`
   and trigger a workflow from the UI
3. **Measure latency** — record actual cold-start time for the two API workflows
4. **Build `api-update-execution.yml`** — needed for status transitions
5. **Set up `GITHUB_TOKEN` write permission** — required for `api-create-execution.yml`
   to commit the database back to the branch

---

## Repository Structure (Target)

```
PROJECT-SWARM/
├── .github/
│   └── workflows/
│       ├── ci.yml                        # Tests & lint
│       ├── deploy-github-pages.yml       # Build & deploy frontend
│       ├── api-list-executions.yml    ✅ # GET executions
│       ├── api-create-execution.yml   ✅ # POST execution
│       ├── api-update-execution.yml      # PATCH execution
│       ├── api-cost-report.yml           # GET cost summary
│       └── db-archive.yml                # Cron: archive old data
├── .swarm/
│   └── workflows/                        # User workflow definitions (YAML)
├── client/                               # React frontend (Vite)
├── server/                               # Express API (existing)
├── docs/
│   ├── index.html                     ✅ # GitHub Pages SPA entry
│   ├── GITHUB-ONLY-ARCHITECTURE.md    ✅
│   ├── GITHUB-CENTRIC-ARCHITECTURE.md ✅
│   ├── IMPLEMENTATION-PLAN.md         ✅ # (this file)
│   └── AZURE-SETUP-GUIDE.md           ✅
├── schema.sql                         ✅ # SQLite schema
├── swarm.db                           ✅ # Live database (git-tracked)
└── scripts/
    └── init-db.ts                     ✅ # DB initializer
```
