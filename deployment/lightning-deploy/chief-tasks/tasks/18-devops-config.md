# Task 18: Cloudflare Workers & Wrangler Configuration

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.25h
- **Component**: DevOps / Infrastructure
- **Phase**: Phase 1
- **Stream**: DevOps Stream
- **Dependencies**: Task 17

## Objective
Configure Cloudflare Workers deployment with wrangler.toml, KV namespaces, environment variables, and custom domain.

## Implementation
- Create wrangler.toml with correct Workers config
- Create KV namespaces: CACHE, SESSIONS via wrangler kv:namespace create
- Configure D1 database binding (optional Cloudflare DB fallback)
- Set up workers.dev subdomain: swarm.workers.dev
- Configure environment variables for production
- Create deploy:staging and deploy:production npm scripts
- Document deployment process in DEPLOYMENT.md

## Acceptance Criteria
- [ ] wrangler.toml valid and deployed
- [ ] KV namespaces created and bound
- [ ] vinext deploy succeeds on clean build
- [ ] Health endpoint: GET /api/health returns 200

## Deliverables
- `wrangler.toml`
- `DEPLOYMENT.md`
- `scripts/deploy.sh`
