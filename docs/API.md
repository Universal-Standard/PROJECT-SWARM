# PROJECT-SWARM API Documentation

Complete API reference for PROJECT-SWARM workflow automation platform.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://your-domain.com`

## Authentication

Most endpoints require authentication via session cookies.

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**

```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "displayName": "User Name"
  }
}
```

### Logout

```http
POST /api/auth/logout
```

## Workflows

### List Workflows

```http
GET /api/workflows
```

**Response:**

```json
{
  "workflows": [
    {
      "id": 1,
      "name": "My Workflow",
      "description": "Workflow description",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Workflow

```http
GET /api/workflows/:id
```

**Response:**

```json
{
  "id": 1,
  "name": "My Workflow",
  "description": "Workflow description",
  "agents": [...],
  "edges": [...],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

### Create Workflow

```http
POST /api/workflows
Content-Type: application/json

{
  "name": "New Workflow",
  "description": "Description",
  "agents": [],
  "edges": []
}
```

### Update Workflow

```http
PUT /api/workflows/:id
Content-Type: application/json

{
  "name": "Updated name",
  "description": "Updated description",
  "agents": [...],
  "edges": [...]
}
```

### Delete Workflow

```http
DELETE /api/workflows/:id
```

## Workflow Executions

### Execute Workflow

```http
POST /api/workflows/:id/execute
Content-Type: application/json

{
  "input": "User input for the workflow"
}
```

**Response:**

```json
{
  "executionId": "exec_123",
  "status": "running"
}
```

### Get Execution Status

```http
GET /api/executions/:executionId
```

**Response:**

```json
{
  "id": "exec_123",
  "workflowId": 1,
  "status": "completed",
  "result": {...},
  "createdAt": "2025-01-01T00:00:00.000Z",
  "completedAt": "2025-01-01T00:05:30.000Z"
}
```

### List Executions

```http
GET /api/executions?workflowId=1&limit=10&offset=0
```

## Workflow Versioning

**Feature Status**: ✅ Implemented (Phase 3A)

### Create Version

```http
POST /api/workflows/:id/versions
Content-Type: application/json

{
  "message": "Version description",
  "tag": "v1.0.0"
}
```

### List Versions

```http
GET /api/workflows/:id/versions
```

### Restore Version

```http
POST /api/workflows/:id/versions/:versionId/restore
```

## Workflow Scheduling

**Feature Status**: ✅ Implemented (Phase 3A)

### Create Schedule

```http
POST /api/workflows/:id/schedules
Content-Type: application/json

{
  "cronExpression": "0 9 * * *",
  "timezone": "America/New_York",
  "enabled": true
}
```

**Cron Examples:**

- `0 9 * * *` - Daily at 9 AM
- `0 */4 * * *` - Every 4 hours
- `0 0 * * 1` - Every Monday at midnight

### List Schedules

```http
GET /api/workflows/:id/schedules
```

### Update Schedule

```http
PUT /api/schedules/:scheduleId
Content-Type: application/json

{
  "enabled": false
}
```

### Delete Schedule

```http
DELETE /api/schedules/:scheduleId
```

## Webhooks

**Feature Status**: ✅ Implemented (Phase 3A)

### Create Webhook

```http
POST /api/workflows/:id/webhooks
Content-Type: application/json

{
  "url": "https://example.com/webhook",
  "events": ["execution.completed", "execution.failed"],
  "secret": "webhook_secret_key"
}
```

**Supported Events:**

- `execution.started`
- `execution.completed`
- `execution.failed`
- `agent.completed`

### List Webhooks

```http
GET /api/workflows/:id/webhooks
```

### Delete Webhook

```http
DELETE /api/webhooks/:webhookId
```

### Webhook Payload Format

```json
{
  "event": "execution.completed",
  "timestamp": "2025-01-01T00:05:30.000Z",
  "workflow": {
    "id": 1,
    "name": "My Workflow"
  },
  "execution": {
    "id": "exec_123",
    "status": "completed",
    "result": {...}
  }
}
```

**Signature Verification:**
Webhooks include an `X-Webhook-Signature` header with HMAC-SHA256 signature.

## Cost Tracking

**Feature Status**: ✅ Implemented (Phase 3A)

### Get Execution Costs

```http
GET /api/executions/:executionId/costs
```

**Response:**

```json
{
  "executionId": "exec_123",
  "totalCost": 0.0234,
  "breakdown": [
    {
      "provider": "openai",
      "model": "gpt-4",
      "inputTokens": 1000,
      "outputTokens": 500,
      "cost": 0.015
    },
    {
      "provider": "anthropic",
      "model": "claude-3-opus",
      "inputTokens": 800,
      "outputTokens": 400,
      "cost": 0.0084
    }
  ]
}
```

### Get Workflow Costs

```http
GET /api/workflows/:id/costs?startDate=2025-01-01&endDate=2025-01-31
```

### Get User Costs

```http
GET /api/user/costs?period=monthly
```

**Period Options:** `daily`, `weekly`, `monthly`, `yearly`, `all-time`

## Templates

### List Templates

```http
GET /api/templates?category=automation&limit=20
```

### Get Template

```http
GET /api/templates/:id
```

### Create Workflow from Template

```http
POST /api/templates/:id/create-workflow
Content-Type: application/json

{
  "name": "My Workflow from Template"
}
```

## Health & Status

### Health Check

```http
GET /health
```

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

### Ready Check

```http
GET /ready
```

### Metrics (Prometheus)

```http
GET /metrics
```

### System Status

```http
GET /status
```

**Response:**

```json
{
  "status": "operational",
  "version": "1.0.0",
  "environment": "production",
  "memory": {
    "used": 512000000,
    "total": 2048000000
  },
  "cpu": {
    "usage": 0.25
  }
}
```

## WebSocket

Real-time execution updates via WebSocket.

**Endpoint:** `ws://localhost:5000`

### Subscribe to Execution

```json
{
  "type": "subscribe",
  "executionId": "exec_123"
}
```

### Execution Events

```json
{
  "type": "execution.update",
  "executionId": "exec_123",
  "status": "running",
  "currentAgent": "agent_2",
  "progress": 0.5
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

**Common HTTP Status Codes:**

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## Rate Limiting

- **Global**: 100 requests per minute per IP
- **Authentication**: 5 failed attempts per minute
- **Execution**: 20 executions per minute per user

Rate limit headers:

- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Pagination

List endpoints support pagination:

```http
GET /api/workflows?limit=20&offset=0
```

**Response includes:**

```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

## API Clients

### JavaScript/TypeScript

```typescript
const response = await fetch("/api/workflows", {
  method: "GET",
  credentials: "include", // Important for session cookies
  headers: {
    "Content-Type": "application/json",
  },
});

const data = await response.json();
```

### cURL

```bash
curl -X GET http://localhost:5000/api/workflows \
  -H "Content-Type: application/json" \
  -b cookies.txt
```

## Need Help?

- 📖 [Getting Started Guide](./guides/GETTING_STARTED.md)
- 🔧 [Troubleshooting Guide](./guides/TROUBLESHOOTING.md)
- 💬 [GitHub Issues](https://github.com/Universal-Standard/PROJECT-SWARM/issues)
