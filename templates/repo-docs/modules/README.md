# Module Documentation

This directory is for **monorepo or multi-module projects** where a single repo
contains multiple independently significant components.

## When to Use This

Use `modules/` when your repo has components that:
- Have their own build/test cycle
- Could reasonably be separate repos
- Need independent documentation for contributors who only work in that area
- Have different tech stacks or frameworks within the same repo

**Don't use this** for repos with a single cohesive codebase. Use the top-level
`.repo-docs/` files instead.

## Structure

Each module gets a subdirectory mirroring the top-level `.repo-docs/` structure,
but only include the files that are relevant:

```
modules/
  {module-a}/
    index.md            # Module entry point (always required)
    architecture.md     # If the module has distinct architecture
    development.md      # Module-specific setup/workflows
    integration.md      # How this module connects to other modules
  {module-b}/
    index.md
    development.md
```

## Module index.md

Each module's `index.md` should follow the same structure as the top-level
`index.md` but scoped to that module:

- What the module does
- Quick reference (module-specific commands)
- Module directory structure
- How it relates to other modules in this repo
- Link back to the top-level `.repo-docs/index.md` for repo-wide context

## Cross-Module References

When a module depends on another module in the same repo, link to its
documentation using relative paths:

```markdown
This module depends on the auth module. See [auth module](../auth/index.md).
```

## Examples

### Monorepo with frontend + backend + shared library

```
modules/
  frontend/
    index.md
    development.md
  backend/
    index.md
    architecture.md
    development.md
  shared/
    index.md
```

### Data pipeline with multiple stages

```
modules/
  ingestion/
    index.md
    development.md
  transformation/
    index.md
    architecture.md
  output/
    index.md
    integration.md
```
