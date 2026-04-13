---
# Repo metadata — agents parse this before reading the document.
# Update all fields when instantiating this template.
repo: {REPO_NAME}
type: workspace | tool | library | data | service
status: active | maintenance | deprecated | archived
tech:
  - {primary language or framework}
  - {secondary tooling}
updated: {YYYY-MM-DD}
---

# {REPO_NAME}

<!-- One to three sentences. What this repo does, why it exists, and who it serves. -->

{Brief description of the repository's purpose and value.}

**This repo is not:** {Explicit boundaries — what's out of scope or commonly confused with this repo.}

## Quick Reference

<!-- Key commands, links, and access points. Agents copy-paste from this table. -->

| Action | Command |
|--------|---------|
| Install dependencies | `{command}` |
| Run locally | `{command}` |
| Run tests | `{command}` |
| Build | `{command}` |
| Deploy | `{command}` |

| Resource | URL |
|----------|-----|
| Live site / package | {url} |
| Issue tracker | {url} |
| CI dashboard | {url} |

## Repo Structure

<!-- Annotated directory tree. Only include directories/files that matter.
     Use comments to explain non-obvious paths. -->

```
{repo-root}/
  src/                  # {what this contains}
  tests/                # {test organization}
  config/               # {configuration files}
  .repo-docs/           # This documentation
  README.md             # Human-facing overview
  {build-file}          # {e.g., justfile, Makefile, package.json}
```

## Reading Guide by Role

Not every file in `.repo-docs/` is relevant to every role. Start with the file
that matches your role, then follow the links as needed.

| Role | Start here | Then read |
|------|-----------|-----------|
| **New to this repo** | This file | [project.md](project.md) |
| **Developer** | [development.md](development.md) | [architecture.md](architecture.md), [conventions.md](conventions.md) |
| **Architect** | [architecture.md](architecture.md) | [integration.md](integration.md), [decisions/](decisions/) |
| **PM / Scrum Master** | [project.md](project.md) | [integration.md](integration.md), [decisions/](decisions/) |
| **DevOps / SRE** | [ci-cd.md](ci-cd.md) | [architecture.md](architecture.md) |
| **QA / Tester** | [development.md](development.md) | [troubleshooting.md](troubleshooting.md) |

## Current Status

<!-- Brief snapshot of where this repo stands. Update periodically. -->

- **Health:** {stable | active development | needs attention | legacy}
- **Last significant change:** {what and when}
- **Known blockers:** {any current blockers, or "None"}

## Documents in This Directory

| File | Covers |
|------|--------|
| [project.md](project.md) | Product vision, domain context, glossary, audiences, work conventions |
| [architecture.md](architecture.md) | System design, components, data flow, dependencies |
| [development.md](development.md) | Setup, workflows, testing, debugging |
| [integration.md](integration.md) | Cross-repo dependencies, API surface, data contracts |
| [ci-cd.md](ci-cd.md) | Build pipeline, branch strategy, release process |
| [conventions.md](conventions.md) | Code style, naming, formatting, commit messages |
| [troubleshooting.md](troubleshooting.md) | Known issues, FAQs, common errors, "Do NOT" warnings |
| [decisions/](decisions/) | Architecture Decision Records (ADRs) |
| [media/](media/) | Screenshots, diagrams, visual assets |
