# Contributing to PROJECT-SWARM

Thank you for your interest in contributing to PROJECT-SWARM! This document provides guidelines and instructions for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Documentation](#documentation)

---

## 🤝 Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful, constructive, and professional in all interactions.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.16.0 or higher (check version: `node --version`)
- PostgreSQL database (local or cloud)
- Git for version control
- AI provider API keys (OpenAI, Anthropic, or Google Gemini)

### First Time Setup

1. **Fork the repository** on GitHub
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR-USERNAME/PROJECT-SWARM.git
   cd PROJECT-SWARM
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/UniversalStandards/PROJECT-SWARM.git
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

6. **Set up database**:
   ```bash
   npm run db:push
   ```

7. **Start development server**:
   ```bash
   npm run dev
   ```

8. **Verify setup**: Visit http://localhost:5000

---

## 💻 Development Setup

### Recommended Tools

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - GitLens

### Project Structure

```
PROJECT-SWARM/
├── client/           # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities
├── server/           # Express backend
│   ├── routes/       # API route handlers
│   ├── ai/           # AI orchestration
│   ├── lib/          # Server utilities
│   └── middleware/   # Express middleware
├── shared/           # Shared types & schemas
├── docs/             # Documentation
└── workflows/        # SWARM workflow templates
```

---

## 🔄 Development Workflow

### Creating a New Feature

1. **Update your fork**:
   ```bash
   git checkout main
   git pull upstream main
   git push origin main
   ```

2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following coding standards

4. **Test your changes**:
   ```bash
   npm run check        # Type checking
   npm test             # Run tests (when available)
   npm run build        # Ensure build works
   ```

5. **Commit your changes** (see commit guidelines below)

6. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

### Keeping Your Branch Updated

```bash
git checkout main
git pull upstream main
git checkout feature/your-feature-name
git rebase main
```

If conflicts occur, resolve them and continue:
```bash
git rebase --continue
```

---

## 📝 Coding Standards

### TypeScript

- **Use TypeScript** for all new code (`.ts` and `.tsx` files)
- **Define types** explicitly; avoid `any` unless absolutely necessary
- **Use interfaces** for object shapes
- **Export types** from `shared/schema.ts` when applicable

### Code Style

- **Indentation**: 2 spaces
- **Quotes**: Double quotes for strings
- **Semicolons**: Required
- **Line length**: Maximum 100 characters (soft limit)
- **File naming**:
  - Components: `PascalCase.tsx` (e.g., `WorkflowBuilder.tsx`)
  - Utilities: `kebab-case.ts` (e.g., `workflow-validator.ts`)
  - Pages: `kebab-case.tsx` (e.g., `app-workflows.tsx`)

### React Components

- **Use functional components** with hooks
- **Prefer named exports** over default exports
- **Keep components small** (< 200 lines preferred)
- **Extract custom hooks** for reusable logic
- **Use TypeScript interfaces** for props

Example:
```typescript
interface WorkflowCardProps {
  workflow: Workflow;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WorkflowCard({ workflow, onEdit, onDelete }: WorkflowCardProps) {
  // Component implementation
}
```

### Backend Code

- **Use async/await** instead of callbacks
- **Handle errors** with try/catch blocks
- **Validate input** using Zod schemas from `shared/schema.ts`
- **Use Drizzle ORM** for database queries (no raw SQL)
- **Add logging** for debugging (but remove before committing)

Example:
```typescript
app.post('/api/workflows', isAuthenticated, async (req, res) => {
  try {
    const validated = insertWorkflowSchema.parse(req.body);
    const workflow = await storage.createWorkflow({
      ...validated,
      userId: req.user.id
    });
    res.json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ message: 'Failed to create workflow' });
  }
});
```

### Database Schemas

- **Use Drizzle ORM** schema definitions in `shared/schema.ts`
- **Add Zod validators** using `createInsertSchema`
- **Include comments** for complex fields
- **Use appropriate types** (text, integer, jsonb, etc.)

---

## 📝 Commit Guidelines

### Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding or updating tests
- **chore**: Maintenance tasks

### Examples

```bash
# Good commits
feat(workflow): add conditional logic nodes
fix(auth): resolve session expiration issue
docs(api): add OpenAPI specification
refactor(routes): split routes.ts into modules
test(executor): add unit tests for AI executor

# Bad commits
update stuff
fix bug
WIP
asdf
```

### Commit Best Practices

- **One logical change** per commit
- **Present tense** ("add feature" not "added feature")
- **Imperative mood** ("move cursor to..." not "moves cursor to...")
- **Descriptive subject** (50 characters or less)
- **Detailed body** if necessary (wrap at 72 characters)
- **Reference issues** in footer (`Fixes #123`, `Closes #456`)

---

## 🔀 Pull Request Process

### Before Submitting

- [ ] Code follows project coding standards
- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation is updated if needed
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with main

### PR Title Format

Follow conventional commits format:
```
feat(workflow-builder): add drag-and-drop support
fix(execution): resolve race condition in orchestrator
docs(deployment): update Cloudflare Workers guide
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Motivation
Why is this change needed? What problem does it solve?

## Changes
- List of changes made
- Another change
- Yet another change

## Testing
How was this tested? What test cases were covered?

## Screenshots (if applicable)
Include screenshots for UI changes

## Checklist
- [ ] Code follows coding standards
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Process

1. **Automated checks** must pass (when CI is set up)
2. **At least one approval** required from maintainers
3. **Address feedback** from reviewers
4. **Squash commits** if requested
5. **Rebase on main** before merging

### After Merging

- Delete your feature branch (GitHub will prompt)
- Update your local main:
  ```bash
  git checkout main
  git pull upstream main
  git push origin main
  ```

---

## 🧪 Testing

### Test Structure

- **Unit tests**: Test individual functions/components
- **Integration tests**: Test API endpoints and database interactions
- **E2E tests**: Test user flows in the browser

### Running Tests

```bash
# Run all tests (when implemented)
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

Use descriptive test names:

```typescript
describe('WorkflowValidator', () => {
  it('should validate a valid workflow', () => {
    // Test implementation
  });

  it('should reject workflow with circular dependencies', () => {
    // Test implementation
  });

  it('should reject workflow with missing required fields', () => {
    // Test implementation
  });
});
```

---

## 📚 Documentation

### When to Update Documentation

- **New features**: Document in appropriate `/docs` file
- **API changes**: Update OpenAPI spec (when generated)
- **Breaking changes**: Document in CHANGELOG.md
- **Setup changes**: Update GETTING_STARTED.md or README.md
- **Configuration changes**: Update .env.example

### Documentation Style

- **Clear and concise**: Use simple language
- **Code examples**: Include practical examples
- **Screenshots**: Add for UI features
- **Links**: Cross-reference related docs
- **Keep updated**: Docs should match code

### Documentation Structure

```
docs/
├── deployment/          # Deployment guides
├── development/         # Technical docs
├── features/            # Feature documentation
├── guides/              # User guides
├── project-management/  # Project management
└── reviews/             # Code reviews
```

---

## ❓ Questions?

- **Documentation**: Check [/docs](./docs/) first
- **Issues**: Search [existing issues](https://github.com/UniversalStandards/PROJECT-SWARM/issues)
- **Discussions**: Join [GitHub Discussions](https://github.com/UniversalStandards/PROJECT-SWARM/discussions)
- **Contact**: Open a new issue for questions

---

## 🙏 Thank You!

Your contributions make PROJECT-SWARM better for everyone. We appreciate your time and effort!

**Happy coding!** 🚀
