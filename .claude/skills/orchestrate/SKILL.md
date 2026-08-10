---
name: orchestrate
description: Use when running a multi-ticket session as an orchestrator — the top model coordinates, gates, and reviews while background agents in isolated worktrees do all implementation. Battle-tested across the 7.0.0 endgame (2026-08-08 → 08-10).
---

# Orchestrate

## Overview

The operating mode that shipped the DSE 7.0.0 endgame: **the orchestrator (Fable, or the
most capable available model) never implements — it dispatches, watches, reviews,
gates, and lands.** Background agents in isolated worktrees do every code change. The
orchestrator's context stays lean enough to hold the whole board: every ticket's state,
every agent's status, Scott's rulings, and the review pipeline.

Enter this mode when Scott says some form of "work the backlog / kick off work /
orchestrate," or when more than one independent effort is in play. For a single small
task, a single worktree agent (or direct work in a worktree) is fine — this skill is for
running a *board*.

**Required background:** `land-stack` (landing), `linear-flow` (tickets/screenshots/asks),
`dse-verify` (plugin gates), `docs/working-preferences.md` (Scott's rules — colorblind
color-naming, self-contained asks, do-the-right-thing), workspace `CLAUDE.md` (worktree
rule #1, doc routing).

## The operating rules

1. **The orchestrator edits nothing except orchestration bookkeeping** in the main
   checkout: `docs/handoffs/HANDOFF.md`, `FOLLOWUPS.md`/`ROADMAP.md`, changelog
   promotions, skills/docs, `.superpowers/sdd/` scratch. All code changes happen in
   worktrees (`just wt-new <ticket-slug>`), by agents.

2. **One worktree per effort; landings serialize.** Land via the `land-stack` skill from
   the main checkout. Every branch rebases onto `origin/main` at landing (worktree
   submodule clones have **independent refs — fetch in the clone**, not the main
   checkout). After any landing, message still-running agents whose branches went stale
   (new main sha + new battery baselines).

3. **Dispatch shape.** Background `Agent` per effort. Model tiering: **Opus** for design,
   judgment, reviews, anything open-ended; **Sonnet** for well-specified implementation
   and scoped re-reviews; the orchestrator model implements nothing. Every brief is
   self-contained and assumes the agent may later be REPLACED by a fresh one:
   - a context-loading section: the Linear ticket (read issue + ALL comments), the
     `.superpowers/sdd/<effort>/` reports from prior rounds, the worktree path + branch,
     a fetch-and-rebase-first instruction carrying the current main sha and battery
     baselines;
   - the task, with Scott's rulings quoted or precisely paraphrased;
   - gates (point at `dse-verify`; state expected numbers);
   - the Linear deliverable (point at `linear-flow`; self-contained ask, inline images,
     labels are REPLACE-not-merge on `save_issue` — pass the full set);
   - report path (`sdd/<effort>/`, effort-prefixed filenames) + a short return contract.
   Context travels in **files and Linear comments, never conversation memory**.

4. **Continuity ladder.** To continue an agent: `SendMessage` resume first (works after
   stalls, session-limit kills, and even completion). On "No transcript found", dispatch
   a fresh agent whose brief loads context from the files (this is why rule 3 exists).
   Agents that park waiting on long background jobs (mkdocs, shots): don't wait for a
   notification that won't come — start a background watcher (`while kill -0 <pid> …`)
   and wake the agent via SendMessage when the job exits; tell agents to redirect
   long-running output to files rather than streaming (the 600s stream watchdog kills
   silent agents).

5. **The review pipeline** (for anything correctness-critical or landing-bound):
   implementer → **independent reviewer** (Opus; instruct it to *execute and probe*, not
   just read — jsdom probes, decompiling vendored bundles, re-running the battery,
   regenerating screenshots; findings by severity with file:line, failure scenarios, and
   prescribed fixes) → fix rounds (resume the implementer with findings verbatim) →
   **scoped re-review of the delta only** → land. Design/evidence rounds skip review;
   Scott's eye is the gate there. This pipeline caught a free-healing regression, a
   vacuous test suite, and a preview-vanishing lifecycle bug that 2000+ green tests
   missed — it is not optional for release-bound code.

6. **Evidence discipline.** The orchestrator personally eyeballs key boards/screenshots
   before relaying to Scott (his eye has caught what agents missed; yours must try
   first). Name colors in prose everywhere (Scott is colorblind —
   `working-preferences.md`). Every ask to Scott is a self-contained last comment
   (`linear-flow`). Between gates, keep his Needs Review filter honest.

7. **Ledgers and snapshots.** Each effort's reports live in
   `.superpowers/sdd/<effort>/` (effort-prefixed files — the dir is shared global
   state). At landing, preserve anything worth keeping to
   `docs/superpowers/dse-overhaul/build-ledgers/` (or the effort's equivalent). Update
   `docs/handoffs/HANDOFF.md` at wave boundaries and before compaction: every in-flight
   agent, its report dir, and the gate queue — the post-compact session resumes from it.

## Footgun index (each cost real time once)

- **Exit codes:** never pipe gate commands (`| tail` eats failures); devbox's `sh`
  wrapper eats `$?`/`$PIPESTATUS` — run gates via wrapper script *files* that capture
  the code, or bare commands with output redirected to files.
- `npm ci` after any rebase that changed `package.json`'s obsidian version (stale
  node_modules → phantom tsc errors).
- **FOLLOWUPS stale-base hazard:** a worktree's `FOLLOWUPS.md` edit is based on old
  main; merging wholesale deletes main's newer entries and rolls back `next-id`.
  Hand-merge at landing: keep main's entries, renumber the worktree's addition to the
  next free number. (Happened three times in one week.)
- `mcp__linear__save_issue` **labels REPLACE** the full set, and state/label saves
  occasionally no-op silently — verify the response, retry once.
- Agents' harness may block report-file writes — briefs must say "return inline if the
  write is blocked."
- The freeze baseline (`.superpowers/sdd/freeze-baseline.sha256`) is **machine-local**
  (screenshot bytes are not portable across machines). On a new machine, regenerate it
  from a clean `main` checkout before trusting freeze gates — procedure in `dse-verify`.

## New-machine bootstrap (work computer)

Everything that matters is in the repo; the machine needs:

1. `git clone --recurse-submodules git@github.com:SteelCompendium/workspace.git`
   (or `just bootstrap` after a plain clone), plus devbox installed.
2. Claude Code, logged in to the account with Fable + Opus/Sonnet access.
3. The **Linear MCP server** connected (it is user-level config, not in the repo —
   without it the whole gating loop is blind; verify with a `list_issues` call).
4. Regenerate the machine-local freeze baseline from clean main (`npm run shots` in a
   verified-clean checkout, then hash the legacy+print set — `dse-verify` has the
   current line count to sanity-check against).
5. Optional: the superpowers plugin (SDD skills) — useful, not required; this skill +
   the repo skills carry the workflow.

Then a prompt like *"orchestrate the open DSE tickets"* re-enters this mode.
