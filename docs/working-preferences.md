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

## Parallel agents

Scott runs multiple agents concurrently (commits authored e.g. "Vexa" may land on
`origin/main` mid-session, in several repos at once). Before committing docs or assuming
HEAD state: `git fetch` and check `origin/main..HEAD` both ways in every touched repo;
integrate by rebasing your commits onto `origin/main` (structural work already landed
wins — re-apply your intent inside the new structure). Doc conventions can change
mid-session; re-read `CLAUDE.md` / doc rules before doc edits.

## Two products, don't conflate

The **DSE Obsidian plugin** (`draw-steel-elements/`, renders element code blocks in
Obsidian) and the **v2 compendium site** (`v2/`, MkDocs, built by steel-etl) are separate
products. The plugin touches the site in exactly one place: `v2/docs/stylesheets/palette.css`
is the read-only source of brand `--sc-*` hex values for the plugin's "Steel" theme.
Visual QA for plugin work happens in Obsidian, not on the v2 site.
