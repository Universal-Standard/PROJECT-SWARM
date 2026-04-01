# Workflow Versioning

**Status**: ✅ Fully Implemented (Phase 3A)

Git-like version control for your workflows. Never lose work, track changes, and roll back when needed.

## Features

- 📝 Save workflow versions with messages
- 🏷️ Tag important versions (v1.0.0, production, etc.)
- 🔄 Restore previous versions
- 📊 View version history
- 🔍 Compare versions (coming soon)

## Quick Start

### 1. Create a Version

```http
POST /api/workflows/:workflowId/versions
Content-Type: application/json

{
  "message": "Added error handling to email agent",
  "tag": "v1.2.0"
}
```

**When to create versions:**

- Before major changes
- Before deploying to production
- After adding new features
- At release milestones

### 2. View Version History

```http
GET /api/workflows/:workflowId/versions
```

**Response:**

```json
{
  "versions": [
    {
      "id": 3,
      "workflowId": 1,
      "versionNumber": 3,
      "message": "Added error handling",
      "tag": "v1.2.0",
      "createdBy": 1,
      "createdAt": "2025-01-15T10:30:00.000Z",
      "snapshot": {...}
    },
    {
      "id": 2,
      "versionNumber": 2,
      "message": "Improved agent prompts",
      "tag": "v1.1.0",
      "createdAt": "2025-01-10T14:20:00.000Z"
    }
  ]
}
```

### 3. Restore a Version

```http
POST /api/workflows/:workflowId/versions/:versionId/restore
```

**What happens:**

1. Current workflow is saved as a new version (auto-saved)
2. Selected version becomes the active workflow
3. All agents, edges, and configuration are restored

## Use Cases

### Experiment Safely

```
1. Create version: "Before testing new approach"
2. Make experimental changes
3. Test the changes
4. If unsuccessful: restore previous version
5. If successful: create new version with results
```

### Team Collaboration

```
Developer A creates version: "Baseline v1"
Developer B makes changes, creates: "Added sentiment analysis"
Developer C reviews both versions
Team decides which version to use
```

### Production Deployments

```
1. Tag version: "production-candidate"
2. Test thoroughly
3. If tests pass: tag "production"
4. Deploy
5. If issues found: restore previous "production" version
```

## Best Practices

### Version Messages

✅ **Good messages:**

- "Added retry logic for API calls"
- "Fixed workflow loop causing infinite execution"
- "Optimized prompts for better responses"

❌ **Bad messages:**

- "update"
- "fix"
- "changed stuff"

### Tagging Strategy

**Semantic Versioning:**

- `v1.0.0` - Major release
- `v1.1.0` - New features
- `v1.1.1` - Bug fixes

**Environment Tags:**

- `production` - Live version
- `staging` - Testing version
- `development` - Work in progress

**Milestone Tags:**

- `demo-2025-01-15` - Specific demo version
- `client-review` - Version for client approval

### When to Create Versions

**Create versions when:**

- ✅ About to make major changes
- ✅ Completing a feature
- ✅ Before deploying
- ✅ End of day/week (backup)

**Don't create versions for:**

- ❌ Every tiny change
- ❌ Experimental tweaks
- ❌ Typo fixes

Aim for **meaningful versions** not excessive versions.

## Implementation Details

### Database Schema

```sql
CREATE TABLE workflow_versions (
  id SERIAL PRIMARY KEY,
  workflow_id INTEGER REFERENCES workflows(id),
  version_number INTEGER,
  message TEXT,
  tag VARCHAR(255),
  snapshot JSONB,  -- Complete workflow state
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Snapshot Contents

Each version stores:

```json
{
  "name": "Workflow name",
  "description": "Workflow description",
  "agents": [...],  // All agents with config
  "edges": [...],   // All connections
  "settings": {...} // Workflow settings
}
```

## API Reference

See [API Documentation](../API.md#workflow-versioning) for complete API details.

## Troubleshooting

### "Version not found"

- Check version ID is correct
- Ensure version belongs to your workflow

### "Cannot restore version"

- Version may be corrupted
- Try creating new version first
- Contact support if persists

### "Too many versions"

- Consider deleting old versions
- Keep only tagged/important versions
- Versions don't impact performance

## Related Features

- [Workflow Scheduling](./WORKFLOW_SCHEDULING.md) - Automate version deployments
- [Webhooks](./WEBHOOKS.md) - Get notified on version changes
- [Cost Tracking](./COST_TRACKING.md) - Track costs per version

## Examples

### CLI Workflow

```bash
# Save current state
curl -X POST http://localhost:5000/api/workflows/1/versions \
  -H "Content-Type: application/json" \
  -d '{"message":"Before refactoring","tag":"pre-refactor"}'

# Make changes...
# Test changes...

# If good, tag for production
curl -X POST http://localhost:5000/api/workflows/1/versions \
  -H "Content-Type: application/json" \
  -d '{"message":"Refactored agents","tag":"production"}'

# If bad, restore previous
curl -X POST http://localhost:5000/api/workflows/1/versions/5/restore
```

### TypeScript SDK

```typescript
import { swarmClient } from "@/lib/swarm-client";

// Create version
await swarmClient.workflows.createVersion(workflowId, {
  message: "Added error handling",
  tag: "v1.2.0",
});

// List versions
const versions = await swarmClient.workflows.listVersions(workflowId);

// Restore version
await swarmClient.workflows.restoreVersion(workflowId, versionId);
```

## Need Help?

- 📖 [API Documentation](../API.md)
- 💬 [GitHub Issues](https://github.com/Universal-Standard/PROJECT-SWARM/issues)
- 🐛 [Troubleshooting Guide](../guides/TROUBLESHOOTING.md)
