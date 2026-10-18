# Retired architecture: GitHub-only data plane

This document is retained as a migration marker because older links may still
reference it. The GitHub-only design is not supported by PROJECT-SWARM.

## Current architecture

PROJECT-SWARM is a PostgreSQL-backed Express application with a React/Vite
frontend. Drizzle migrations and the application database are the source of
truth for users, workflows, executions, schedules, knowledge, and costs.

GitHub Actions is used for CI, security checks, artifact publication, and
optional operational triggers. It must not be used as a database, API server,
workflow execution store, or mechanism for committing runtime state into the
repository.

The old repository SQLite files and database-writing workflows were removed in
the production-baseline migration. Git history remains available if historical
reference is required; restoring those workflows would reintroduce concurrent
write races, stale schema drift, and exposed runtime state in source control.

Use the current setup guide and deployment documentation instead:

- [Setup guide](./SETUP-GUIDE.md)
- [Deployment guide](./deployment/MULTI_PLATFORM_DEPLOYMENT.md)
- [Production-baseline migration record](./migrations/2026-10-production-baseline.md)
