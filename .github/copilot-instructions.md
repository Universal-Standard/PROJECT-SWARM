# GitHub Copilot Instructions for PROJECT-SWARM

## Project Context

PROJECT-SWARM is an AI workflow orchestration platform built with:
- **Frontend**: React 18, TypeScript, Vite, ReactFlow, TailwindCSS
- **Backend**: Node.js 22, Express, TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **AI Providers**: OpenAI, Anthropic Claude, Google Gemini

## Code Style Guidelines

### TypeScript
- Use strict TypeScript types, avoid `any`
- Prefer interfaces over types for object shapes
- Use explicit return types for functions
- Import types with `import type` syntax

```typescript
// Good
import type { Workflow } from '@/types';
function getWorkflow(id: string): Promise<Workflow> { }

// Avoid
function getWorkflow(id: any): any { }
```

### React Components
- Use functional components with hooks
- Prefer named exports over default exports
- Use TypeScript for props
- Extract complex logic to custom hooks

```typescript
// Good
export function WorkflowBuilder({ workflowId }: WorkflowBuilderProps) {
  const { workflow, loading } = useWorkflow(workflowId);
  // ...
}

// Avoid
export default function WorkflowBuilder(props: any) { }
```

### API Routes
- Use RESTful conventions
- Validate inputs with Zod schemas
- Use proper HTTP status codes
- Include error handling

```typescript
// Good
app.post('/api/workflows', async (req, res) => {
  try {
    const data = insertWorkflowSchema.parse(req.body);
    const workflow = await db.insert(workflows).values(data);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

### Database
- Use Drizzle ORM for all database operations
- Define schemas in `shared/schema.ts`
- Use transactions for multi-step operations
- Always handle errors

```typescript
// Good
const result = await db.transaction(async (tx) => {
  const workflow = await tx.insert(workflows).values(data);
  const nodes = await tx.insert(workflowNodes).values(nodeData);
  return { workflow, nodes };
});
```

## Naming Conventions

### Files
- Components: `PascalCase.tsx` (e.g., `WorkflowBuilder.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useWorkflow.ts`)
- Utils: `kebab-case.ts` (e.g., `workflow-utils.ts`)
- Types: `PascalCase.ts` (e.g., `Workflow.ts`)

### Variables
- camelCase for variables and functions
- PascalCase for components and types
- SCREAMING_SNAKE_CASE for constants
- Descriptive names, avoid abbreviations

```typescript
// Good
const workflowExecutor = new WorkflowExecutor();
const MAX_RETRY_ATTEMPTS = 3;

// Avoid
const we = new WE();
const max = 3;
```

## Component Structure

Follow this structure for React components:

```typescript
// 1. Imports
import { useState } from 'react';
import type { Workflow } from '@/types';
import { Button } from '@/components/ui/button';

// 2. Types
interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (id: string) => void;
}

// 3. Component
export function WorkflowCard({ workflow, onEdit }: WorkflowCardProps) {
  // 4. Hooks
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 5. Event handlers
  const handleEdit = () => {
    onEdit(workflow.id);
  };
  
  // 6. Render
  return (
    <div className="workflow-card">
      {/* JSX */}
    </div>
  );
}
```

## AI Integration Guidelines

### When Adding AI Provider Support
- Implement in `server/ai/` directory
- Follow existing provider pattern (OpenAI, Anthropic, Gemini)
- Support streaming and non-streaming modes
- Include error handling and retries
- Add cost tracking

### Workflow Execution
- Always validate workflow before execution
- Use topological sort for node execution order
- Pass context between agents
- Store execution logs and results
- Handle partial failures gracefully

## Error Handling

### Frontend
```typescript
// Use error boundaries for component errors
<ErrorBoundary fallback={<ErrorFallback />}>
  <WorkflowBuilder />
</ErrorBoundary>

// Use try-catch for async operations
try {
  const data = await fetchWorkflow(id);
} catch (error) {
  toast.error('Failed to load workflow');
  console.error(error);
}
```

### Backend
```typescript
// Use middleware for error handling
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error'
  });
});

// Validate inputs
const schema = z.object({ id: z.string() });
const { id } = schema.parse(req.params);
```

## Testing

### Write Tests For
- Utility functions
- Complex business logic
- API endpoints
- React hooks
- Component interactions

```typescript
// Example test
describe('WorkflowValidator', () => {
  it('should detect cycles in workflow', () => {
    const workflow = createWorkflowWithCycle();
    const validator = new WorkflowValidator(workflow);
    expect(validator.hasCycles()).toBe(true);
  });
});
```

## Performance

### Optimization Tips
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Debounce user input handlers
- Use useMemo and useCallback appropriately
- Lazy load routes and components

```typescript
// Good
const MemoizedWorkflowNode = React.memo(WorkflowNode);

const handleSearch = useMemo(
  () => debounce((query: string) => {
    // Search logic
  }, 300),
  []
);
```

## Security

### Always
- Sanitize user input
- Validate on both client and server
- Use parameterized queries (Drizzle handles this)
- Never expose API keys in frontend
- Implement rate limiting
- Use HTTPS in production

```typescript
// Good - Server-side validation
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email()
});
const data = schema.parse(req.body);

// Bad - Trusting client input
const data = req.body; // No validation!
```

## Documentation

### Code Comments
- Add JSDoc comments for public functions
- Explain "why" not "what"
- Document complex algorithms
- Add TODO comments for future work

```typescript
/**
 * Executes a workflow using topological sort to determine node order.
 * Handles agent coordination and context passing between nodes.
 * 
 * @param workflowId - The ID of the workflow to execute
 * @param inputs - Initial input data for the workflow
 * @returns Execution result with outputs and logs
 */
export async function executeWorkflow(
  workflowId: string,
  inputs: Record<string, any>
): Promise<ExecutionResult> {
  // Implementation
}
```

## Git Workflow

### Commit Messages
Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Formatting changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

```bash
# Good
git commit -m "feat(workflow): add cycle detection validation"
git commit -m "fix(execution): handle AI provider timeout"
git commit -m "docs(api): update endpoint documentation"

# Avoid
git commit -m "fixed stuff"
git commit -m "wip"
```

### Branch Naming
```bash
feature/issue-number-description
fix/issue-number-description
docs/issue-number-description
refactor/issue-number-description

# Examples
feature/123-add-workflow-versioning
fix/456-github-auth-token-refresh
docs/789-api-reference-update
```

## Project-Specific Patterns

### Workflow Builder
- Use ReactFlow for visual editor
- Store nodes and edges in state
- Sync to backend on changes
- Auto-layout when requested

### Execution Engine
- Validate before execution
- Use topological sort for order
- Stream logs via WebSocket
- Store results in database

### AI Providers
- Abstract provider interface
- Support multiple models
- Track costs per execution
- Implement fallback logic

### Templates
- Store as JSON in database
- Version templates
- Allow customization
- Provide preview

## Common Tasks

### Adding a New AI Provider
1. Create `server/ai/providers/new-provider.ts`
2. Implement `AIProvider` interface
3. Add to `server/ai/index.ts`
4. Update `server/routes.ts` with endpoints
5. Add UI controls in `client/src/components/`
6. Update documentation

### Adding a New Node Type
1. Define type in `shared/types.ts`
2. Add executor in `server/execution/`
3. Create UI component in `client/src/components/nodes/`
4. Register in `client/src/utils/node-registry.ts`
5. Add to palette
6. Write tests

### Adding a New Feature
1. Check docs/project-management/PROJECT_BOARD.md for requirements
2. Create feature branch
3. Implement with tests
4. Update documentation
5. Create PR with template
6. Link to issue

## Helpful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run check           # TypeScript check
npm run db:push         # Push schema to database

# Testing
npm test                # Run tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report

# Database
npm run db:studio       # Open Drizzle Studio
npm run db:generate     # Generate migrations
```

## Resources

- [PROJECT_BOARD.md](../docs/project-management/PROJECT_BOARD.md) - Feature roadmap
- [README.md](../README.md) - Project overview
- [FEATURES_ROADMAP.md](../docs/architecture/FEATURES_ROADMAP.md) - Detailed features
- [docs/](../docs/) - Additional documentation

## When Suggesting Code

1. **Follow existing patterns** in the codebase
2. **Use proper types** - no `any` without good reason
3. **Handle errors** - don't assume success
4. **Add comments** for complex logic
5. **Consider performance** - optimize when needed
6. **Think security** - validate and sanitize
7. **Write tests** - especially for business logic
8. **Update docs** - if adding new features

## Questions to Ask

Before implementing, consider:
- Is this consistent with existing code?
- Does this need error handling?
- Should this be tested?
- Does this affect performance?
- Are there security implications?
- Does documentation need updating?
- Is this the simplest solution?

## Code Review Checklist

When reviewing Copilot suggestions:
- ✅ Types are correct and specific
- ✅ Error handling is present
- ✅ No security vulnerabilities
- ✅ Follows project conventions
- ✅ Performance is acceptable
- ✅ Code is readable
- ✅ Tests are included (if needed)
- ✅ Documentation is updated (if needed)
