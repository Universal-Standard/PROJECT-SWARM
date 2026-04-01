# Testing Documentation

This directory contains all tests for PROJECT-SWARM.

## Test Structure

```
tests/
├── setup.ts                 # Global test configuration
├── utils/                   # Test utilities and helpers
│   └── test-helpers.ts      # Mock factories and utilities
├── e2e/                     # End-to-end tests (Playwright)
│   └── *.spec.ts
server/
└── **/__tests__/           # Server-side unit/integration tests (Vitest)
    └── *.test.ts
client/
└── **/__tests__/           # Client-side component tests (Vitest + Testing Library)
    └── *.test.tsx
```

## Running Tests

```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Writing Tests

### Unit Tests (Vitest)

```typescript
import { describe, it, expect } from "vitest";

describe("MyFunction", () => {
  it("should do something", () => {
    expect(myFunction()).toBe(expected);
  });
});
```

### Component Tests (React Testing Library)

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MyComponent } from "../MyComponent";

it("should render correctly", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

### API Tests (Supertest)

```typescript
import request from "supertest";
import { app } from "../app";

it("should return 200", async () => {
  const response = await request(app).get("/api/endpoint");
  expect(response.status).toBe(200);
});
```

### E2E Tests (Playwright)

```typescript
import { test, expect } from "@playwright/test";

test("should navigate to page", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Expected Title/);
});
```

## Test Coverage

Current coverage targets (configured in vitest.config.ts):

- Lines: 90%
- Functions: 90%
- Branches: 90%
- Statements: 90%

View coverage report after running:

```bash
npm run test:coverage
open coverage/index.html
```

## Testing Strategy

### What to Test

1. **Server Routes** (`server/routes/**`)
   - All API endpoints
   - Request validation
   - Response format
   - Error handling
   - Authentication/authorization

2. **Server Libraries** (`server/lib/**`)
   - Cost tracking
   - Workflow scheduling
   - Webhook handling
   - Workflow versioning
   - AI provider integrations

3. **React Components** (`client/**`)
   - Rendering behavior
   - User interactions
   - State management
   - Props validation
   - Accessibility

4. **Database Operations** (`shared/schema.ts`)
   - CRUD operations
   - Query correctness
   - Migrations
   - Constraints

5. **Critical Flows** (E2E)
   - User authentication
   - Workflow creation
   - Workflow execution
   - Agent communication
   - WebSocket real-time updates

### Test Patterns

#### Arrange-Act-Assert (AAA)

```typescript
it("should increment counter", () => {
  // Arrange
  const counter = new Counter(0);

  // Act
  counter.increment();

  // Assert
  expect(counter.value).toBe(1);
});
```

#### Given-When-Then (BDD)

```typescript
it("should allow user to create workflow", async () => {
  // Given user is logged in
  await loginUser();

  // When user creates a workflow
  const workflow = await createWorkflow({ name: "Test" });

  // Then workflow should exist
  expect(workflow.id).toBeDefined();
});
```

## Mocking

### AI API Mocking (MSW)

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

const server = setupServer(
  http.post("https://api.openai.com/v1/chat/completions", () => {
    return HttpResponse.json({
      choices: [{ message: { content: "Mocked response" } }],
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Database Mocking

Use test utilities from `tests/utils/test-helpers.ts`:

```typescript
import { createMockDbResult } from "../../tests/utils/test-helpers";

const mockWorkflows = createMockDbResult([
  { id: 1, name: "Workflow 1" },
  { id: 2, name: "Workflow 2" },
]);
```

## CI/CD Integration

Tests run automatically on:

- Pull requests
- Pushes to main
- Pre-deployment

## TODO: Additional Tests Needed

Based on deep dive findings, we need tests for:

- [ ] All 17 database tables
- [ ] Existing Phase 3A features:
  - [ ] Workflow versioning (server/lib/workflow-version.ts)
  - [ ] Workflow scheduling (server/lib/scheduler.ts)
  - [ ] Webhook system (server/lib/webhooks.ts)
  - [ ] Cost tracking (server/lib/cost-tracker.ts)
- [ ] All server routes and middleware
- [ ] All React components
- [ ] Authentication flows
- [ ] AI provider integrations (OpenAI, Anthropic, Gemini)
- [ ] WebSocket communication
- [ ] Error handling and edge cases

**Goal**: 0% → 90%+ test coverage
