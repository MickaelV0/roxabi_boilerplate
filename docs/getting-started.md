# Getting Started

Quick start guide to use the Roxabi Boilerplate.

## Prerequisites

- [Bun](https://bun.sh/) >= 1.0
- [Git](https://git-scm.com/)
- [GitHub CLI](https://cli.github.com/) (`gh`)
- [Claude Code](https://claude.ai/claude-code) (optional but recommended)
- PostgreSQL >= 15

## 1. Create the Project

### Clone the boilerplate

```bash
# Option A: Direct clone (to contribute to the boilerplate)
git clone https://github.com/MickaelV0/roxabi_boilerplate.git my-project
cd my-project

# Option B: Use as template (for a new project)
gh repo create my-project --template MickaelV0/roxabi_boilerplate --private
gh repo clone my-project
cd my-project
```

### Configure the remote (if direct clone)

```bash
# Remove the boilerplate's origin remote
git remote remove origin

# Create your own GitHub repo
gh repo create my-project --private --source=. --push
```

## 2. Configure GitHub Project

### Create the project

```bash
# Create a GitHub project to track issues and PRs
gh project create --owner @me --title "My Project"
```

### Enable auto-add

1. Go to https://github.com/users/YOUR_USERNAME/projects/N/settings
2. In **Workflows** > **Auto-add to project**
3. Enable the workflow
4. Configure the filter: `is:issue,pr repo:YOUR_USERNAME/my-project`
5. Save

Or via API:
```bash
# List projects to find the ID
gh project list --owner @me

# The auto-add workflow must be configured via GitHub UI
# as the API doesn't support this feature yet
```

### Configure project columns

Recommended columns:
- **Backlog** - Issues to prioritize
- **Todo** - Ready to be picked up
- **In Progress** - Currently being developed
- **In Review** - PR open, awaiting review
- **Done** - Completed

### Add custom fields

In the project settings, add:

| Field | Type | Values |
|-------|------|--------|
| Priority | Single select | P1, P2, P3 |
| Size | Single select | XS, S, M, L, XL |
| Sprint | Iteration | 2 weeks |

## 3. Configure Labels

Labels are already created if you use the template. Otherwise:

```bash
# Type labels
gh label create setup --color "0E8A16" --description "Infrastructure & setup"
gh label create feature --color "A2EEEF" --description "New feature"
gh label create bug --color "D73A4A" --description "Bug fix"
gh label create dx --color "1D76DB" --description "Developer Experience"
gh label create docs --color "D4C5F9" --description "Documentation"
gh label create ai --color "FBCA04" --description "AI agents & skills"
gh label create workflow --color "C2E0C6" --description "Workflow & processes"

# Priority labels
gh label create P1 --color "B60205" --description "Priority 1 - Critical"
gh label create P2 --color "D93F0B" --description "Priority 2 - Important"
gh label create P3 --color "FBCA04" --description "Priority 3 - Nice to have"

# Size labels
gh label create XS --color "E6E6E6" --description "Size: Extra Small"
gh label create S --color "C5DEF5" --description "Size: Small"
gh label create M --color "BFD4F2" --description "Size: Medium"
gh label create L --color "7057FF" --description "Size: Large"
gh label create XL --color "D876E3" --description "Size: Extra Large"
```

## 4. Configure Branch Protection

In **Settings** > **Branches** > **Add rule** for `main`:

- [x] Require a pull request before merging
- [x] Require approvals (1)
- [x] Require status checks to pass before merging
  - [x] ci (when CI is configured)
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

## 5. Install Dependencies

```bash
# Install all monorepo dependencies
bun install
```

## 6. Configure Environment

```bash
# Copy the example file
cp .env.example .env

# Edit with your values
# DATABASE_URL, API keys, etc.
```

## 7. Configure the Database

```bash
# Create the database
createdb my_project_dev

# Apply migrations (when configured)
bun db:migrate
```

## 8. Run the Project

```bash
# Run all apps in dev mode
bun dev

# Or individually
bun --filter @repo/web dev
bun --filter @repo/api dev
```

## 9. Verify Installation

- Frontend: http://localhost:3000
- API: http://localhost:4000
- API Docs (Swagger): http://localhost:4000/docs

## Useful Commands

| Command | Description |
|---------|-------------|
| `bun dev` | Run all apps in dev mode |
| `bun build` | Build all packages |
| `bun lint` | Lint with Biome |
| `bun format` | Format with Biome |
| `bun typecheck` | TypeScript type checking |
| `bun test` | Run all tests |
| `bun test:coverage` | Tests with coverage |

## Next Steps

1. Read the [Vision](./vision.md) to understand the project
2. Check the [Architecture](./architecture.md)
3. See the [contribution guidelines](./contributing.md)
4. Check the [open issues](https://github.com/MickaelV0/roxabi_boilerplate/issues)
