# Repository Structure

This document describes the organization of the PROJECT-SWARM repository.

## Directory Structure

```
PROJECT-SWARM/
├── .github/                      # GitHub configuration
│   ├── workflows/                # CI/CD workflows
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   ├── PULL_REQUEST_TEMPLATE.md  # PR template
│   └── copilot-instructions.md   # GitHub Copilot guidelines
│
├── assets/                       # Static assets
│   ├── conversations/            # Claude conversation exports (historical)
│   └── stock_images/             # Stock imagery for UI
│
├── client/                       # Frontend application
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Client utilities
│   │   └── pages/                # Page components
│   ├── index.html                # HTML entry point
│   └── 404.html                  # 404 page
│
├── docs/                         # Documentation
│   ├── README.md                 # Documentation index
│   ├── architecture/             # System design & features
│   │   ├── FEATURES_ROADMAP.md
│   │   ├── WORKFLOW_BUILDER_FEATURES.md
│   │   ├── design_guidelines.md
│   │   └── ...
│   ├── deployment/               # Deployment guides
│   │   ├── CLOUDFLARE_DEPLOYMENT.md
│   │   ├── GITHUB_PAGES_DEPLOYMENT.md
│   │   ├── SELF_HOSTED_DEPLOYMENT.md
│   │   ├── MULTI_PLATFORM_DEPLOYMENT.md
│   │   └── ...
│   ├── development/              # Development documentation
│   │   ├── PHASE_*_*.md          # Implementation phase docs
│   │   ├── TESTING.md
│   │   └── ...
│   └── project-management/       # Project management
│       ├── PROJECT_BOARD.md
│       ├── PARALLEL_DEVELOPMENT_GUIDE.md
│       └── ...
│
├── scripts/                      # Utility scripts
│   ├── create-labels.sh          # GitHub label creation
│   └── generate-issues.js        # Issue generation
│
├── server/                       # Backend application
│   ├── ai/                       # AI provider integration
│   │   └── providers/            # OpenAI, Anthropic, Google
│   ├── auth/                     # Authentication
│   ├── lib/                      # Server utilities
│   ├── middleware/               # Express middleware
│   ├── db.ts                     # Database connection
│   ├── index.ts                  # Server entry point
│   └── routes.ts                 # API routes
│
├── shared/                       # Shared code (client & server)
│   ├── schema.ts                 # Database schema (Drizzle ORM)
│   └── types.ts                  # Shared TypeScript types
│
├── README.md                     # Main project documentation
├── GETTING_STARTED.md            # Quick start guide
├── SECURITY.md                   # Security policies
├── package.json                  # NPM dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── vite.config.ts                # Vite configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── drizzle.config.ts             # Drizzle ORM configuration
└── wrangler.toml                 # Cloudflare Workers configuration
```

## Documentation Organization

Documentation is organized into four main categories:

### 📐 Architecture (`docs/architecture/`)
System design, features, and technical decisions:
- Feature roadmaps and specifications
- Design guidelines and patterns
- Integration summaries
- Architecture reviews

### 🚀 Deployment (`docs/deployment/`)
Platform-specific deployment guides:
- Cloudflare Pages & Workers
- GitHub Pages
- Self-hosted (Windows Server, Amazon Linux)
- Multi-platform deployment strategies
- Deployment status and checklists

### 💻 Development (`docs/development/`)
Implementation and development documentation:
- Phase implementation summaries
- Testing guides
- Development quickstarts
- Implementation completion reports

### 📊 Project Management (`docs/project-management/`)
Project tracking and coordination:
- Project board configuration
- Workflow tracking
- Parallel development guides
- Project setup summaries
- Wiki documentation

## Key Files

### Root Directory
Keep only essential top-level files:
- **README.md** - Project overview and quick start
- **GETTING_STARTED.md** - Detailed setup instructions
- **SECURITY.md** - Security policies and reporting
- **LICENSE** - Project license (MIT)

### Configuration Files
All in root directory for tool compatibility:
- **package.json** - NPM configuration
- **tsconfig.json** - TypeScript compiler settings
- **vite.config.ts** - Vite bundler configuration
- **tailwind.config.ts** - Tailwind CSS configuration
- **drizzle.config.ts** - Database ORM configuration
- **wrangler.toml** - Cloudflare Workers configuration
- **postcss.config.js** - PostCSS configuration
- **components.json** - shadcn/ui components

## Assets Organization

### `assets/` Directory
Renamed from `attached_assets` for clarity:
- **conversations/** - Historical Claude conversation exports (for reference)
- **stock_images/** - UI stock photography

## Code Organization

### Client (`client/`)
React/TypeScript frontend:
- **components/** - Reusable UI components
- **pages/** - Route page components
- **hooks/** - Custom React hooks
- **lib/** - Client-side utilities

### Server (`server/`)
Express/TypeScript backend:
- **ai/** - AI provider integrations (OpenAI, Anthropic, Google)
- **auth/** - Authentication logic
- **lib/** - Server utilities (versioning, scheduling, webhooks)
- **middleware/** - Express middleware
- **routes.ts** - API endpoint definitions
- **index.ts** - Server entry point

### Shared (`shared/`)
Code used by both client and server:
- **schema.ts** - Database schema (Drizzle ORM)
- **types.ts** - Shared TypeScript types

## Navigation

### Finding Documentation
1. Start with [README.md](../README.md) for project overview
2. Check [docs/README.md](./README.md) for complete documentation index
3. Browse category-specific directories for detailed docs

### Finding Code
- Frontend components: `client/src/components/`
- Page routes: `client/src/pages/`
- API endpoints: `server/routes.ts`
- AI providers: `server/ai/providers/`
- Database schema: `shared/schema.ts`

## Maintenance

### Adding New Documentation
1. Determine the appropriate category (architecture, deployment, development, project-management)
2. Place the file in the corresponding `docs/` subdirectory
3. Update `docs/README.md` with a link to the new document
4. Update any relevant cross-references

### Adding New Assets
1. Place images in `assets/stock_images/`
2. Place conversation exports in `assets/conversations/`
3. Update `.gitignore` if needed for generated assets

### Keeping Structure Clean
- Avoid creating files in root directory unless essential
- Use appropriate subdirectories for organization
- Keep README files updated when structure changes
- Remove obsolete documentation promptly

## Benefits of This Organization

1. **Clarity** - Clear separation of concerns
2. **Discoverability** - Easy to find relevant documentation
3. **Scalability** - Structure supports growth
4. **Maintenance** - Easier to keep organized
5. **Onboarding** - New contributors can navigate easily
6. **Tooling** - Standard locations for configuration files

## Migration Notes

This structure was established in January 2026 to improve repository organization:
- 35 markdown files moved from root to organized `docs/` subdirectories
- `attached_assets/` renamed to `assets/` for clarity
- Conversation exports moved to `assets/conversations/`
- All documentation links updated
- Comprehensive documentation index created

All existing functionality maintained - no breaking changes to code or builds.
