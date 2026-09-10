# Task 13: Automated Vulnerability Scanning

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.25h
- **Component**: Security / DevOps
- **Phase**: Phase 1
- **Stream**: Security Stream
- **Dependencies**: Task 12

## Objective
Set up automated vulnerability scanning in CI/CD that blocks deployments with critical vulnerabilities.

## Implementation
- Configure npm audit in GitHub Actions as a required check
- Add Snyk or similar: npx snyk test --severity-threshold=high
- Create .github/workflows/security-scan.yml
- Scan on every PR and push to main
- Block merges if critical vulns found
- Configure Dependabot for automatic dependency updates
- Create security policy: SECURITY.md

## Acceptance Criteria
- [ ] Security scan runs on every PR
- [ ] Critical vulns block merge
- [ ] Dependabot PRs auto-created for updates
- [ ] SECURITY.md documents disclosure process

## Deliverables
- `.github/workflows/security-scan.yml`
- `.github/dependabot.yml`
- `SECURITY.md`
