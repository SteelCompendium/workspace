# Working preferences & collaboration conventions

How Scott (project owner) works and what he expects from agents on this project. This file
is the canonical home for preferences and cross-cutting conventions — **never store these
in machine-local agent memory** (Scott works across multiple computers; per-machine state
is invisible everywhere else). Technical footguns belong in their owning doc
(`git-workflow.md`, `worktrees-and-submodules.md`, sub-repo docs), not here.

## How Scott reviews and reports

- He finds issues by browsing the **rendered v2 site** (or, for the DSE plugin, rendered
  elements in **Obsidian**), not the source markdown, and reports them qualitatively
  ("Rapid-Fire isn't linked in the kit table"). His root-cause hunches are often right —
  take them seriously.
- Verify your own work against rendered output too: regenerate (`gen` + `site`) and
  inspect `v2/docs/...`, or use the visual harnesses (plugin:
  `draw-steel-elements/visual-harness/`, `npm run shots` / `npm run obsidian-shots`;
  site: browser screenshots via playwright-core + Brave, see
  `v2/.repo-docs/troubleshooting.md` → e2e section). **Never do blind CSS/design work** —
  render and look.

## Do the right thing over minimizing work

Scott's explicit direction (2026-06-19): *"Stop trying to minimize work. We will always
try to do the right thing, even if that means taking extra time to do it. Consistency is
important."* Don't bias recommendations toward the smallest-blast-radius option or frame
"minimal work" as a virtue. When an existing pattern already solves a parallel problem,
mirror it fully rather than approximating it. Still surface trade-offs and effort
honestly — but recommend the *correct/consistent* option, not the cheapest.

The same instinct applies to coverage: when asked for a "full comprehensive audit" (e.g.
SCC link sweeps), deliver breadth and document what's deferred. He'll accept a
scoped/deferred tail when the rationale is sound. (Linking density policy itself:
`steel-etl/docs/linking-guide.md`.)

## Scott is colorblind — design and evidence implications (disclosed 2026-08-09)

Scott: *"sorry I didnt realize it was purple before; im colorblind"* (SC-132, reacting to
the violet temp-stamina bar he'd perceived as something else — the blue/purple axis at
minimum is unreliable for him). Consequences for all design work and review evidence:

- **Never let hue be the only channel** for a state or category — pair color with shape,
  position, texture, label, or icon (the Steel design language's materials/notches/glyphs
  already lean this way; keep it that way deliberately).
- **Name the colors in prose** when presenting options or describing what a screenshot
  shows ("the violet segment", "amber at winded") — he may not see the distinction being
  discussed, and unnamed color references can silently mislead his picks.
- Blue-vs-purple contrasts specifically should never carry meaning alone.

## Brainstorming & design questions

Prefer **open-ended prose questions** over rigid multiple-choice UI (`AskUserQuestion`):
his design answers are often hybrids the fixed options can't capture, and he'll reject a
single-select to elaborate in his own words. Lead with a recommendation + reasoning and
invite nuance; reserve option lists for genuinely binary/mutually-exclusive forks.

## Surface visible progress

Invisible work (refactors that deliberately preserve appearance, infrastructure) *feels*
like zero progress to someone looking at the running app — that perception cost is real
(2026-07-06: *"what was actually accomplished? we've been burning tokens…"*). So:

1. When work is invisible by design, **proactively explain in plain English what changed
   and why it isn't visible** — before he asks.
2. **Get him in front of rendered output early**; lean toward visible/demonstrable
   milestones.
3. **Right-size review overhead**: full per-task subagent review + top-model final
   reviews are for correctness-critical work; be sparing on low-risk mechanical or
   CSS-value tasks.

## UI principle: explicit read-only states

When a UI can't persist edits (e.g. DSE elements on Obsidian canvas), show that
**explicitly** (badge/banner/disabled affordance) — never let controls look interactive
while silently discarding changes. Prefer a reusable framework-level affordance over a
one-element patch (DSE ships `data-dse-readonly` stamped by the pipeline when
`!canPersist`, plus shared badge CSS).

## Deploy & landing

- Scott decides deploys (`just deploy*`) separately from landing source to `main` —
  don't run deploy recipes unprompted. **Exception to know about:** any push to the
  `v2` submodule's `main` auto-deploys the site via CI — details in
  [`git-workflow.md`](git-workflow.md) → "Committing, merging & deploying".
- **Docs are part of "done"** — route every new fact per the `CLAUDE.md` routing table
  before calling a task complete. He asks for this explicitly.
- His actions to prep-not-run: npm publish, `gh release create`, release calls — reduce
  them to a queued 5-minute action (Linear comment + exact commands).

### ⛔ NEVER create a tag or release on `draw-steel-elements` (standing order, 2026-07-31)

**No tags. No GitHub releases. Not even an RC or pre-release tag.** Scott's words: *"Do not
make any tags (even rc tags... that's how we got into the mess)."*

This is not caution, it is scar tissue. `6.0.0-rc1` was published as a regular GitHub
release; Obsidian auto-updated ~120 real users onto a release candidate, and because
`6.0.0-rc1` is not a valid `x.y.z` plugin version the plugin was **delisted from the
community store**. Recovery cost a burned major version (6.0.0 is permanently retired), a
throwaway `6.0.1` re-release of 5.1.1, and days of waiting on Obsidian's mirror.

- **7.0.0 is gated on the DSE visual overhaul being fully complete** (SC-97), not on the
  code merely working. Scott's call, stated 2026-07-31.
- Tagging/releasing is **Scott's action alone**. Prep it — bump commands, changelog slice,
  the exact `gh release create` line — and hand it over. Never run it.
- If a beta is ever needed: **BRAT**, not a tag. If a GitHub release is truly unavoidable,
  "Set as a pre-release" must be ticked *and* the manifest version must stay strictly
  `x.y.z` — but the default answer is still no.

## Linear: approval asks must be self-contained (Scott's rule, 2026-08-08)

When a ticket needs Scott's approval, **the last comment must contain a clearly-marked
section stating exactly what he is being asked to approve — self-contained, even if that
duplicates images or content from earlier comments.** He should never have to scroll the
thread to reconstruct the ask. Shape: a heading like "**What you're approving**", the
enumerated decision(s), and the deciding evidence (images inline, re-uploaded if needed)
right there in the same comment. The operational side lives in the `linear-flow` skill.

## Linear: screenshots are the review medium (Scott's rule, 2026-08-02)

Scott reviews visual work *in Linear, from the attachments*. Two standing rules:

- **Default: images go INLINE in comments** (Scott, 2026-08-02) — context text travels with the
  image, and the thread becomes a change-over-time visual history he can review and comment on.
  Before/after pairs and A/B candidate sets are posted inline in the narrating comment **before**
  the issue is flagged `Needs Review`.
- **Root-level attachments are reserved for durable reference material** — the baseline "before"
  shot, design-reference/target images guiding implementation — things findable without
  scrolling the thread.

Operational mechanics (the exact tool-call sequence, curl shape, and the 60-second-expiry
footgun) live in the `linear-flow` skill (`.claude/skills/linear-flow/`) — read it before
attaching screenshots.

## Linear status & label convention (Scott's rule, 2026-07-31)

Team: **Steel Compendium** (`SC-*`). Statuses mean specific things — don't improvise.

| State | Means |
|---|---|
| **Todo** | Not yet started. Nothing is happening and nobody is waiting. |
| **In Progress** + **`Needs Review`** label | **Needs Scott.** A decision, a taste check, a "can this close?" — anything requiring his eyes. **Both** the status and the label, always together. |
| **Awaiting** | An **agent is actively working it**, *or* it is blocked on something **external** (an upstream publish, a third party, a mirror). Not a parking spot. |
| **Backlog** | Someday/maybe. |
| **Done** / **Canceled** / **Duplicate** | Terminal. |

The operational side of working this convention (thin-ticket comment rule, screenshot
attachment mechanics) lives in the `linear-flow` skill (`.claude/skills/linear-flow/`).

Rules that follow from this:

- **Never leave something in `Awaiting` because it is merely blocked on other internal work** — that is `Todo`. `Awaiting` implies motion or an outside party. (SC-11 and SC-4 had both drifted into `Awaiting` this way and were corrected.)
- **When you need Scott's input, don't bury it in a report** — set the issue to `In Progress` + `Needs Review` so it shows up when he filters. A question he never sees is a blocked project.
- **If a ticket needs review but has a thin description** (old TaskNotes imports especially), **add a comment saying what he is actually being asked to look at** and where. "Needs Review" with no context just moves the confusion.
- Filtering the `Needs Review` label should always give a complete, current list of what is waiting on him. Keep it honest — remove the label when the answer lands.

## The orchestrator workflow (Scott's preferred mode, 2026-08-10)

Multi-ticket sessions run with **the top model as an orchestrator that implements nothing**:
background agents in isolated worktrees do all code changes; the orchestrator dispatches,
watches, reviews (independent adversarial review before any landing-bound merge), gates
through Linear, and lands. Scott: *"This session with you as a sort of orchestrator that
delegates off work is working really well. I would like to do work in this workflow more
often."* The full operating rules, footgun index, and new-machine bootstrap live in the
**`orchestrate` skill** (`.claude/skills/orchestrate/`). Entering the mode is a prompt away
("orchestrate the open DSE tickets") — the skill makes it deterministic.

## Parallel agents

Scott runs multiple agents concurrently (commits authored e.g. "Vexa" may land on
`origin/main` mid-session, in several repos at once). Before committing docs or assuming
HEAD state: `git fetch` and check `origin/main..HEAD` both ways in every touched repo;
integrate by rebasing your commits onto `origin/main` (structural work already landed
wins — re-apply your intent inside the new structure). Doc conventions can change
mid-session; re-read `CLAUDE.md` / doc rules before doc edits.

### `.superpowers/sdd/` is shared global state — namespace your ledger (learned 2026-07-31)

Worktrees isolate *code*; they do **not** isolate the SDD scratch dir. `.superpowers/sdd/`
lives in the **shared main checkout**, so every concurrent effort writes to the same
namespace. Generic filenames (`progress.md`, `task-3-report.md`) get silently overwritten by
whichever agent finishes last. This has already cost real build history: the plan-20 ledger
opens with *"(Previous ledger for SC-88 — complete and landed — overwritten here.)"*, and the
tree carries the scars of after-the-fact disambiguation (`task-3-report-{d3,d4,sc88}.md`,
`task-8-report.plan-18-stale.md`).

**Rule: prefix every ledger, brief, report and diff with the effort ID from task 1** — plan 21
did this right (`p21-progress.md`, `p21-task-N-report.md`). Never open a bare `progress.md`.
Alternative: keep the ledger inside its own worktree, but then **copy it out before
`just wt-rm`** — the dir is gitignored and `wt-rm` is `rm -rf`.

A related hazard: an agent working in a worktree can still *leak edits into the shared main
checkout* (plan 21's Task 5 caught and reverted exactly this). If you touch anything outside
your worktree path, verify `git -C <main-checkout> status` is clean before reporting done.

## The v2 site is a reference, not gospel (Scott, 2026-08-02)

The v2 site is **MVP-state** — usable as the design reference for plugin parity work, but not
the polished finished product. Consequence for parity efforts: when the plugin's design is
*better* than the site's (e.g. the kit signature-ability inline render), the right move is to
**converge on the best design and file a v2-site ticket** to bring the site up — never to
degrade the plugin to match an MVP page. "Do the right thing" (his standing preference)
explicitly extends to changing the site when parity work reveals its gaps.

## Two products, don't conflate

The **DSE Obsidian plugin** (`draw-steel-elements/`, renders element code blocks in
Obsidian) and the **v2 compendium site** (`v2/`, MkDocs, built by steel-etl) are separate
products. The plugin touches the site in exactly one place: `v2/docs/stylesheets/palette.css`
is the read-only source of brand `--sc-*` hex values for the plugin's "Steel" theme.
Visual QA for plugin work happens in Obsidian, not on the v2 site.
