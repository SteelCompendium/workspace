# CI/CD and Release

<!-- Build, deploy, and release processes. DevOps reads this first.
     Developers read the Branch Strategy and Release sections. -->

## Pipeline Overview

<!-- What CI/CD system is used and what it does. -->

- **CI/CD platform:** {e.g., GitHub Actions, GitLab CI, Jenkins}
- **Config location:** `{e.g., .github/workflows/}`

### Pipeline Stages

<!-- What happens when code is pushed. -->

| Stage | Trigger | What it does | Config file |
|-------|---------|-------------|-------------|
| {e.g., Lint} | {push to any branch} | {runs linter} | `{path}` |
| {e.g., Test} | {push to any branch} | {runs test suite} | `{path}` |
| {e.g., Build} | {push to main} | {builds artifacts} | `{path}` |
| {e.g., Deploy} | {tag push / manual} | {deploys to production} | `{path}` |

## Build Process

<!-- How to build locally (matches what CI does). -->

```sh
# Full build (same as CI)
{command}

# Quick build (development)
{command}
```

### Build Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| {e.g., dist/} | `{path}` | {what it's used for} |

## Branch Strategy

<!-- Which branches exist, what they're for, and the rules. -->

| Branch | Purpose | Merges to | Protection |
|--------|---------|-----------|------------|
| `main` | {e.g., production-ready code} | — | {e.g., requires PR, CI must pass} |
| `develop` | {e.g., integration branch} | `main` | {rules} |
| `feature/*` | {e.g., feature development} | `develop` or `main` | {rules} |

### Branch Naming

```
{type}/{description}

Examples:
  feature/add-user-auth
  fix/login-redirect-loop
  chore/update-dependencies
```

### Merge Strategy

- **Feature → main:** {squash merge | merge commit | rebase}
- **Conflict resolution:** {who resolves, how}

## Release Process

<!-- Step-by-step release procedure. -->

### Versioning

- **Scheme:** {semver | calver | other}
- **Current version source:** `{file or tag}`

### Creating a Release

<!-- Numbered steps a human or agent follows to cut a release. -->

1. {Step 1 — e.g., ensure main is green}
2. {Step 2 — e.g., update version in {file}}
3. {Step 3 — e.g., create git tag}
4. {Step 4 — e.g., push tag to trigger deploy}
5. {Step 5 — e.g., verify deployment}

### Rollback

<!-- How to revert a bad release. -->

1. {Step 1}
2. {Step 2}

## Environments

<!-- Where the code runs. -->

| Environment | URL / Location | Deployed from | Purpose |
|-------------|---------------|---------------|---------|
| {e.g., Production} | {url} | `main` branch | {live users} |
| {e.g., Staging} | {url} | `develop` branch | {pre-release testing} |
| {e.g., Local} | localhost:{port} | working copy | {development} |

## Monitoring and Alerts

<!-- How to know if something is broken after deploy. -->

- **Health check:** {url or command}
- **Logs:** {where to find them}
- **Alerts:** {what triggers alerts and where they go}

## Secrets and Configuration

<!-- What secrets/config CI needs. Do NOT list actual values. -->

| Secret | Where it's stored | Used by |
|--------|------------------|---------|
| {e.g., DEPLOY_TOKEN} | {e.g., GitHub repo secrets} | {which workflow} |
