# PROJECT-SWARM Workflows

This directory contains pre-built workflow templates that can be imported into PROJECT-SWARM for execution.

## Available Workflows

### 🔧 [repository-improvement-swarm.json](./repository-improvement-swarm.json)

**Comprehensive Repository Transformation Workflow**

Orchestrates 73 AI agents across 8 parallel tracks to transform the PROJECT-SWARM repository from a strong MVP to an enterprise-grade platform.

**Specifications**:
- **Total Agents**: 73 agents across 8 tracks
- **Execution Time**: ~80 minutes wall-clock time
- **AI Processing Time**: 158 agent-minutes
- **Estimated Cost**: $64 (Claude Sonnet 4.5)
- **Parallelization**: 97.5% efficiency

**Improvements Delivered**:
- ✅ All missing files (LICENSE, .env.example, CONTRIBUTING.md, CHANGELOG.md)
- ✅ Architecture refactoring (split 2,257-line routes.ts into modules)
- ✅ Security hardening (rate limiting, CORS, validation, headers)
- ✅ Complete documentation (OpenAPI, diagrams, guides)
- ✅ 90%+ test coverage (unit, integration, E2E)
- ✅ DevOps infrastructure (Docker, CI/CD, monitoring)
- ✅ Performance optimization (caching, bundle splitting)
- ✅ 25+ new features (error recovery, conditional logic, OAuth2, quotas)

**Execution Tracks**:

1. **Track 1 - File Generation** (15 min, 5 agents)
   - LICENSE, .env.example, CONTRIBUTING.md, CHANGELOG.md, migrations/

2. **Track 2 - Architecture Refactor** (25 min, 8 agents)
   - Split routes.ts, ESLint, Prettier, Husky, error boundaries, health endpoints

3. **Track 3 - Security Hardening** (18 min, 6 agents)
   - Rate limiting, validation, security headers, session audit

4. **Track 4 - Documentation** (20 min, 7 agents)
   - OpenAPI spec, database docs, ER diagram, architecture diagrams

5. **Track 5 - Testing** (30 min, 12 agents) *depends on Track 2*
   - Vitest setup, route tests, component tests, integration tests, E2E tests

6. **Track 6 - DevOps** (15 min, 8 agents)
   - Docker, docker-compose, CI pipeline, security scanning, deployment scripts

7. **Track 7 - Performance** (20 min, 6 agents) *depends on Track 2*
   - Bundle optimization, caching, query optimization, compression

8. **Track 8 - Features** (50 min, 16 agents) *depends on Tracks 1-7*
   - Error recovery, rate limiting/quotas, conditional logic, OAuth2

**Expected Results**:
- **Test Coverage**: 0% → 90%+ (1,000+ tests)
- **Security Score**: B- → A+
- **Performance**: +40% faster
- **Bundle Size**: -30% reduction
- **Features**: 40 → 65+ features

---

## How to Use These Workflows

### Method 1: Import via PROJECT-SWARM UI

1. Navigate to the Workflow Templates page
2. Click "Import Template"
3. Select the workflow JSON file
4. Review the workflow structure
5. Click "Import"
6. Execute the workflow

### Method 2: Import via API

```bash
curl -X POST http://localhost:5000/api/workflows/import \
  -H "Content-Type: application/json" \
  -d @workflows/repository-improvement-swarm.json
```

### Method 3: Manual Creation

1. Open the JSON file
2. Copy the workflow structure
3. Create a new workflow in PROJECT-SWARM
4. Paste the nodes and edges
5. Save and execute

---

## Workflow Execution Tips

### Before Execution

1. **Review the workflow**: Understand what each track does
2. **Check dependencies**: Ensure required services are available (database, Redis, etc.)
3. **Set environment variables**: Configure API keys for AI providers
4. **Backup your repository**: Create a git branch before executing
5. **Review cost estimate**: Ensure you're comfortable with the estimated cost

### During Execution

1. **Monitor progress**: Watch the execution dashboard for real-time updates
2. **Check logs**: Review agent logs for any errors or warnings
3. **Track costs**: Monitor token usage and costs in real-time
4. **Handle failures**: If an agent fails, review the error and retry if needed

### After Execution

1. **Review changes**: Check all generated files and code changes
2. **Run tests**: Execute the test suite to verify all improvements
3. **Build the project**: Ensure the build succeeds
4. **Review metrics**: Compare before/after performance metrics
5. **Commit changes**: Create a git commit with descriptive message
6. **Create PR**: Submit changes for review (if working in a team)

---

## Customizing Workflows

You can customize these workflows to fit your needs:

### Modify Agent Count

Reduce or increase the number of parallel agents based on your budget:

```json
{
  "data": {
    "parallelAgents": 5  // Reduce from default
  }
}
```

### Change AI Models

Switch between different AI models based on cost/performance trade-offs:

```json
{
  "data": {
    "provider": "anthropic",
    "model": "claude-3-5-haiku-20241022"  // Cheaper, faster
  }
}
```

Options:
- `claude-3-5-sonnet-20241022` - Best quality (recommended)
- `claude-3-5-haiku-20241022` - Faster, cheaper
- `gpt-4` - Alternative provider
- `gemini-1.5-flash` - Fastest, cheapest

### Adjust Temperature

Control creativity vs consistency:

```json
{
  "data": {
    "temperature": 30  // More consistent (0-100)
  }
}
```

- **0-30**: Highly consistent, deterministic (recommended for code generation)
- **30-50**: Balanced creativity and consistency
- **50-70**: More creative, less predictable
- **70-100**: Highly creative, experimental

### Skip Tracks

Remove tracks you don't need by deleting the corresponding nodes and edges:

```json
{
  "nodes": [
    // Remove the track node you don't want
  ],
  "edges": [
    // Remove edges connected to that track
  ]
}
```

---

## Creating Your Own Workflows

To create a new workflow template:

1. **Design the workflow** in PROJECT-SWARM UI
2. **Export as JSON** via the export button
3. **Add metadata** (description, estimated cost, etc.)
4. **Test the workflow** on a sample project
5. **Save to this directory** with a descriptive name
6. **Update this README** with workflow documentation

---

## Workflow Best Practices

### Agent Design

1. **Single Responsibility**: Each agent should have one clear task
2. **Clear Instructions**: Provide detailed system prompts
3. **Appropriate Model**: Use cheaper models for simple tasks
4. **Proper Temperature**: Lower for code generation, higher for creative tasks

### Parallelization

1. **Identify Dependencies**: Map out which tasks depend on others
2. **Maximize Parallelism**: Run independent tasks simultaneously
3. **Critical Path**: Optimize the longest-running path
4. **Resource Limits**: Don't exceed token/cost budgets

### Error Handling

1. **Retry Logic**: Configure automatic retries for transient failures
2. **Fallback Models**: Use alternative AI providers if primary fails
3. **Graceful Degradation**: Continue workflow even if non-critical agents fail
4. **Detailed Logging**: Capture all errors for debugging

### Cost Optimization

1. **Use Haiku for Simple Tasks**: Save 90% on trivial operations
2. **Batch Operations**: Combine multiple small tasks into one agent
3. **Cache Results**: Don't regenerate static content
4. **Set Token Limits**: Prevent runaway token usage

---

## Workflow Monitoring

### Real-Time Metrics

Track these metrics during execution:

- **Progress**: % of agents completed
- **Cost**: Current token usage and cost
- **Duration**: Time elapsed and estimated remaining
- **Errors**: Failed agents and error messages
- **Quality**: Test coverage, build status, lint errors

### Post-Execution Analysis

After workflow completion, review:

- **Total Cost**: Compare to estimate
- **Total Time**: Compare to estimate
- **Success Rate**: % of agents that succeeded
- **Quality Metrics**: Test coverage, security score, performance
- **Generated Artifacts**: Count of files created/modified

---

## Troubleshooting

### Common Issues

**Workflow fails to import**
- Check JSON syntax is valid
- Ensure all required fields are present
- Verify node IDs are unique

**Agents fail with API errors**
- Check API keys are configured
- Verify token limits aren't exceeded
- Ensure AI provider is available

**Workflow exceeds budget**
- Reduce number of parallel agents
- Switch to cheaper models (Haiku)
- Decrease max tokens per agent

**Workflow takes too long**
- Increase parallelism
- Use faster models (Haiku)
- Remove non-critical tracks

**Generated code has errors**
- Lower agent temperature (more deterministic)
- Provide more detailed system prompts
- Use higher-quality models (Sonnet)

---

## Contributing Workflows

We welcome workflow contributions! To submit a workflow:

1. Create and test your workflow
2. Export as JSON with complete metadata
3. Document the workflow in this README
4. Submit a pull request
5. Include example execution results

**Workflow Submission Checklist**:
- [ ] Workflow has clear name and description
- [ ] All nodes have descriptive labels
- [ ] System prompts are detailed and specific
- [ ] Dependencies are correctly mapped
- [ ] Cost and time estimates are included
- [ ] Workflow has been tested successfully
- [ ] README documentation is complete
- [ ] Example results are provided

---

## License

All workflows in this directory are released under the MIT License, same as PROJECT-SWARM.

---

## Questions?

- **Documentation**: See [../docs/](../docs/)
- **Issues**: https://github.com/UniversalStandards/PROJECT-SWARM/issues
- **Discussions**: https://github.com/UniversalStandards/PROJECT-SWARM/discussions
