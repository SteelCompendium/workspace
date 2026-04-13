# .repo-docs Template Guide

A standard documentation template for repository documentation. Designed to make
any agent or developer immediately productive in an unfamiliar repo.

## Quick Start

1. Copy the `repo-docs/` directory into your repository root as `.repo-docs/`:
   ```sh
   cp -r templates/repo-docs /path/to/your-repo/.repo-docs
   ```

2. Determine your repo type (see [Repo Types](#repo-types) below).

3. Delete files marked "Skip" for your repo type.

4. Fill in the remaining files — start with `index.md`, then work through
   each file in the order listed in the [File Reference](#file-reference).

5. Add a pointer from your agent config file (e.g., `CLAUDE.md`):
   ```markdown
   # {Repo Name}

   Repo documentation: [.repo-docs/](.repo-docs/)
   Entry point: [.repo-docs/index.md](.repo-docs/index.md)
   ```

6. Remove all HTML comments (`<!-- ... -->`) from the filled-in files.
   They are instructional guides for the person filling in the template.

## Repo Types

The template scales across three tiers of complexity. Use the type that best
matches your repo.

### Data Repo

Repos that hold generated or curated data with minimal code. Examples: content
repos, exported datasets, configuration bundles.

**Characteristics:**
- Little to no source code
- Content is machine-generated or manually curated
- Build process is simple (if it exists)
- Few or no contributors

### Tool Repo

Repos with a real codebase — applications, libraries, services, plugins.

**Characteristics:**
- Has source code, tests, build process
- Multiple components or modules
- Active development
- CI/CD pipeline

### Workspace Repo

An orchestration repo that ties multiple repos together. Monorepo roots,
multi-repo workspace configurations.

**Characteristics:**
- Contains sub-repos or references to other repos
- Provides shared tooling, scripts, or configuration
- Primary value is coordination, not code

## File Reference

### What to Include Per Repo Type

| File | Data Repo | Tool Repo | Workspace |
|------|-----------|-----------|-----------|
| `index.md` | REQUIRED | REQUIRED | REQUIRED |
| `project.md` | Optional | REQUIRED | REQUIRED |
| `architecture.md` | Skip | REQUIRED | REQUIRED |
| `development.md` | Skip | REQUIRED | Optional |
| `integration.md` | Condensed | REQUIRED | REQUIRED |
| `ci-cd.md` | Condensed | REQUIRED | Optional |
| `conventions.md` | Condensed | REQUIRED | REQUIRED |
| `troubleshooting.md` | Skip | Optional | Optional |
| `decisions/` | Skip | Optional | Optional |
| `media/` | Optional | Optional | Optional |
| `modules/` | Skip | If needed | If needed |

**REQUIRED** — fill this in before considering the documentation done.
**Optional** — include when it adds value; skip if the file would be nearly empty.
**Condensed** — include a simplified version with only the relevant sections.
**Skip** — delete the file from `.repo-docs/`. It doesn't apply.

### File Purposes

| File | One-line purpose |
|------|-----------------|
| `index.md` | Universal entry point. Repo identity, quick reference, structure, role routing. |
| `project.md` | Non-technical context. Product vision, domain, glossary, audiences, work conventions. |
| `architecture.md` | Technical design. Components, data flow, dependencies, extension points. |
| `development.md` | Developer onboarding. Setup, workflows, testing, debugging. |
| `integration.md` | External connections. Upstream/downstream repos, APIs, data contracts. |
| `ci-cd.md` | Build and release. Pipeline, branches, deployment, environments. |
| `conventions.md` | Style and standards. Naming, formatting, commits, project-specific rules. |
| `troubleshooting.md` | Problems and fixes. Known issues, errors, FAQs, "Do NOT" warnings. |
| `decisions/` | Architecture Decision Records. Why significant choices were made. |
| `media/` | Visual assets. Screenshots, diagrams, architecture drawings. |
| `modules/` | Monorepo scaling. Per-module documentation mirroring the top-level structure. |

## Filling In the Templates

### General Principles

1. **Start with `index.md`** — it forces you to articulate the repo's identity,
   commands, and structure. Everything else flows from this.

2. **Delete what doesn't apply** — an empty section is worse than no section.
   If a file would have fewer than 2 meaningful sections, skip the file and
   fold the relevant content into `index.md`.

3. **Write for someone with zero context** — assume the reader has never seen
   this repo, doesn't know the domain, and needs to be productive today.

4. **Commands must be copy-pasteable** — no prose instructions when a shell
   command will do. Every command in the docs should work when pasted directly.

5. **Link, don't duplicate** — if information lives in a config file, CI
   workflow, or another doc, point to it. Don't transcribe it.

6. **Keep it current** — stale docs are worse than no docs. When you change
   behavior, update the corresponding doc in the same commit.

### Placeholder Syntax

The templates use these placeholder conventions:

| Syntax | Meaning |
|--------|---------|
| `{REPO_NAME}` | Replace with an actual value |
| `{e.g., Node.js}` | Replace with an actual value; the example hints at what goes here |
| `{description}` | Replace with descriptive text |
| `<!-- comment -->` | Instructional guidance; delete after filling in |

### YAML Frontmatter

`index.md` includes YAML frontmatter for machine-parseable metadata:

```yaml
---
repo: my-repo
type: tool
status: active
tech:
  - TypeScript
  - PostgreSQL
updated: 2025-01-15
---
```

Agents parse this before reading the document body. Keep it accurate.

**Fields:**
- `repo` — Repository name (matches directory name or GitHub repo name)
- `type` — `workspace`, `tool`, `library`, `data`, or `service`
- `status` — `active`, `maintenance`, `deprecated`, or `archived`
- `tech` — Primary languages, frameworks, and infrastructure
- `updated` — Date this file was last meaningfully updated

## Condensed Files for Data Repos

Data repos need minimal documentation. For files marked "Condensed," include
only the sections that are relevant. Example condensed `integration.md` for
a data repo:

```markdown
# Integration

## Upstream

Generated by the `{etl-repo}` pipeline. This repo does not produce its own content.

## Downstream

Consumed by:
- `{site-repo}` — pulls content via `{mechanism}`
- `{sdk-repo}` — reads schema definitions from `{path}`

## Data Format

- **Format:** {Markdown | JSON | YAML}
- **Schema:** {path to schema or "no formal schema"}
- **Sample file:** `{path/to/representative/file}`
```

This replaces the full dependency map, API surface, and data contracts sections.

## Agent Config Integration

### Claude Code (CLAUDE.md)

```markdown
# {Repo Name}

Repo documentation: [.repo-docs/](.repo-docs/)
Entry point: [.repo-docs/index.md](.repo-docs/index.md)
```

### Gemini (GEMINI.md)

```markdown
# {Repo Name}

Repo documentation: [.repo-docs/](.repo-docs/)
Entry point: [.repo-docs/index.md](.repo-docs/index.md)
```

### GitHub Copilot (.github/copilot-instructions.md)

```markdown
For comprehensive repo documentation, read `.repo-docs/index.md` first.
```

### Cursor (.cursorrules)

```markdown
For repo context, read the documentation in `.repo-docs/`, starting with `index.md`.
```

### Generic / Multi-Agent

Any agent that reads a standard instructions file can be pointed to `.repo-docs/index.md`.
The documentation is plain markdown — no agent-specific formatting is used.

## Maintaining Documentation

### When to Update

| Event | Files to check |
|-------|---------------|
| New feature shipped | `project.md` (feature inventory), `architecture.md` (if new component) |
| Dependency added/removed | `architecture.md` (dependencies table) |
| Build/deploy process changed | `ci-cd.md` |
| New integration added | `integration.md` |
| Bug workaround discovered | `troubleshooting.md` |
| Convention established | `conventions.md` |
| Major design decision | Create new ADR in `decisions/` |
| Directory structure changed | `index.md` (repo structure) |

### Freshness Check

Periodically (quarterly or when onboarding someone new), scan all `.repo-docs/`
files and verify that:
- Commands still work
- Links aren't broken
- Feature inventory reflects reality
- Status in frontmatter is accurate

## Directory Layout Reference

```
.repo-docs/
  index.md              # ALWAYS: Entry point, repo identity, role routing
  project.md            # Product vision, domain context, glossary, work conventions
  architecture.md       # System design, components, data flow, dependencies
  development.md        # Setup, workflows, testing, debugging
  integration.md        # Cross-repo dependencies, API surface, data contracts
  ci-cd.md              # Build pipeline, branch strategy, release process
  conventions.md        # Code style, naming, formatting, commit messages
  troubleshooting.md    # Known issues, FAQs, common errors, "Do NOT" warnings
  decisions/            # Architecture Decision Records
    README.md           # ADR process and index
    0000-template.md    # ADR template
    0001-*.md           # Individual decisions
  media/                # Screenshots, diagrams, visual assets
  modules/              # Monorepo: per-module documentation
    README.md           # When and how to use module docs
    {module-name}/      # Mirrors top-level structure per module
      index.md
      ...
```
