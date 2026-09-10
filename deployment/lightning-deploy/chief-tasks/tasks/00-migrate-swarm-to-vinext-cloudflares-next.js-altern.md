# Task 00: Migrate SWARM to vinext (Cloudflare's Next.js Alternative)

## Context
- **Priority**: P0 - Critical
- **Estimated Hours**: 0.5 hours (with Chief AI)
- **Component**: Infrastructure / Build System
- **Phase**: Phase 0 - Pre-Foundation
- **Stream**: Infrastructure Setup
- **Dependencies**: None (runs before Phase 1)

## Objective
Migrate SWARM from standard Next.js to vinext to achieve 4.4x faster builds, 57% smaller bundles, and Cloudflare Workers deployment.

## Background
Cloudflare released vinext in February 2026 — a full Next.js API reimplementation on Vite, built by 1 engineer + Claude AI in 1 week for $1,100. It proves AI-first development works at production scale. SECURITY NOTE: Run npm audit before accepting migration — vinext is experimental and had known vulnerabilities patched post-release. Pin to a stable release.

## Implementation Steps

### 1. Security Gate (REQUIRED FIRST)
```bash
npm audit --audit-level=high
# If critical vulnerabilities found in vinext, pause and check:
# https://github.com/cloudflare/vinext/releases
# Use the latest patched release only
```

### 2. Install vinext
```bash
npm install -D vinext@latest
```

### 3. Initialize Migration
```bash
# AI-assisted migration (recommended)
npx skills add cloudflare/vinext
npx vinext init

# OR manual migration
npx vinext migrate
```

### 4. Update package.json scripts
```json
{
  "scripts": {
    "dev": "vinext dev",
    "build": "vinext build",
    "start": "vinext start",
    "deploy": "vinext deploy",
    "deploy:preview": "vinext deploy --preview",
    "analyze": "vinext analyze"
  }
}
```

### 5. Create vinext.config.js
```javascript
/** @type {import('vinext').VinextConfig} */
export default {
  experimental: { serverActions: true },
  cloudflare: { kv: true, runtime: 'edge' }
}
```

### 6. Benchmark Build Performance
```bash
time npm run build
# Target: < 2 seconds
ls -lh .vinext/dist/client/
# Target: < 75 KB total
```

### 7. Deploy Preview
```bash
vinext deploy --preview
curl https://swarm-preview.workers.dev/api/health
```

## Acceptance Criteria
- [ ] npm audit shows 0 critical, 0 high severity in vinext
- [ ] vinext installed and configured
- [ ] Development server starts with instant HMR
- [ ] Production build completes in < 2 seconds
- [ ] Bundle size < 75 KB gzipped
- [ ] All Next.js App Router features working
- [ ] Preview deployed to Cloudflare Workers
- [ ] Authentication (NextAuth) functional
- [ ] All API routes functional
- [ ] Zero breaking changes

## Deliverables
- `vinext.config.js` — Cloudflare-optimized config
- `package.json` — Updated scripts
- Preview URL: `https://swarm-preview.workers.dev`

## Testing Requirements
- [ ] All existing tests pass with vinext
- [ ] HMR working in dev mode
- [ ] Production build output verified
- [ ] Security audit passed

## Documentation Updates
- Update `README.md` with vinext setup
- Add `docs/VINEXT-MIGRATION.md`
- Update `DEPLOYMENT.md` for Cloudflare Workers

## Rollback Plan
1. Keep `next.config.backup.js` during migration
2. Revert `package.json` scripts to original
3. Deploy to Vercel as fallback: `vercel deploy`
4. Remove vinext: `npm uninstall vinext`
