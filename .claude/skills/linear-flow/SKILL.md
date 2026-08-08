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

Scott reviews visual work *in Linear, from the images on the ticket* — not the rendered app,
not a prose description. (Scott's ruling, 2026-08-02.)

- **Default: embed images INLINE in comments**, next to the text that explains them —
  `![title](assetUrl)` in the comment body after the same upload flow below. Two reasons:
  the explanatory context travels with the image, and the comment thread becomes a visual
  history — Scott reviews change-over-time by scrolling past screenshots of the same thing.
- **Any issue involving a visual change** gets its before/after pair posted (inline, in a
  comment narrating the change) **before** it is flagged `Needs Review`.
- **A/B decision sets** go inline in the decision comment, one labeled image per option,
  with the trade-offs text beside them.
- **Root-level attachments are for durable reference material only**: the baseline "before"
  shot, design-reference/target images that guide how the ticket gets implemented — things
  someone should find without scrolling the thread. Not for evolving progress evidence.

### Approval asks are self-contained (Scott's rule, 2026-08-08)

When flagging `Needs Review` for an approval/decision, **the LAST comment must carry a
clearly-marked section stating exactly what Scott is approving** — even if that duplicates
images or facts from earlier comments (re-upload the deciding image inline if needed).
He reviews from that one comment without scrolling. Shape:

1. A heading like **"What you're approving"**.
2. The enumerated decision(s), one line each, concrete ("rebaseline these 5 files: …").
3. The deciding evidence inline in the same comment.
4. The consequence of each answer ("approve = X happens; decline = Y").

If discussion continues after an ask (questions, new rounds), post a fresh consolidated
ask as the new last comment rather than pointing back up the thread.

### ⚠️ `save_issue` labels are REPLACE, not merge

`mcp__linear__save_issue`'s `labels` param replaces the issue's **full** label set, and
some write paths have silently cleared labels as a side effect (observed 2026-08-08 on
SC-131). Always pass the complete intended set (fetch current labels first if unsure), and
re-verify labels after any save that matters (`Needs Review` disappearing = invisible to
Scott's filter).

## Attachment mechanics

Use the fully-qualified MCP tool names — `mcp__linear__prepare_attachment_upload` and
`mcp__linear__create_attachment_from_upload`.

1. `mcp__linear__prepare_attachment_upload` → returns a pre-signed `uploadUrl` and a set of
   required headers. **This URL expires in 60 seconds.**
2. **Immediately** `curl -X PUT --data-binary @<file> <uploadUrl>`, passing **every** header
   the tool returned, **verbatim** (name and value unchanged — a pre-signed URL's signature is
   sensitive to the exact header set; dropping or altering one breaks the upload).
3. Then EITHER of:
   - **Inline (the default):** put `![<label>](assetUrl)` in a `mcp__linear__save_comment`
     body. Linear recognizes the bare org assetUrl and rewrites it to a signed, rendered
     image automatically — no extra call needed.
   - **Root attachment (reference material):** `mcp__linear__create_attachment_from_upload`
     with the `assetUrl` and a **title that names the state** — e.g.
     `"Baseline — statblock steel-dark"`, `"Design reference — site head band"`.

**One file at a time.** Never call `prepare_attachment_upload` for multiple files up front —
by the time you get to the second PUT, its URL has expired. Prepare, PUT, create; then repeat
for the next file.
