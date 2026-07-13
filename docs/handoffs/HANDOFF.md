# Handoff — 2026-07-13 (D1–D5 + D9 + F2-OD-1 all landed · Fable access EXTENDED to 2026-07-19 · fresh session should start here)

## Active efforts
- **DSE plugin → 6.0.0** — **IN FOCUS.** The build wave is far ahead of the review wave:
  D1–D5, D9, F4/F5 (cameras), SC-10 (Steel pass) are all **landed on plugin main
  `4d09614`**; F2's first cross-repo gate (OD-1) is landed on steel-etl main `117eb9f`.
  What blocks further feature work is mostly **Scott's queue** (below), plus two 5-minute
  Scott-gated F2 actions that unblock D6/D8.
- **Fable access extended to 2026-07-19** — the "maximize Fable" directive has runway
  again. Preferred division of labor (proven over plans 13–15): Fable/Opus for planning +
  hard implementers, sonnet for mechanical implementers + task reviews, **Opus for every
  whole-branch final review**. Fable session caps WILL kill subagents mid-flight —
  always have them write artifact files first, and check worktrees/plan dirs for
  committed-but-unreported work before re-dispatching.
- **Linear "Steel Compendium" → "DSE 6.0.0" project is the live tracker.** Done w/ full
  comments: SC-5 (D9), SC-7 (D5), SC-8 (D4), SC-9 (cameras). SC-6 = F2 gate assessment +
  OD-1 closure. SC-10/SC-11/SC-4 = earlier progress + Scott's open calls.

## You are here
Clean stop; **nothing in flight**. The next agent should NOT start new feature work
unprompted: D6/D8 are F2-gated, D7 needs D5+D6. With Scott present, the highest-value
next moves are (in order):
1. **Scott's play/QA pass** on D5 rolling + D9 authoring (see "For Scott").
2. **F2 unlock pair** (Scott-gated, agent-preppable): SDK 3.2.0 publish prep
   (data-sdk-npm CHANGELOG backfill + version bump; Scott runs `just release 3.2.0`) and
   the data-release-zip deploy step (OD-2; Scott runs the deploy). Then plan F2 proper
   (plugin sync service + SDK 3.x upgrade — spec `F2-data-unified-sdk-integration-spec.md`),
   which unblocks **D6 → D8 → D7**, all Fable-plannable like plans 13–15.
3. Without Scott: only the deferred-polish tail (Linear SC-4 + the plans' post-plan
   deferral lists) is safely autonomous.

## The program map (workspace `docs/superpowers/dse-overhaul/`)
- `README.md` — effort map (Spec/Build columns, current). `REMAINING-TASKS.md` — the
  deferral catalog (incl. D9 v1 deferrals, relocated 2026-07-12).
- Plans 11–15 in `plans/` are all stamped BUILT+LANDED with their landing SHAs; plans
  13–15 headers carry OD-resolution tables **Scott has not yet vetoed**.
- `build-ledger-plans-01-12.md` — archived SDD ledger (plans 13–15 have no ledger; their
  task-by-task record = the Linear comments + `workspace/.superpowers/sdd/*report*.md`
  scratch, which is git-ignored and may be clobbered by future runs — Linear is canonical).

## For Scott (the consolidated queue)
1. **Try the new features** (demo vault `workspace/draw-steel-elements/demo-vault/` has a
   current build): Settings → Rolling → Enable rolling (+ click-to-roll); Settings →
   Authoring → Editing controls → the ✎ pencil/form; `/ds` in the editor; a
   ```` ```ds-roll ```` block; in-fence autocomplete.
2. **Veto passes**: Plan 13/14/15 header OD tables; the Steel taste calls
   (PROPOSED-labeled in styles-source.css: tier-crit/vp gold, stamina-temp blue-vs-purple);
   the settings-preview read-only-badge exception (D4).
3. **F2 unlock pair** (5 min each): `just release 3.2.0` in data-sdk-npm (after agent
   prep); OD-2 zip step + first `gh release create` at next deploy. NOTE: next deploy's
   regen will include the new `ds-sb`/`ds-fb` blocks in data-unified (intended).
4. **Manual smoke tests**: live Dice-Roller-plugin delegation (D5 OD-3 — fallback is
   unit-proven, this is confidence only); retire `~/Documents/draw-steel-elements-demo`
   whenever (repo vault confirmed working — he opened it 2026-07-11).
5. **SC-11**: the 6.0.0 release call whenever the gate feels satisfied.

## Gotchas & lessons (durable, this window)
- **Fable caps**: 3 subagents died mid-flight across the window; all recovered from
  on-disk artifacts (plan files, uncommitted worktree diffs). File-first, then report.
- **wt-finish races**: direct pushes to a submodule's main between wt-new and wt-finish →
  non-FF push and/or superproject submodule CONFLICT. Fix: rebase the env branch onto the
  submodule's origin/main (+ re-run its tests), re-bump the pointer, wt-finish; if the
  superproject merge conflicts, take the env pointer, commit the merge, `git submodule
  update`, `just _submodules-on-branch`, push. Happened twice; both clean.
- **Another session lands steel-etl/site work concurrently** (SC-79/SC-83 etc.) — always
  fetch/rebase before landing into steel-etl.
- devbox dirties `devbox.lock` on every run (restore inside the same devbox session
  before wt-finish's clean check); devbox eats `$?` in inner shells.
- Plugin invariants the test suite enforces (don't fight them): theme token pins
  (steel 58+6 / light 31 / print 41+6+17), fixtures↔registry equality (a 13th element
  needs example.yaml + aliases.json in the same commit), byte-compat serialize, golden
  default renders. Camera batteries: shots 64, obsidian-shots 48.
- The edge/bane rulebook rule is **cap-before-cancel** (`min(e,2)−min(b,2)`) — the old
  "cancel 1-for-1" wording was wrong and got corrected in `reference/draw-steel-reference.md`.

## Verified state (as of this handoff)
- Plugin main `4d09614` · steel-etl main `117eb9f` · workspace main (this commit's
  parent) — all pushed; main checkout clean + synced; no session worktrees remain (only
  the pre-existing `cardhead-spacing` env — not this session's, untouched).
- Gates at plugin main: tsc 0 · jest **1191** · `npm run shots` 64/64 ·
  `npm run obsidian-shots` 48/48 · go build/test green at steel-etl main.

## Verification commands
```bash
cd /home/scott/code/steelCompendium/workspace
git fetch origin && git status -sb | head -2                      # up to date w/ origin/main
git -C draw-steel-elements log --oneline -2                       # 4d09614 …
git -C steel-etl log --oneline -1                                 # 117eb9f feat(dse): emit ds-sb/ds-fb …
git status --short && git -C draw-steel-elements status --short   # clean (devbox.lock churn = restore)
devbox run -- bash -c 'cd draw-steel-elements && npx jest 2>&1 | grep Tests:'  # 1191 passed
ls ../worktrees/                                                  # only cardhead-spacing
```
**Resume protocol:** read this file + the Linear DSE 6.0.0 comments (SC-4/5/6/7/8/9/10/11),
run the commands above, **restate you-are-here/next-action/drift and WAIT for Scott's
pick** from "You are here" — don't start F2/D6/D7/D8 without him.
