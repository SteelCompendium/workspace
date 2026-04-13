# Project Context

<!-- This file provides the non-technical context that PMs, scrum masters, domain experts,
     and new contributors need. Developers benefit from the Glossary and Domain Context
     sections even if they skip the rest. -->

## Product Overview

<!-- What does this product/project do at a high level? Why was it created?
     Write this for someone who has never seen the repo. -->

{What the product does, the problem it solves, and why it was built.}

## Domain Context

<!-- The problem space this repo operates in. Key concepts, terminology,
     and mental models that someone needs to understand the codebase. -->

{Description of the domain. What does someone need to know about the problem
space to make good decisions in this codebase?}

### Key Concepts

<!-- Domain concepts that appear in code, tickets, and conversations.
     More detailed than the glossary — explain relationships between concepts. -->

- **{Concept A}** — {explanation and how it relates to the codebase}
- **{Concept B}** — {explanation}

## Glossary

<!-- Short definitions for domain-specific terms. Alphabetical order.
     Include terms that appear in code, variable names, ticket titles, or conversations
     that an outsider would not understand. -->

| Term | Definition |
|------|-----------|
| {term} | {definition} |
| {term} | {definition} |

## Audiences

<!-- Who uses this? What do they care about? -->

| Audience | What they need | How they interact |
|----------|---------------|-------------------|
| {e.g., End users} | {their goal} | {web app, CLI, API, etc.} |
| {e.g., Developers} | {their goal} | {SDK, library, source code} |
| {e.g., Content authors} | {their goal} | {CMS, markdown files, etc.} |

## Feature Inventory

<!-- What has been built, what's in progress, and what's planned.
     Keep this updated — it's the first thing a PM agent reads. -->

### Shipped

- {Feature 1} — {one-line description}
- {Feature 2} — {one-line description}

### In Progress

- {Feature 3} — {status, who's working on it, target date if known}

### Planned / Backlog

- {Feature 4} — {priority, rough scope}

## Work Conventions

<!-- How work gets tracked, scoped, and defined as "done" in this project. -->

### Ticket Format

<!-- How tickets/issues should be written for this project. -->

```
Title: {concise imperative description}

## Context
{Why this work is needed}

## Acceptance Criteria
- [ ] {Specific, testable criterion}
- [ ] {Specific, testable criterion}

## Scope
{What's in scope and explicitly out of scope}
```

### Labels / Categories

<!-- If the project uses labels, tags, or categories to organize work. -->

| Label | Meaning |
|-------|---------|
| {label} | {when to use it} |

### Definition of Done

A ticket is complete when:

- [ ] Implementation matches acceptance criteria
- [ ] Tests pass (unit + integration at minimum)
- [ ] Documentation updated if behavior changed
- [ ] Code reviewed and approved
- [ ] No regressions in CI

### Priority Levels

| Priority | Meaning | Response time |
|----------|---------|---------------|
| Critical | {definition} | {expectation} |
| High | {definition} | {expectation} |
| Medium | {definition} | {expectation} |
| Low | {definition} | {expectation} |

## Constraints and Risks

<!-- Licensing, legal, technical debt, known risks, deadlines. -->

- **{Constraint type}:** {description and impact}

## Roadmap

<!-- High-level direction. Not a sprint plan — more like "where is this project going?"
     Include time horizons if known. -->

### Near-term

- {Goal or milestone}

### Medium-term

- {Goal or milestone}

### Long-term / Vision

- {Where this project is heading}
