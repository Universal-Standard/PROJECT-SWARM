# GitHub Platform Setup Guide

Complete deployment of PROJECT-SWARM using **only** GitHub infrastructure:
- **GitHub Pages** — React frontend
- **GitHub Actions** — API backend (workflow_dispatch = REST API)
- **SQLite in repo** — database (`swarm.db`)
- **GitHub OAuth** — authentication
- **GitHub Discussions** — knowledge base
- **GitHub Gists** — large output storage
- **GitHub Releases** — database backups & workflow snapshots

**Cost: $0** (GitHub Free tier)

## Step 1 — Fork the repository

Fork `Universal-Standard/PROJECT-SWARM` to your GitHub account.

## Step 2 — Add GitHub Secrets

In your fork: **Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Description |
|---|---|
| `SWARM_GITHUB_CLIENT_ID` | GitHub OAuth App client ID |
| `SWARM_GITHUB_CLIENT_SECRET` | GitHub OAuth App client secret |
| `SWARM_BOOTSTRAP_TOKEN` | Fine-grained PAT with `Actions: write` on this repo only |
| `OPENAI_API_KEY` | OpenAI API key (optional) |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) |
| `GEMINI_API_KEY` | Google Gemini API key (optional) |
| `SWARM_WEBHOOK_SECRET` | Random string for webhook HMAC validation (optional) |

### Creating a GitHub OAuth App

1. Go to https://github.com/settings/applications/new
2. **Application name**: `PROJECT-SWARM`
3. **Homepage URL**: `https://YOUR-USERNAME.github.io/PROJECT-SWARM/`
4. **Authorization callback URL**: `https://YOUR-USERNAME.github.io/PROJECT-SWARM/auth/callback`
5. Copy the **Client ID** and generate a **Client Secret**

### Creating the Bootstrap Token

1. Go to https://github.com/settings/personal-access-tokens/new
2. **Resource owner**: your account
3. **Repository access**: Only select repositories → your fork
4. **Permissions**: Actions → Read and write
5. Generate and copy the token

## Step 3 — Add Repository Variables

**Settings → Secrets and variables → Actions → Variables tab**

| Variable name | Value |
|---|---|
| `GITHUB_OWNER` | Your GitHub username |
| `GITHUB_REPO` | `PROJECT-SWARM` (or your fork's repo name) |

## Step 4 — Enable GitHub Pages

**Settings → Pages → Source**: `GitHub Actions`

## Step 5 — Initialize the database

**Actions → "API: Create Execution" → Run workflow** (or any API workflow)

This auto-initializes `swarm.db` with the correct schema on first run.

Alternatively, manually trigger:
**Actions → Run workflow** on `build-deploy-github.yml` to deploy the frontend.

## Step 6 — Access your app

Your app is live at:
`https://YOUR-USERNAME.github.io/PROJECT-SWARM/`

## How it works

### API calls
Every API operation (create workflow, run execution, etc.) dispatches a GitHub Actions workflow:

1. Browser calls `POST /repos/.../actions/workflows/api-xxx.yml/dispatches`
2. GitHub Actions runner picks up the job (~10-30s cold start)
3. Node.js script reads/writes `swarm.db` (SQLite in the repository)
4. Result written as a downloadable artifact (JSON)
5. Browser polls for completion, downloads artifact, returns data

### Authentication
GitHub OAuth flow with client secret protected in GitHub Secrets — never exposed in the browser.

### Database
`swarm.db` is a SQLite file committed in the repository. Every write operation:
1. Checks out the repo
2. Modifies the SQLite database
3. Commits and pushes the changes

Git history = automatic database versioning. Daily backups are pushed as GitHub Releases.

## API rate limits (GitHub Free tier)

| Resource | Limit |
|---|---|
| Actions minutes | 2,000/month |
| Actions concurrent jobs | 20 |
| API requests | 5,000/hour |
| Artifact storage | 500MB |
| Pages bandwidth | 100GB/month |

Each API call uses ~1-3 minutes of Actions time. At 2,000 minutes/month free, that's ~700-2,000 API calls/month. For higher volume, upgrade to GitHub Pro (~$4/month → 3,000 minutes).

## Latency

API calls have ~10-30s latency (GitHub Actions cold start). Read operations can use the GitHub Contents API directly (< 1s) for cached data like workflow definitions and execution indexes.

This makes the platform suitable for workflow orchestration (inherently async) but not for real-time interactive applications requiring sub-second API responses.
