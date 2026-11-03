# SC-548 decisions ledger

Ticket: SC-548 "A Live Preview pane also redraws DSE blocks in its hidden Reading view on every write to an embedded note" (DSE 7.0.0, Backlog, Low; split out of SC-472).
Worktree: /home/scott/code/steelCompendium/worktrees/sc548-lp-hidden-reading-redraw (branch sc548-lp-hidden-reading-redraw in every submodule), dse cut at develop 0698550f.
Owner: ticket-owner (Opus 5.5), session be71a0a9-199f-4e14-967b-191935312b05.

## Scott rulings (verbatim, dated)

None yet. The thread had 0 comments on 2026-11-02.

## Ticket text (filed by an agent during SC-472 r1; not a Scott ruling)

> **Possible direction (not decided):** skip or defer the DSE render when the host is a Reading view that is not the leaf's current mode. Measure how much of the write-to-redraw latency it accounts for first.

## Dispatcher task (2026-11-02; an agent instruction, not a Scott ruling)

> The ticket's direction is NOT decided: measure first how much of the write-to-redraw latency the hidden Reading-view render accounts for, then decide (skip/defer the render when the host is a Reading view that is not the leaf's current mode, or close as not worth it). If the right call is genuinely Scott's, park it on him with a recommendation.

Overlap constraints (from the dispatcher):
- SC-472 (landed) owns the scroll pin/hold + backstop. G-S8, G-S52, G-S59 must stay green.
- SC-547 (running) changes the LP twin check in ReadingModeBlockHost.ts.
- SC-552 (running) changes twin form saves (likely ReadingModeBlockHost.replaceSource).
- SC-545 (running) is the plugin off/on LP callout path and claims G-S63; SC-552 claims G-S64.
- A new lifecycle scenario from this ticket is G-S66, in part 3 or part 4, before G-S56 ("G-S56 must stay last").
- Do not edit .claude/skills/dse-verify/SKILL.md in the branch; proposed text goes to a proposal file in this dir.

## Owner rulings

- 2026-11-02: Round r1 is measurement only (reviewer tier, prototype in scratch, nothing committed). The decision (skip / defer / close / park on Scott) is made after r1.

## Rounds

| Round | Role | Author | Report |
|---|---|---|---|
| r1 measure | orchestration:reviewer | reviewer-A (agent ae113729d519c82ff), dispatched 2026-11-02 | sc548-r1-measure-report.md |

## r1 result and owner rulings (2026-11-02)

r1 (reviewer-A) verdict: close as not worth it. A Live Preview leaf's hidden Reading view never runs a DSE render on Obsidian 1.15.0: `MarkdownPreviewRenderer.onRender` returns at once when `!(previewEl.offsetParent && previewEl.offsetWidth > 0)` (owner verified the string in the extracted 1.15.0 app.js). 0 DSE processor calls / renders / pins / holds in hidden views over 72 LP writes and all of G-S8/G-S52/G-S59. Obsidian's own hidden-view work: 0.0-0.5 ms at 1x, 1.2-7.4 ms at 8x, under 0.1% of write-to-paint. SC-472 r1's `mh3rd` events were visible Reading renders from G-S52's `openHost` (opens hosts in Reading) falling into the previous write's timeline window.

- 2026-11-02 owner ruling: **close SC-548 as Canceled** (premise does not reproduce; nothing to skip). No code change, no jest test, no G-S66. The scratch skip prototype is not shipped.
- Follow-up "SC-472 r1 report's follow-up line needs a doc correction": **fold** — append a dated correction note (do not rewrite history) to the tracked `docs/superpowers/dse-overhaul/build-ledgers/sc472-scroll-pin-timer/sc472-r1-design-report.md` Follow-ups item, in the worktree superproject; preserve this ledger dir as `build-ledgers/sc548-lp-hidden-reading-redraw/`. Superproject-only commit; dispatcher lands.
- Side finding "after outside writes, switching an LP leaf to Reading first paints the old hidden DOM (stale card 0.7-1.45 s, blank embed 0.45-0.9 s)": **drop, no ticket** — it is Obsidian's renderer re-rendering on the mode switch, it self-corrects, and a DSE skip/defer cannot change it. Recorded in the SC-548 closing comment so it is searchable.
- Side finding "G-S59: 2 DSE renders finished inside a hidden LP editor of a Reading-mode leaf (`LPHIDDEN-noshow` x2, same on both bundles)": **drop, no ticket** — r1 Q1 shows `setViewData(data,false)` updates only the current mode, so a hidden editor gets no write-driven render; two events in a scenario that changes leaves fit a render in flight at the switch; no user-visible effect.

| r2 docs | orchestration:chore | chore-A (agent a8a7a63a19c6e5ebb) | superproject commit c3002a5e (ledger preserved + SC-472 r1 correction line) |

- 2026-11-02: closing comment posted (sc548-comment-close.md), SC-548 -> Canceled (verified). Land-ready reported to the dispatcher: superproject-only c3002a5e, no submodule change. (The preserved copy in c3002a5e predates this last entry.)
