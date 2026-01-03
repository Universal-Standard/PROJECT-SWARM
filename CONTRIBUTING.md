# Contributing to PROJECT-SWARM

Thank you for your interest in contributing to PROJECT-SWARM! This document provides guidelines and instructions for contributing to the project.

## 🤝 Ways to Contribute

We welcome all types of contributions:

- 🐛 **Report bugs** via [GitHub Issues](https://github.com/Universal-Standard/PROJECT-SWARM/issues)
- 💡 **Suggest features** via [GitHub Discussions](https://github.com/Universal-Standard/PROJECT-SWARM/discussions)
- 📝 **Improve documentation** - Fix typos, add examples, clarify instructions
- 🔧 **Submit pull requests** - Fix bugs, implement features, improve code
- ⭐ **Star the repository** - Help others discover the project
- 🧪 **Write tests** - Improve test coverage
- 🎨 **Improve UI/UX** - Design suggestions and implementations

## 📋 Before You Start

1. **Check existing issues** to avoid duplicate work
2. **Read the documentation**:
   - [README.md](./README.md) - Project overview
   - [GETTING_STARTED.md](./GETTING_STARTED.md) - Setup guide
   - [GitHub Copilot Instructions](./.github/copilot-instructions.md) - Code style and conventions
3. **Join discussions** for major changes before starting work

## 🚀 Getting Started

### 1. Set Up Your Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/PROJECT-SWARM.git
cd PROJECT-SWARM

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up database
npm run db:push

# Start development server
npm run dev
```

### 2. Create a Branch

Use descriptive branch names following this convention:

```bash
# Feature branches
git checkout -b feature/<issue-number>-<short-description>
# Example: git checkout -b feature/123-add-workflow-versioning

# Bug fix branches
git checkout -b fix/<issue-number>-<short-description>
# Example: git checkout -b fix/456-github-auth-token-refresh

# Documentation branches
git checkout -b docs/<issue-number>-<short-description>
# Example: git checkout -b docs/789-api-reference-update
```

### 3. Make Your Changes

Follow our coding standards documented in [GitHub Copilot Instructions](./.github/copilot-instructions.md):

- **TypeScript**: Use strict types, avoid `any`, use explicit return types
- **React**: Use functional components with hooks, named exports
- **API Routes**: RESTful conventions, Zod validation, proper error handling
- **Database**: Use Drizzle ORM, transactions for multi-step operations
- **Testing**: Write tests for utility functions, business logic, and API endpoints
- **Security**: Validate inputs, sanitize data, never expose API keys

### 4. Test Your Changes

```bash
# Type checking
npm run check

# Build to ensure no errors
npm run build

# Test the application manually
npm run dev
```

**Note**: Unit tests are not yet implemented. For now, test changes manually by running the application and verifying functionality.

### 5. Commit Your Changes

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: <type>(<scope>): <subject>
#
# Types: feat, fix, docs, style, refactor, test, chore

# Examples:
git commit -m "feat(workflow): add cycle detection validation"
git commit -m "fix(execution): handle AI provider timeout"
git commit -m "docs(api): update endpoint documentation"
git commit -m "test(workflow): add validation tests"
```

**Good commit messages:**
- Explain **what** changed and **why**
- Reference issue numbers: `Closes #123`, `Part of #456`
- Keep subject line under 72 characters
- Use imperative mood: "add" not "added"

**Avoid:**
- Vague messages: "fixed stuff", "wip", "updates"
- Missing context or references

### 6. Push and Create Pull Request

```bash
# Push your branch
git push origin feature/123-add-workflow-versioning

# Create Pull Request on GitHub
```

## 📝 Pull Request Guidelines

### PR Title

Use the same format as commit messages:

```
feat(workflow): Add cycle detection validation
fix(execution): Handle AI provider timeout errors
docs(api): Update REST API documentation
```

### PR Description

Include:

1. **Summary**: What does this PR do?
2. **Related Issue**: `Closes #123` or `Fixes #456`
3. **Changes Made**: Bullet list of main changes
4. **Testing**: How was this tested?
5. **Screenshots**: For UI changes (required)
6. **Breaking Changes**: Any breaking changes? (if applicable)
7. **Checklist**: Use the PR template checklist

**Example:**

```markdown
## Summary
Adds cycle detection to workflow validation to prevent infinite loops.

Closes #123

## Changes Made
- Implement topological sort algorithm
- Add cycle detection in WorkflowValidator
- Update validation error messages
- Add unit tests for cycle detection

## Testing
- Unit tests for cycle detection
- Manual testing with circular workflow
- Tested with complex multi-node workflows

## Screenshots
N/A (backend change)

## Checklist
- [x] Code follows project conventions
- [x] Tests added/updated
- [x] Documentation updated
- [x] No breaking changes
- [x] TypeScript checks pass
```

### PR Review Process

1. **Automated checks** must pass (linting, type checking, tests)
2. **Code review** by maintainers (usually 1-2 days)
3. **Address feedback** - Make requested changes
4. **Approval & Merge** - Maintainer merges when approved

## 🎨 Code Style

We follow strict code style guidelines to maintain consistency. Please read our [GitHub Copilot Instructions](./.github/copilot-instructions.md) for detailed guidelines.

### Key Principles

1. **Type Safety**: Use TypeScript strictly, avoid `any`
2. **Readability**: Write self-documenting code with clear names
3. **Consistency**: Follow existing patterns in the codebase
4. **Simplicity**: Prefer simple solutions over clever ones
5. **Testing**: Write tests for business logic
6. **Security**: Validate inputs, sanitize outputs
7. **Performance**: Optimize when needed, but don't prematurely optimize

### File Naming

- Components: `PascalCase.tsx` (e.g., `WorkflowBuilder.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useWorkflow.ts`)
- Utils: `kebab-case.ts` (e.g., `workflow-utils.ts`)
- Types: `PascalCase.ts` (e.g., `Workflow.ts`)

### Variable Naming

- camelCase for variables and functions
- PascalCase for components and types
- SCREAMING_SNAKE_CASE for constants

## 🧪 Testing Guidelines

### What to Test

- ✅ Utility functions
- ✅ Complex business logic
- ✅ API endpoints
- ✅ React hooks
- ✅ Component interactions
- ✅ Error handling
- ✅ Edge cases

### What Not to Test

- ❌ Third-party libraries
- ❌ Simple getters/setters
- ❌ Type definitions

### Test Structure

```typescript
describe('ComponentName or FunctionName', () => {
  describe('specific functionality', () => {
    it('should behave in a specific way', () => {
      // Arrange
      const input = createTestData();
      
      // Act
      const result = functionUnderTest(input);
      
      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

## 🔒 Security Guidelines

### Always

- ✅ Validate all user input
- ✅ Sanitize data before output
- ✅ Use parameterized queries (Drizzle handles this)
- ✅ Never expose API keys or secrets
- ✅ Implement proper authentication
- ✅ Use HTTPS in production
- ✅ Follow OWASP security practices

### Never

- ❌ Trust client-side data without validation
- ❌ Store sensitive data in client-side code
- ❌ Use `eval()` or similar dangerous functions
- ❌ Commit secrets to the repository
- ❌ Use deprecated or insecure dependencies

## 📚 Documentation Guidelines

### Code Comments

- Add JSDoc comments for public functions
- Explain **why**, not **what** (code should be self-explanatory)
- Document complex algorithms
- Add TODO comments for future improvements

```typescript
/**
 * Executes a workflow using topological sort to determine node order.
 * Handles agent coordination and context passing between nodes.
 * 
 * @param workflowId - The ID of the workflow to execute
 * @param inputs - Initial input data for the workflow
 * @returns Execution result with outputs and logs
 * @throws {ValidationError} If workflow has cycles
 * @throws {ExecutionError} If execution fails
 */
export async function executeWorkflow(
  workflowId: string,
  inputs: Record<string, any>
): Promise<ExecutionResult> {
  // Implementation
}
```

### README Updates

Update relevant documentation when:
- Adding new features
- Changing API endpoints
- Modifying configuration
- Adding dependencies
- Changing deployment process

## 🐛 Bug Reports

When reporting bugs, include:

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, Node version, browser, etc.
6. **Screenshots**: If applicable
7. **Error Messages**: Full error messages or logs

## 💡 Feature Requests

When suggesting features:

1. **Problem**: What problem does this solve?
2. **Solution**: Your proposed solution
3. **Alternatives**: Other solutions you considered
4. **Use Cases**: Real-world examples
5. **Implementation**: Technical approach (optional)

## 📞 Getting Help

- **Questions**: Use [GitHub Discussions](https://github.com/Universal-Standard/PROJECT-SWARM/discussions)
- **Bugs**: Open an [Issue](https://github.com/Universal-Standard/PROJECT-SWARM/issues)
- **Chat**: Join our community chat (if available)
- **Documentation**: Check [docs/](./docs/) directory

## 📖 Additional Resources

- [Project README](./README.md) - Project overview and features
- [Getting Started Guide](./GETTING_STARTED.md) - Setup and workflow
- [GitHub Copilot Instructions](./.github/copilot-instructions.md) - Detailed code guidelines
- [Features Roadmap](./docs/architecture/FEATURES_ROADMAP.md) - Planned features
- [Architecture Docs](./docs/architecture/) - Technical architecture
- [Deployment Guides](./docs/deployment/) - Deployment instructions

## 🎯 Project Priorities

When contributing, consider these priorities:

1. **Security** - Security fixes take highest priority
2. **Bugs** - Bug fixes are important
3. **Performance** - Performance improvements matter
4. **Features** - New features come after stability
5. **Refactoring** - Code quality improvements are continuous
6. **Documentation** - Always welcome!

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Your contributions make PROJECT-SWARM better for everyone. We appreciate your time and effort!

---

**Questions?** Open a discussion or reach out to maintainers.

**Ready to contribute?** Find an issue labeled `good first issue` or `help wanted`!
