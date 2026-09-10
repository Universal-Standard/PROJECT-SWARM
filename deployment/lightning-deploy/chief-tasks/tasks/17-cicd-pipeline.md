# Task 17: CI/CD Pipeline Configuration

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5h
- **Component**: DevOps / CI
- **Phase**: Phase 1
- **Stream**: DevOps Stream
- **Dependencies**: Task 01

## Objective
Configure a production-grade CI/CD pipeline with linting, testing, type checking, and preview deployments on every PR.

## Implementation
- Create .github/workflows/ci.yml — runs on all PRs
- CI steps: checkout → install → lint → type-check → test → build
- Create .github/workflows/deploy-preview.yml — vinext deploy --preview on PR
- Create .github/workflows/deploy-production.yml — deploy on main merge
- Configure branch protection: require CI to pass before merge
- Set up PR preview URL comments via GitHub Actions
- Cache npm dependencies between runs

## Acceptance Criteria
- [ ] CI runs on every PR and passes
- [ ] Preview deployed to unique URL per PR
- [ ] Production deploys automatically on main merge
- [ ] Branch protection enforced

## Deliverables
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-preview.yml`
- `.github/workflows/deploy-production.yml`
