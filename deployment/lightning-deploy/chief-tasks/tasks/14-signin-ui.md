# Task 14: Authentication UI (Sign In / Sign Up)

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: Frontend / Auth
- **Phase**: Phase 1
- **Stream**: Frontend Stream
- **Dependencies**: Task 01

## Objective
Create the authentication UI using NextAuth.js with GitHub OAuth, including sign-in page, session handling, and protected routes.

## Implementation
- Configure NextAuth.js with GitHub provider in src/lib/auth/options.ts
- Create src/app/auth/signin/page.tsx — sign in with GitHub button
- Create src/app/auth/error/page.tsx — auth error handling
- Implement session provider in src/app/layout.tsx
- Create useSession hook wrapper for type safety
- Implement auth middleware for protected routes in middleware.ts
- Handle org creation/selection on first login

## Acceptance Criteria
- [ ] GitHub OAuth sign-in works end-to-end
- [ ] Session persists across page refreshes
- [ ] Protected routes redirect to sign-in
- [ ] First-time users get org created

## Deliverables
- `src/lib/auth/options.ts`
- `src/app/auth/signin/page.tsx`
- `src/middleware.ts`
- `src/components/auth/UserMenu.tsx`
