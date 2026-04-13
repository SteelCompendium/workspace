# Integration

<!-- How this repo connects to other repos, services, and systems.
     This is the file an architect or PM reads to understand dependencies
     and impact of changes. -->

## Dependency Map

<!-- Visual overview of what this repo depends on and what depends on it. -->

```
                    ┌─────────────┐
                    │  {upstream}  │
                    └──────┬──────┘
                           │ {what it provides}
                           ▼
                    ┌─────────────┐
                    │  THIS REPO  │
                    └──────┬──────┘
                           │ {what it produces}
                           ▼
                    ┌─────────────┐
                    │ {downstream} │
                    └─────────────┘
```

<!-- Replace with a proper diagram in media/ for complex dependency graphs. -->

## Upstream Dependencies

<!-- Repos, services, or systems that this repo consumes from. -->

| Source | What it provides | How we consume it | Coupling |
|--------|-----------------|-------------------|----------|
| {repo or service} | {data, API, package, etc.} | {import, API call, file read, git clone, etc.} | {tight / loose} |

### Upstream Change Impact

<!-- What happens to THIS repo when upstream repos change? -->

- **{Upstream repo}:** {impact description — e.g., "Breaking schema changes require updating our parser"}

## Downstream Dependents

<!-- Repos, services, or systems that consume from this repo. -->

| Consumer | What they use | How they consume it | Coupling |
|----------|--------------|---------------------|----------|
| {repo or service} | {data, API, package, etc.} | {import, API call, file read, npm install, etc.} | {tight / loose} |

### Downstream Change Impact

<!-- What happens to DOWNSTREAM repos when we change things here? -->

- **{Downstream repo}:** {impact description — e.g., "Changing export format breaks their build"}

## API Surface

<!-- What this repo exposes for others to use. Only applicable if this repo
     provides an API, SDK, package, or shared data format. -->

### Exposed Interfaces

| Interface | Type | Stability | Documentation |
|-----------|------|-----------|---------------|
| {e.g., REST API} | {HTTP, gRPC, npm package, file format, etc.} | {stable / experimental / internal} | {link} |

### Data Contracts

<!-- Shared data formats, schemas, or protocols that this repo either
     produces or consumes. Changes to these affect multiple repos. -->

| Contract | Format | Owner | Consumers |
|----------|--------|-------|-----------|
| {e.g., event schema} | {JSON Schema, protobuf, TypeScript types, etc.} | {which repo owns the definition} | {which repos consume it} |

## Cross-Repo Workflows

<!-- End-to-end processes that span multiple repos. Describe the full flow
     so an agent understands which repos are involved in a given workflow. -->

### {Workflow Name}

1. **{Repo A}** — {what happens first}
2. **{Repo B}** — {what happens next}
3. **This repo** — {our role in the workflow}
4. **{Repo C}** — {what happens after us}

## Future Integration Potential

<!-- Known opportunities for integration that haven't been built yet.
     Helps PMs scope future work and architects plan ahead. -->

- **{Potential integration}:** {what it would enable and rough complexity}

## Integration Testing

<!-- How to verify integrations work correctly. -->

- **Local:** {how to test integrations locally — e.g., mock services, docker-compose}
- **CI:** {how integrations are tested in CI}
- **Manual verification:** {any manual steps needed}
