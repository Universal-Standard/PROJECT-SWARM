# Netlify Platform Setup Guide

Deploy PROJECT-SWARM on **Netlify** using Netlify Pages (frontend) + Netlify Functions (backend API) + Neon PostgreSQL (database).

## Architecture

```
Browser → Netlify CDN (React SPA from dist/)
             ↓ /api/* requests
         Netlify Functions (Node.js serverless)
             ↓ reads/writes
         Neon PostgreSQL (serverless Postgres)
```

**Cost**: Free tier supports 125k function invocations/month + 100GB bandwidth. Enough for personal/small team use.

## Prerequisites

- Netlify account (free at netlify.com)
- Neon PostgreSQL database (free tier at neon.tech)
- GitHub OAuth App
- AI provider API keys (OpenAI, Anthropic, or Gemini — at least one)

## Step 1 — Create a GitHub OAuth App

1. Go to https://github.com/settings/applications/new
2. **Application name**: `PROJECT-SWARM`
3. **Homepage URL**: `https://YOUR-SITE.netlify.app`
4. **Authorization callback URL**: `https://YOUR-SITE.netlify.app/api/auth/github/callback`
5. Copy the **Client ID** and generate a **Client Secret**

## Step 2 — Create a Neon Database

1. Sign up at https://neon.tech (free tier)
2. Create a new project → copy the connection string
3. Run the schema migration:
   ```bash
   psql $DATABASE_URL -f schema.sql
   ```
   Or use `npm run db:push` from the root with the DATABASE_URL set.

## Step 3 — Deploy to Netlify

### Option A — Netlify UI (recommended for first deployment)

1. Push this repo to GitHub
2. Go to https://app.netlify.com → **Add new site → Import from Git**
3. Select your repository
4. Set build settings:
   - **Base directory**: `platforms/netlify`
   - **Build command**: `npm ci && npm run build`
   - **Publish directory**: `platforms/netlify/dist`
   - **Functions directory**: `platforms/netlify/netlify/functions`
5. Add environment variables (see Step 4)
6. Click **Deploy**

### Option B — Netlify CLI

```bash
npm install -g netlify-cli
cd platforms/netlify
npm install
netlify login
netlify init
netlify deploy --prod
```

## Step 4 — Set Environment Variables

In Netlify dashboard → **Site settings → Environment variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your Neon connection string |
| `SESSION_SECRET` | Random 64-char string (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | Random 32-char string |
| `ENCRYPTION_SALT` | Random 16-char string |
| `GITHUB_CLIENT_ID` | From your GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | From your GitHub OAuth App |
| `GITHUB_REDIRECT_URI` | `https://YOUR-SITE.netlify.app/api/auth/github/callback` |
| `OPENAI_API_KEY` | (optional) OpenAI API key |
| `ANTHROPIC_API_KEY` | (optional) Anthropic API key |
| `GEMINI_API_KEY` | (optional) Google Gemini API key |
| `NODE_ENV` | `production` |

## Step 5 — GitHub Actions CI/CD (optional)

Add these secrets to your GitHub repository:

| Secret | Description |
|---|---|
| `NETLIFY_AUTH_TOKEN` | From https://app.netlify.com/user/applications/personal |
| `NETLIFY_SITE_ID` | From Site settings → General → Site ID |

The `.github/workflows/build-deploy-netlify.yml` workflow will auto-deploy on every push to `main`.

## Local Development

```bash
cd platforms/netlify
npm install
# Copy .env.example to .env and fill in values
netlify dev
```

This starts the Netlify dev server with function emulation at `http://localhost:8888`.

## Notes

- **WebSockets**: Not supported in Netlify Functions. The frontend polls for execution status every 3s during active runs.
- **Long-running AI**: Netlify Functions have a 26s timeout on the free plan (10min on Pro). For long AI workflows, consider using the Cloudflare variant which uses Queues for async processing.
- **Sessions**: Uses in-memory session store. For multi-instance production deployments, configure `DATABASE_URL` and switch to `connect-pg-simple` in `platforms/shared/server/standalone-app.ts`.
