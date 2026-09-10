# Task 09: GitHub Repositories API Endpoint

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: API / GitHub
- **Phase**: Phase 1
- **Stream**: API Stream
- **Dependencies**: Tasks 01-02

## Objective
Create /api/github/repos endpoint that lists, creates, and manages GitHub repositories for authenticated users.

## Implementation
- Create src/app/api/github/repos/route.ts with GET, POST handlers
- Use GitHub REST API via Octokit: @octokit/rest
- GET /api/github/repos — list user repos with pagination
- POST /api/github/repos — create new repo
- Implement org-scoped GitHub token management
- Rate limiting: 100 req/15min per org
- Error handling: 401, 403, 404, 429 responses

## Acceptance Criteria
- [ ] GET /api/github/repos returns paginated repo list
- [ ] POST creates repo successfully
- [ ] 401 returned for unauthenticated requests
- [ ] Rate limiting enforced

## Deliverables
- `src/app/api/github/repos/route.ts`
- `src/lib/github/client.ts`
