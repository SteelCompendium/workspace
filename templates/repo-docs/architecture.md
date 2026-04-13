# Architecture

<!-- This file describes the system design. Read this when making architectural changes,
     adding new components, or trying to understand how the pieces fit together.
     For cross-repo dependencies, see integration.md. -->

## System Overview

<!-- High-level description of the architecture. What are the major pieces and how do
     they relate? A diagram is strongly recommended here — place it in media/ and
     reference it, or use inline mermaid/ASCII art. -->

{One to two paragraph overview of the system architecture.}

<!-- Example diagram reference:
![System overview](media/architecture-overview.png)
-->

## Components

<!-- Break down the system into its major components/modules. Each component gets:
     - What it does (responsibility)
     - Where it lives (directory path)
     - What it depends on
     - What depends on it -->

### {Component Name}

- **Responsibility:** {what this component does}
- **Location:** `{path/to/component}`
- **Depends on:** {other components, external services}
- **Depended on by:** {what uses this component}

### {Component Name}

- **Responsibility:** {what this component does}
- **Location:** `{path/to/component}`
- **Depends on:** {other components, external services}
- **Depended on by:** {what uses this component}

## Data Flow

<!-- How data moves through the system. Trace the path of the primary data from
     input to output. For multi-step pipelines, show each transformation. -->

```
{Input source}
  → {Step 1: what happens}
  → {Step 2: what happens}
  → {Output destination}
```

<!-- For complex flows, use a diagram in media/ or inline mermaid. -->

## Key Design Decisions

<!-- Summary table pointing to individual ADRs for full context.
     If no ADRs exist yet, list decisions inline with brief rationale. -->

| Decision | Rationale | ADR |
|----------|-----------|-----|
| {e.g., Chose SQLite over Postgres} | {one-line why} | [0001](decisions/0001-chose-sqlite.md) |
| {e.g., Monorepo structure} | {one-line why} | — |

## Dependencies

<!-- External libraries, services, and tools the system relies on.
     Include WHY each dependency was chosen — this prevents agents from
     swapping it for an alternative without understanding the tradeoff. -->

| Dependency | Purpose | Why this one |
|------------|---------|-------------|
| {library/service} | {what it does for us} | {why it was chosen over alternatives} |

## Extension Points

<!-- Where and how new functionality should be added. This prevents agents and
     developers from bolting features onto the wrong part of the system. -->

- **To add a new {feature type}:** {where to add it and what pattern to follow}
- **To support a new {data source/format}:** {where to add it and what pattern to follow}

## Constraints

<!-- Technical constraints that shape the architecture. Performance requirements,
     compatibility targets, resource limits, etc. -->

- {Constraint and its impact on architectural choices}

## Diagrams

<!-- Reference any architecture diagrams stored in media/.
     List them here for discoverability. -->

| Diagram | Description | Location |
|---------|-------------|----------|
| {name} | {what it shows} | [media/{filename}](media/{filename}) |
