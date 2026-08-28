# SC-264 decisions ledger

Ticket: SC-264 — Workspace documentation prune (orchestration-v2 shakedown)
Owner: Fable ticket-owner, session 7b0558b6-e711-4b89-944d-9269d6b32a11
Worktree: sc264-docprune

## Scope (from ticket description, 2026-08-28)

> Prune the following workspace docs for bloat, following the router rules in CLAUDE.md:
> * ARCHITECTURE.md
> * docs/git-workflow.md
> * docs/scc-reference.md
> * docs/scc-log.md (if applicable)
> * Sub-repo CLAUDE.md files
>
> ### Known items to address:
> * `steel-etl/CLAUDE.md:232` still carries a live routing rule pointing at the deleted
>   workspace FOLLOWUPS.md (submodules were off-limits during the migration) — update to
>   "file a Linear Backlog ticket".
> * Sweep remaining live-doc FOLLOWUPS/ROADMAP references in submodule docs (v2,
>   draw-steel-elements) the Task 8 report's disposition table lists as deferred.

## Rulings (verbatim, dated)

- **2026-08-28 (Scott, ticket comment):** "land it"
  — in reply to the land-ready summary whose ask was "OK to close SC-264 once this lands?
  The two judgment cuts below are the things to eyeball — both easy to revert if you
  disagree." Read as: landing sanctioned, both judgment cuts accepted, close on landed.

## Owner verifications (2026-08-28)

Ticket-owner verified via Linear (workers never touch the tracker):

- **SC-212** = "Monsters/Summoner per-ability coding for statblocks & featureblocks"
  (was ROADMAP #15) — correct target for per-ability-coding deferral pointers.
- **SC-213** = "Extract a shared steel-design token/CSS package for site + plugin"
  (was ROADMAP **#17**) — confirms the workspace CLAUDE.md's "(×12, 2026-06-19 — SC-213)"
  tag on fixture advancement members was WRONG (that work was ROADMAP #16, shipped
  2026-06-19, never migrated because terminal). Implementer's removal is correct.
- **SC-218** = "Settings panel: re-enable 'Color theme' and 'Ability card style'"
  (was FOLLOWUPS **#3**) — its "re-adding the two markup blocks" text matches
  `v2/.repo-docs/architecture.md:156`'s content; the old "#6" citation there was wrong.
  Implementer's J3 re-adjudication to SC-218 is correct.

## Review round 1 outcome (2026-08-28)

Independent reviewer (Opus): **APPROVE after M1**. HIGH 0 / MEDIUM 2 / LOW 5 / INFO 4;
J1–J8 all sustained. Findings file: `sc-264-review-findings.md` (this dir).

Owner dispositions:

- **M1 (fix round):** `docs/git-workflow.md:87-88` false pointer — the pruned prose held
  the only copy of the 2026-08-16 recovery commands; `land-stack/SKILL.md` has none.
  Fix: recover the commands from `git show origin/main:docs/git-workflow.md`, home them in
  `.claude/skills/land-stack/SKILL.md` (routing table: workflow-with-footguns → skill), and
  make the git-workflow.md pointer accurate.
- **M2 (deferred → ticket filed):** villain-action banding deferral lost its handle in the
  2026-08-27 migration. **SC-265 filed as the replacement handle**; fix round cites it at
  `draw-steel-elements/.repo-docs/architecture.md:309-311`.
- **LOW selector-map.json (deferred → ticket filed):** **SC-266** — JSON is out of scope
  for SC-264 (docs-only guardrail over the parity harness). Do NOT touch in the fix round.
- **LOW fixes (fix round):** parity README deferral-table rows gain SC-225/226/235
  alongside legacy #39/#40/#51 (prose only); `steel-etl/CLAUDE.md:82,154` dated sentences;
  `steel-etl/docs/statblocks.md:106,140,166` unqualified workspace paths;
  `steel-etl/docs/linking-guide.md:56` reworded to state deferral status explicitly
  ("deliberately deferred; not currently tracked" — the handle is unresolvable per J1).

## Fix round outcome (2026-08-28)

All 6 fixes applied; 3 new commits: workspace `4726685`, steel-etl `a7b8d92`,
draw-steel-elements `16e25ff` (v2 unchanged at `9782209ec5`). Gates clean (17 legitimate
grep survivors matching the reviewer's stricter count; 0 broken links; only `.md` paths).
Notables: M1 fixed the fact-preserving way — new `land-stack/SKILL.md` §7 "Recovery — a
push landed on the wrong branch" (+1,668 chars, recovered from `origin/main` prose +
HANDOFF:818-830); statblocks.md `:279` fixed as same defect class (`:106` was already
qualified). Owner confirms the land-stack SKILL.md edit is in-bounds — it was the
owner-chosen M1 fix.

Owner deferral rulings at fix-round close:
- **I2/J2 (ROADMAP #16 archive gap) → deferred, ticket SC-267 filed.**
- **J6 (brief's gate-regex under-exclusion) → no action**: effort-internal artifact; both
  workers used stricter regexes; nothing in the repo to fix.

## Scoped re-review outcome (2026-08-28)

**Land-ready after one fix.** M1/M2/L1/L3/L4 all verified fixed (M1 checked
command-by-command against pre-prune prose + HANDOFF); scope clean. New findings:

- **R1 (MEDIUM, fix now)** — `steel-etl/docs/linking-guide.md:55-58`: the L5 wording
  ("not currently tracked; handle did not survive the migration") is FALSE — the item was
  completed and archived at `docs/followups-archive/2026-06-11-completed.md:45`
  ("was FOLLOWUPS #7, done 2026-06-11, zero WARN"), and `linking-guide.md:39-40` already
  states baseline 0. Reviewer owns the error (its L5 prescription skipped the archive
  check); implementer executed faithfully. Fix with the reviewer's prescribed historical
  wording pointing at the archive entry.
- **R2 (LOW, fix now)** — `land-stack/SKILL.md:186`: "Every recovery push is lease-guarded"
  is literally false (step 2 is a plain push) → "Every force push here is lease-guarded".
- **R3 (INFO, no action)** — dse architecture.md "handle was lost in migration" is an
  inference; harmless now that SC-265 exists.
- **R4 (INFO, fix now — trivial)** — `land-stack/SKILL.md:183,205` + `git-workflow.md:87`
  cite "§1.0"/"step 1.0" but the block is labeled `# 0)`; align the citations.

## Final confirmation (2026-08-28) — LAND-READY

Micro-fix round: workspace `756e6a0`, steel-etl `c7d6940`. Reviewer confirmed R1/R2/R4
closed, scope clean, nothing new. Provenance settled: FOLLOWUPS #7 is two items — the
beastheart #7 resolves (archive 2026-06-11:45), the Family Malice #7 remains unresolvable;
J1 stands, the reviewer's L5 over-generalization caused R1.

**Full land-ready commit set** (branch `sc264-docprune`, nothing pushed; superproject
pointer bumps deliberately uncommitted for landing):
- workspace: `9c85263`, `b747d2d`, `4726685`, `756e6a0`
- steel-etl: `cf32767`, `a7b8d92`, `c7d6940`
- v2: `9782209ec5`
- draw-steel-elements: `5124ed9`, `16e25ff` (tracked branch: develop)

Backlog tickets filed this effort: SC-265, SC-266, SC-267 (all link SC-264).

## Landed & closed (2026-08-28)

Dispatcher landed via land-stack: steel-etl `c7d6940` + v2 `9782209ec5` on `origin/main`,
draw-steel-elements `16e25ff` on `origin/develop`, workspace superproject merge `6b7974d`
+ ledger-preservation commit `7a5367b`
(`docs/superpowers/dse-overhaul/build-ledgers/sc264-docprune-ledger.md`). Clean
fast-forwards; pre-existing dse vault dirt stash-wrapped and restored (unrelated);
worktree torn down. Closing note posted via linear-post.py; SC-264 verified **Done**,
labels empty. Effort complete.
