# Conventions

<!-- Project-specific style and conventions. These supplement (not replace)
     language-level standards. Only document conventions that are specific to
     THIS project or that deviate from language defaults. -->

## File and Directory Naming

<!-- Naming patterns for files and directories in this project. -->

| Category | Pattern | Example |
|----------|---------|---------|
| {e.g., Source files} | {e.g., kebab-case.ts} | `{user-service.ts}` |
| {e.g., Test files} | {e.g., *.test.ts} | `{user-service.test.ts}` |
| {e.g., Components} | {e.g., PascalCase.tsx} | `{UserProfile.tsx}` |

### Directory Structure Conventions

<!-- Rules about where things go. -->

- {e.g., One component per file}
- {e.g., Tests co-located with source, not in separate directory}
- {e.g., Shared utilities go in src/utils/}

## Code Style

<!-- Project-specific code conventions beyond what the linter enforces. -->

### Formatting

- **Formatter:** {e.g., prettier, black, gofmt}
- **Config:** `{path to config file}`
- **Auto-format on save:** {yes/no, how to set up}

### Linting

- **Linter:** {e.g., eslint, ruff, golangci-lint}
- **Config:** `{path to config file}`
- **Run manually:** `{command}`

### Language-Specific Conventions

<!-- Only include conventions specific to THIS project. Don't repeat general
     language best practices. -->

- {Convention and why it exists in this project}

## Commit Messages

<!-- Format for commit messages. -->

```
{type}: {description}

{optional body}
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `docs` | Documentation only |
| `test` | Adding or updating tests |
| `chore` | Maintenance, dependencies, tooling |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Rules

- {e.g., Use imperative mood ("Add feature" not "Added feature")}
- {e.g., First line under 72 characters}
- {e.g., Reference issue number when applicable}

## Documentation Style

<!-- How documentation should be written in this project. -->

- {e.g., Use ATX headers (# not ===)}
- {e.g., One sentence per line in markdown}
- {e.g., Code blocks must specify language}

## API / Interface Conventions

<!-- If the project exposes APIs or interfaces, conventions for designing them. -->

- {e.g., REST endpoints use kebab-case}
- {e.g., All responses use the standard envelope format}
- {e.g., Error codes follow the project error catalog}

## Content Conventions

<!-- For projects that manage content (docs, data, CMS, etc.) — formatting
     rules for the content itself, not just the code. -->

- {e.g., Frontmatter is required on all markdown files}
- {e.g., Images go in media/ next to the referencing document}
- {e.g., Use relative links, never absolute URLs}

## Naming Conventions

<!-- Naming patterns for code entities. -->

| Entity | Convention | Example |
|--------|-----------|---------|
| {e.g., Variables} | {camelCase} | `{userName}` |
| {e.g., Constants} | {UPPER_SNAKE} | `{MAX_RETRIES}` |
| {e.g., Functions} | {camelCase verb} | `{getUserById}` |
| {e.g., Classes} | {PascalCase noun} | `{UserService}` |
