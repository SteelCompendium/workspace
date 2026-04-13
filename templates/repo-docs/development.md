# Development

<!-- Everything a developer needs to go from clone to productive.
     Keep commands copy-pasteable. -->

## Prerequisites

<!-- What must be installed before setup. Be specific about versions. -->

| Tool | Version | Install |
|------|---------|---------|
| {e.g., Node.js} | {e.g., >= 20} | {link or command} |
| {e.g., Python} | {e.g., 3.12+} | {link or command} |

<!-- If the project uses a dev environment manager: -->

**Recommended:** Use `{devbox|nix|mise|asdf}` to install all prerequisites automatically:

```sh
{devbox shell | mise install | asdf install}
```

## Setup

<!-- Step-by-step from clone to running. Number the steps. -->

1. Clone the repository:
   ```sh
   git clone {repo-url}
   cd {repo-name}
   ```

2. Install dependencies:
   ```sh
   {command}
   ```

3. Configure environment:
   ```sh
   cp .env.example .env
   # Edit .env with required values (see below)
   ```

4. Verify setup:
   ```sh
   {command to verify everything works — e.g., run tests, start dev server}
   ```

### Required Environment Variables

<!-- Only list variables that MUST be set. Mark optional ones clearly. -->

| Variable | Description | Required | Default |
|----------|------------|----------|---------|
| {VAR_NAME} | {what it does} | Yes/No | {default or "—"} |

## Common Workflows

<!-- The tasks a developer does repeatedly. Each workflow is a recipe. -->

### Running Locally

```sh
{command}
```

{Any notes about what this starts, what port, how to access it.}

### Making Changes

<!-- The typical edit-test-commit cycle for this repo. -->

1. {Step 1 — e.g., create a branch}
2. {Step 2 — e.g., make changes}
3. {Step 3 — e.g., run tests}
4. {Step 4 — e.g., commit and push}

### Adding a New {Common Task}

<!-- Fill in for the most common type of addition to this repo.
     E.g., "Adding a new API endpoint", "Adding a new data source",
     "Adding a new component". -->

1. {Step 1}
2. {Step 2}
3. {Step 3}

## Testing

### Test Strategy

<!-- What types of tests exist and what they cover. -->

| Type | Framework | Location | Runs on |
|------|-----------|----------|---------|
| Unit | {e.g., pytest, jest} | `{path}` | {local, CI, both} |
| Integration | {framework} | `{path}` | {local, CI, both} |
| E2E | {framework} | `{path}` | {CI only, etc.} |

### Running Tests

```sh
# All tests
{command}

# Unit tests only
{command}

# With coverage
{command}
```

### Writing Tests

<!-- Conventions for how tests should be written in this project. -->

- Test files go in `{path pattern}`
- Name pattern: `{e.g., test_*.py, *.test.ts}`
- {Any project-specific testing conventions}

### Coverage Requirements

<!-- Minimum coverage threshold, if any. -->

Minimum coverage: {percentage or "no formal requirement"}

## Debugging

<!-- How to debug common issues during development. -->

### Logging

- Log level is controlled by: `{env var or config}`
- Logs are written to: `{location}`

### Common Debug Commands

```sh
# {Description of debug command}
{command}
```

## Editor / IDE Setup

<!-- Optional but helpful. Only include if there are non-obvious setup steps. -->

- **{Editor}:** {relevant extensions, config files, workspace settings}
