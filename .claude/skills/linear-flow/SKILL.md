---
name: linear-flow
description: Use when creating, updating, or reviewing Linear issues for the Steel Compendium team — status semantics, the Needs Review convention, and attaching screenshots
---

# Linear Flow

## Overview

The Steel Compendium team (`SC-*`) uses Linear statuses to mean specific, non-improvised
things, and Scott reviews visual work **from screenshot attachments on the issue**, not from
descriptions. Getting either wrong means Scott doesn't see the thing he needs to see, or a
ticket sits invisible in the wrong bucket.

## Status semantics

| State | Means |
|---|---|
| **Todo** | Not yet started. Nothing is happening, nobody is waiting. |
| **In Progress** + **`Needs Review`** label | **Needs Scott.** A decision, a taste check, a "can this close?" — anything requiring his eyes. **Both** the status and the label, always together. |
| **Awaiting** | An **agent is actively working it**, *or* it's blocked on something **external** (upstream publish, third party, mirror). Never a parking spot for work that's merely blocked on other internal work — that's `Todo`. |
| **Backlog** | Someday/maybe. |
| **Done** / **Canceled** / **Duplicate** | Terminal. |

When you need Scott's input, don't bury it in a report: set `In Progress` + `Needs Review`
so it surfaces in his filter. A question he never sees is a blocked project.

### Thin-ticket rule

If a ticket needs review but has a thin description (old imports especially), **add a
comment saying what he's actually being asked to look at, and where**. "Needs Review" with
no context just moves the confusion into the ticket.

## Screenshot rules

Scott reviews visual work *in Linear, from the attachments* — not the rendered app, not a
description in a comment.

- **Any issue involving a visual change** gets before/after screenshots attached to the issue
  **before** it is flagged `Needs Review`.
- **Any A/B (or A/B/C…) decision** Scott has to make gets the candidate screenshots attached,
  **one titled attachment per option**, so he can decide by looking without leaving the
  ticket.

## Attachment mechanics

Use the fully-qualified MCP tool names — `mcp__linear__prepare_attachment_upload` and
`mcp__linear__create_attachment_from_upload`.

1. `mcp__linear__prepare_attachment_upload` → returns a pre-signed `uploadUrl` and a set of
   required headers. **This URL expires in 60 seconds.**
2. **Immediately** `curl -X PUT --data-binary @<file> <uploadUrl>`, passing **every** header
   the tool returned, **verbatim** (name and value unchanged — a pre-signed URL's signature is
   sensitive to the exact header set; dropping or altering one breaks the upload).
3. `mcp__linear__create_attachment_from_upload` with the resulting `assetUrl`, and a **title
   that names the option or state** — e.g. `"Current look — sidebar collapsed"`,
   `"After — sidebar collapsed"`, `"Option C — Zilla Slab"`.

**One file at a time.** Never call `prepare_attachment_upload` for multiple files up front —
by the time you get to the second PUT, its URL has expired. Prepare, PUT, create; then repeat
for the next file.
