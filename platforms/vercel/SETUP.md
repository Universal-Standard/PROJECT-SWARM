# Vercel Platform Setup Guide

Deploy PROJECT-SWARM on **Vercel** using Vercel's Edge Network (frontend) + Serverless Functions (backend API) + Neon PostgreSQL (database).

## Architecture

```
Browser → Vercel Edge Network (React SPA from dist/)
             ↓ /api/* requests (rewritten by vercel.json)
         Vercel Serverless Function (Node.js 22)
             ↓ reads/writes
         Neon PostgreSQL (serverless Postgres)
```

**Cost**: Hobby plan is free with 100GB bandwidth + 100k function invocations/day.

## Prerequisites

- Vercel account (free at vercel.com)
- Neon PostgreSQL database (free tier at neon.tech)
- GitHub OAuth App
- AI provider API keys (at least one)

## Step 1 — Create a GitHub OAuth App

1. Go to https://github.com/settings/applications/new
2. **Application name**: `PROJECT-SWARM`
3. **Homepage URL**: `https://YOUR-PROJECT.vercel.app`
4. **Authorization callback URL**: `https://YOUR-PROJECT.vercel.app/api/auth/github/callback`
5. Copy the **Client ID** and generate a **Client Secret**

## Step 2 — Create a Neon Database

1. Sign up at https://neon.tech (free tier)
2. Create a new project → copy the connection string
3. Run the schema:
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```

## Step 3 — Deploy to Vercel

### Option A — Vercel UI (recommended)

1. Push this repo to GitHub
2. Go to https://vercel.com/new → **Import Git Repository**
3. Select your repository
4. Configure project:
   - **Framework Preset**: Other
   - **Root Directory**: `platforms/vercel` (or leave blank and set in vercel.json)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables (see Step 4)
6. Click **Deploy**

### Option B — Vercel CLI

```bash
npm install -g vercel
cd platforms/vercel
npm install
vercel login
vercel --prod
```

## Step 4 — Set Environment Variables

In Vercel dashboard → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `SESSION_SECRET` | Random 64-char string (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | Random 32-char string |
| `ENCRYPTION_SALT` | Random 16-char string |
| `GITHUB_CLIENT_ID` | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | From your GitHub OAuth App |
| `GITHUB_REDIRECT_URI` | `https://YOUR-PROJECT.vercel.app/api/auth/github/callback` |
| `OPENAI_API_KEY` | (optional) OpenAI API key |
| `ANTHROPIC_API_KEY` | (optional) Anthropic API key |
| `GEMINI_API_KEY` | (optional) Google Gemini API key |
| `NODE_ENV` | `production` |

## Step 5 — GitHub Actions CI/CD (optional)

Add these secrets to your GitHub repository:

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | From https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | From `.vercel/project.json` after `vercel link` |

The `.github/workflows/build-deploy-vercel.yml` workflow auto-deploys previews on PRs and production on `main`.

## Local Development

```bash
cd platforms/vercel
npm install
# Copy root .env to platforms/vercel/.env and fill in values
vercel dev
```

This starts the Vercel dev server with serverless function emulation at `http://localhost:3000`.

## Notes

- **WebSockets**: Not supported in Vercel Serverless Functions. Frontend polls every 3s during active executions.
- **Function timeout**: 60s (configured in `vercel.json`). For longer AI workflows, use the Cloudflare variant.
- **Cold starts**: First request after inactivity may be slow (1-3s). Vercel Pro has "Fluid Compute" that reduces this.
- **Sessions**: In-memory sessions are lost on cold start. For production, configure `connect-pg-simple` in `platforms/shared/server/standalone-app.ts`.
