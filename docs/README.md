# PROJECT-SWARM Documentation

This directory contains all documentation for PROJECT-SWARM, organized by category for easy navigation.

## 📁 Documentation Structure

### 📦 [deployment/](./deployment/)
**Platform deployment guides and configurations**

- [MULTI_PLATFORM_DEPLOYMENT.md](./deployment/MULTI_PLATFORM_DEPLOYMENT.md) - Master deployment guide
- [CLOUDFLARE_DEPLOYMENT.md](./deployment/CLOUDFLARE_DEPLOYMENT.md) - Cloudflare Pages deployment
- [CLOUDFLARE_WORKERS_GUIDE.md](./deployment/CLOUDFLARE_WORKERS_GUIDE.md) - Cloudflare Workers backend
- [GITHUB_PAGES_DEPLOYMENT.md](./deployment/GITHUB_PAGES_DEPLOYMENT.md) - GitHub Pages hosting
- [SELF_HOSTED_DEPLOYMENT.md](./deployment/SELF_HOSTED_DEPLOYMENT.md) - Self-hosted setup (Windows/Linux)
- [DEPLOYMENT_STATUS.md](./deployment/DEPLOYMENT_STATUS.md) - Current deployment status

### 🛠️ [development/](./development/)
**Development guides, implementation summaries, and technical documentation**

- [database-schema.md](./development/database-schema.md) - Database schema documentation (to be generated)
- [components.md](./development/components.md) - Component library documentation (to be generated)
- [er-diagram.mmd](./development/er-diagram.mmd) - Entity-relationship diagram (to be generated)
- **Phase Implementations**:
  - [PHASE_1A_IMPLEMENTATION.md](./development/PHASE_1A_IMPLEMENTATION.md)
  - [PHASE_1B_SUMMARY.md](./development/PHASE_1B_SUMMARY.md)
  - [PHASE_2A_IMPLEMENTATION_SUMMARY.md](./development/PHASE_2A_IMPLEMENTATION_SUMMARY.md)
  - [PHASE_2B_IMPLEMENTATION.md](./development/PHASE_2B_IMPLEMENTATION.md)
  - [PHASE_2B_SUMMARY.md](./development/PHASE_2B_SUMMARY.md)
  - [PHASE_3A_IMPLEMENTATION.md](./development/PHASE_3A_IMPLEMENTATION.md)
  - [PHASE_3A_QUICKSTART.md](./development/PHASE_3A_QUICKSTART.md)
- **Summaries**:
  - [IMPLEMENTATION_COMPLETE.md](./development/IMPLEMENTATION_COMPLETE.md)
  - [INTEGRATION_SUMMARY.md](./development/INTEGRATION_SUMMARY.md)
  - [MERGE_RESOLUTION_SUMMARY.md](./development/MERGE_RESOLUTION_SUMMARY.md)
  - [PROJECT_SETUP_SUMMARY.md](./development/PROJECT_SETUP_SUMMARY.md)
- **Existing**:
  - [phase-2b-visual-guide.md](./development/phase-2b-visual-guide.md)

### 📋 [project-management/](./project-management/)
**Project board setup, workflow tracking, and development coordination**

- [PROJECT_BOARD_MASTER_GUIDE.md](./project-management/PROJECT_BOARD_MASTER_GUIDE.md) - Complete project management guide
- [PROJECT_BOARD.md](./project-management/PROJECT_BOARD.md) - Project board overview
- [PROJECT_BOARD_README.md](./project-management/PROJECT_BOARD_README.md) - Project board documentation
- [PROJECT_BOARD_ROADMAP.md](./project-management/PROJECT_BOARD_ROADMAP.md) - Development roadmap
- [PROJECT_BOARD_SETUP.md](./project-management/PROJECT_BOARD_SETUP.md) - Setup instructions
- [README_PROJECT_MANAGEMENT.md](./project-management/README_PROJECT_MANAGEMENT.md) - Project management overview
- [Workflow Status Tracker.md](./project-management/Workflow%20Status%20Tracker.md) - Workflow status tracking
- [PARALLEL_DEVELOPMENT_GUIDE.md](./project-management/PARALLEL_DEVELOPMENT_GUIDE.md) - Guide for parallel development

### ✨ [features/](./features/)
**Feature documentation, roadmaps, and testing guides**

- [FEATURES_ROADMAP.md](./features/FEATURES_ROADMAP.md) - Complete feature roadmap (90+ features)
- [WORKFLOW_BUILDER_FEATURES.md](./features/WORKFLOW_BUILDER_FEATURES.md) - Workflow builder capabilities
- [TESTING.md](./features/TESTING.md) - Comprehensive testing guide (300+ test cases)

### 📖 [guides/](./guides/)
**User guides, best practices, and platform-specific documentation**

- [GETTING_STARTED.md](./guides/GETTING_STARTED.md) - Quick start guide
- [SECURITY.md](./guides/SECURITY.md) - Security policies and practices
- [design_guidelines.md](./guides/design_guidelines.md) - UI/UX design guidelines
- [replit.md](./guides/replit.md) - Replit-specific setup
- [architecture.md](./guides/architecture.md) - System architecture documentation (to be generated)

### 🔍 [reviews/](./reviews/)
**Code reviews, architecture reviews, and improvement proposals**

- [REPOSITORY_REVIEW_2025-12-14.md](./reviews/REPOSITORY_REVIEW_2025-12-14.md) - Comprehensive repository review with SWARM improvement strategy
- [REVIEW_RAGBITS_INTEGRATION.md](./reviews/REVIEW_RAGBITS_INTEGRATION.md) - RAGbits integration review
- [REVIEW_README.md](./reviews/REVIEW_README.md) - README review

### 🔌 [api/](./api/)
**API documentation and specifications** *(to be generated)*

- openapi.yaml - OpenAPI 3.0 specification
- swagger-ui.html - Interactive API documentation

---

## 📝 Quick Links

### Getting Started
1. [Getting Started Guide](./guides/GETTING_STARTED.md) - First steps
2. [Features Roadmap](./features/FEATURES_ROADMAP.md) - What can PROJECT-SWARM do?
3. [Deployment Guide](./deployment/MULTI_PLATFORM_DEPLOYMENT.md) - Deploy your instance

### For Developers
1. [Development Phases](./development/) - Implementation history
2. [Testing Guide](./features/TESTING.md) - How to test
3. [Security Guide](./guides/SECURITY.md) - Security best practices
4. [Design Guidelines](./guides/design_guidelines.md) - UI/UX standards

### For Project Managers
1. [Project Board Master Guide](./project-management/PROJECT_BOARD_MASTER_GUIDE.md)
2. [Parallel Development Guide](./project-management/PARALLEL_DEVELOPMENT_GUIDE.md)
3. [Workflow Status Tracker](./project-management/Workflow%20Status%20Tracker.md)

### For DevOps
1. [Deployment Options](./deployment/) - All deployment guides
2. [Self-Hosted Setup](./deployment/SELF_HOSTED_DEPLOYMENT.md) - Run on your infrastructure
3. [Cloudflare Workers](./deployment/CLOUDFLARE_WORKERS_GUIDE.md) - Edge deployment

---

## 🔄 Documentation Updates

This documentation structure was reorganized on **December 14, 2025** to improve navigation and discoverability. All documentation is now categorized by purpose:

- **deployment/** - How to deploy
- **development/** - How it was built
- **project-management/** - How to manage development
- **features/** - What it can do
- **guides/** - How to use it
- **reviews/** - Analysis and improvements
- **api/** - API reference (coming soon)

---

## 🤝 Contributing to Documentation

When adding new documentation:

1. Place files in the appropriate category directory
2. Update this README with a link to your new document
3. Use clear, descriptive filenames (prefer lowercase with hyphens)
4. Add a brief description in the category section above
5. Link related documents together

For major documentation reorganizations, please create an issue first to discuss the proposed structure.

---

## 📚 External Resources

- [Main README](../README.md) - Project overview
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute (to be created)
- [License](../LICENSE) - MIT License (to be created)
- [GitHub Repository](https://github.com/UniversalStandards/PROJECT-SWARM)

---

**Questions?** Open an issue or check the [Getting Started Guide](./guides/GETTING_STARTED.md)!
