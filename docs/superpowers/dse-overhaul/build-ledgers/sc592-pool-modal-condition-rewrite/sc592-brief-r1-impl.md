# SC-592 r1 — implementer: plain-string conditions stay plain strings on every ds-initiative write

You are an `orchestration:implementer`. Your final text goes to the ticket-owner, not a human.

> **UPDATE 2026-11-11 (supersedes the base and numbers below):** dse develop is now `94133a5a` (SC-595 landed).
> Rebase onto `94133a5a`; red-on-base is against `94133a5a` src. Baseline: jest 7238 passed / 2 skipped (fresh worktree) ·
> lifecycle 55/55 in five parts 21 + 16 + 9 + 4 + 5, part 5 = `G-S59 G-S49 G-S73 G-S77 G-S83`, G-S56 last in part 4 ·
> e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` · shots 592, 163/978, 39/234, clip 147 · freeze 280/280 · parity 0/0/24.

## 1. Context loading (read in this order)

1. Ledger — the source of truth, rulings quoted there are binding:
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/decisions.md`
   (read "Owner rulings on r0" in full).
2. Survey report (open with its executive summary; dive into sections 1-5 as needed):
   `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/sc592-r0-survey-report.md`
   Its probe (reuse it as a starting point for your jest tests) is in
   `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r0-survey-R0/`
   (`sc592-probe.test.ts`, `out/*.yaml`, `sc592-diffs-today.txt`, `sc592-diffs-options.txt`). Do not edit or delete that dir.
3. Prior art for the pattern: SC-466 — `src/elements/stamina-bar/model.ts` (module-private WeakMap of what
   the source omitted; serialize consults it). Ledger:
   `/home/scott/code/steelCompendium/workspace/docs/superpowers/dse-overhaul/build-ledgers/sc466-stamina-bar-defaults-ledger.md`.
4. Gate skill: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md` (~2000 lines;
   read "The battery, in order" through "THE exit-code footgun" (lines ~20-217) and the e2e notes; do not read it all).
5. Plugin repo guidance: `draw-steel-elements/AGENTS.md` (or CLAUDE.md) in your worktree.

**Worktree:** `/home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite` — every submodule on
branch `sc592-pool-modal-condition-rewrite`. Plugin: `.../draw-steel-elements`, at dse develop `ec26b709`.
Superproject branch cut from origin/main `f2cb454b`. Verify `pwd`/`git -C <abs> log --oneline -1` before any write.
First: `git -C <worktree>/draw-steel-elements fetch origin` and confirm `origin/develop` is still `ec26b709`;
if it moved, rebase onto it and say so. The worktree has no `node_modules` — run `npm ci` in the plugin dir (via devbox) first.

**Workers never call the tracker** (Linear) — not to read history, not to post. Everything you need is in files.

The main checkout's dse dirt (`demo-vault/Welcome.md` modified, untracked `compendium-manifest.json` /
`demo-vault/*.md`) is Scott's live vault — expected, not yours. Never touch the main checkout.

## 2. Task

Ticket (verbatim): "When a condition is removed in the minion pool modal, the whole block is written back.
Conditions the user wrote as plain strings come back as `{key: ...}` objects, and quotes are dropped. The note
still works, but the user's hand-written text changes shape when they only meant to remove one condition.
Decide whether this is intended. If it is not, a removal should change only the condition that was removed."

Owner verdict (ledger): NOT intended. Implement the ruling quoted here from the ledger:

> FIX = survey option "A by holder", in `src/elements/initiative/model.ts` only (not the modal):
> at parse, record per holder (hero / squad-minion instance / regular instance) which condition
> keys the user wrote as plain strings (module-private WeakMap keyed by the holder, same pattern
> as SC-466's `model.ts`). At serialize, a condition entry whose key is in that holder's
> recorded set AND that still carries nothing but `key` is written back as a plain string.
> Everything else is written as today. Consequences that are intended:
> - a removal changes only the removed line (for shape); an unrelated write changes no condition's shape;
> - if the user later gives that condition an icon/colour/effect/duration via the Conditions modal,
>   it becomes an object (it now has data a string cannot hold);
> - a condition the plugin adds itself keeps today's output (`- key: x`) — SC-466 rule: plugin-constructed
>   output unchanged;
> - an object the user wrote as `- key: hexed` stays an object (survey: option D would break this; rejected).
>
> FOLD (same function, same class): authored condition objects keep their unknown keys on write
> (survey: `source: trap` deleted = data loss). Keep authored key order within an authored object
> where cheap; report if not.

Notes:
- "Still carries nothing but `key`": an entry that has gained a non-empty icon/color/effect/duration is an object.
  Decide how `undefined`/empty fields count (SC-466 LOW-2 precedent: a present-but-`undefined` field = absent). Pin it in jest.
- Make sure the memory survives the paths the survey names: the Conditions modal copying entries
  (`ConditionsModal.ts:130`, `view.ts:2177`), the pool modal's position-based removal (`MinionStaminaPoolModal.ts:674`),
  a re-render/re-parse cycle (the view re-parses the written source — a string written back must be re-recorded as a string).
- Duplicate string keys in one holder (`[grabbed, grabbed]`) must both stay strings; removing one leaves the other a string.
- A key the user wrote as a string AND, separately, as an object in the same holder: the object stays an object; say what you did.
- Out of scope (do NOT touch): quotes / comments / flow lists (SC-599); instance-list regeneration when length ≠ amount
  (SC-600); legacy `parseEncounterData` in `EncounterData.ts`; the modal's own code; any other element's serializer.

Tests:
- Update the pins the survey lists (its answer 5: `initiative-serialize.test.ts`, `initiative-default-keys.test.ts:502-504`,
  the e2e pool-conditions / cond-rows / cond-add / cond-editor lines, `e2e/README.md:116`) to the new correct output —
  only where the fixture wrote plain strings; do not weaken assertions.
- New jest (unit on the model): no-op write; removal of one of several strings; unrelated write (e.g. turn toggle);
  Conditions-modal edit that adds a colour → object; plugin-added condition → `- key: x`; authored `- key: x` stays an object;
  unknown keys on an authored object survive; duplicates; heroes, squad-minion instances, regular instances each covered.
  Commit a red test first (fails on `ec26b709`), then the fix.
- New e2e step(s) in real Obsidian (follow the existing POOL-C* / INIT-* naming in `e2e/specs/`; **never put a bracketed
  ticket id in a test title** — the runner parses titles for scenario ids): (a) pool modal removes one condition from a
  minion whose note lists plain-string conditions → the others are still plain strings in the note; (b) an unrelated
  tracker write → plain-string conditions unchanged. Use or add a fixture under `e2e/vaults/shipped/Initiative/`.
  Show each new step red on `ec26b709` src (revert src only, run, restore) and green on the fix.
- No new lifecycle phase or scenario (ledger ruling). Never extend G-S64.
- CHANGELOG: one bullet under `## Unreleased` in the WORKSPACE `CHANGELOG.md` — which lives in YOUR worktree's
  superproject at `/home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite/CHANGELOG.md`,
  **never under `/home/scott/code/steelCompendium/workspace/`**. Plain user-facing words, e.g. conditions you typed as plain
  names stay plain names when the tracker saves. Commit it on the superproject branch (do not bump the submodule pointer; landing does that).

Commit after every coherent step (red test, fix, e2e, docs). Commits in the plugin repo on branch `sc592-pool-modal-condition-rewrite`.
Never push. No co-author/AI trailers in commit messages (Scott's global rule).

## 3. Gates — full dse-verify battery on your final head, in the skill's order

Baseline at `ec26b709` (expected deltas: jest + your new tests; e2e + your new steps):
- tsc and lint clean (incl. `tsc -p e2e`, lint incl. `e2e/`)
- jest **7207 passed / 1 skipped** + yours (fresh worktree reads one fewer passed / 2 skipped until shots has run — compare after shots, or say which)
- lifecycle **54/54** in five `--only` parts, each a separate foreground call: `G-S7a … G-S9a` (21); `G-S9b … G-S40` (16);
  `G-S45 G-S44 G-S42 G-S50 G-S53 G-S54 G-S52 G-S63 G-S64` (9); `G-S57 G-S62 G-S61 G-S56` (4); `G-S59 G-S49 G-S73 G-S77` (4). G-S56 stays LAST in its part.
  (Take the exact part arguments from dse-verify.) A FAIL reporting a missing vault → re-run that part before believing it (another effort may have deleted a shared dir).
- e2e **`OBSIDIAN-E2E done: (262+N)/(267+N) ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`** (known bugs SC-257, SC-355, SC-384, SC-580, SC-588).
  Coverage pairs move only if the manifest changes; say why if they do.
- shots **592**, `button host-leak OK (163 … 978 …)`, modal host-leak 39 kinds / 234 comparisons, `capture clip OK (147 …)`
- freeze **280/280** (no rebaseline — this change has no visual effect; if any hash moves, STOP and report)
- parity **0 GAPs / 0 undeclared / 24 DECLARED** (last)
If `styles.css` is byte-identical to a clean `ec26b709` build you may say so, but still run shots/freeze/parity unless dse-verify allows carrying them.

## 4. Rules and footguns

- **Never `rm -rf` a `/tmp` glob** (e.g. `/tmp/dse-obsidian-lifecycle-*`) — today an SC-595 worker did and wiped other efforts'
  kept lifecycle FAIL dirs. Delete only literal paths you created. No `rm` whose target is a shell variable or glob (it hangs on a prompt).
- **Never `pkill`/`killall` by pattern** — kill only a PID whose command line or `readlink /proc/<pid>/cwd` is inside your worktree.
- `git -C <absolute path>` for every git command; never `cd X; git …`.
- Devbox: `devbox run -c /home/scott/code/steelCompendium/worktrees/sc592-pool-modal-condition-rewrite/draw-steel-elements -- bash <script-file>`.
  Devbox eats `$?` and `| tail` eats failures: record exit codes inside a script FILE run through devbox, redirect output to files,
  read each gate's summary line. No `cd` inside compound commands.
- Scratch: a private subfolder `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc592-r1-impl-<yourAgentId>/`
  with uniquely named scripts/logs. Write scratch files with the Write tool.
- Run each gate as ONE blocking foreground call (split lifecycle into its parts, e2e and shots separately, to stay under the
  10-minute tool timeout). No `run_in_background`, no Monitor — a background job's completion never wakes you.
- Never key a wait-loop on a scratch filename or its contents — the scratch dir is pre-populated across sessions and branches.
- Redirect long-running output to a file rather than streaming it — the 600 s stream watchdog kills silent agents.
- Stale `main.js`/`styles.css` in the plugin root can shadow `main.ts` for jest — follow dse-verify.
- If the report-file write is blocked by your harness, return the report inline.
- You cannot `SendMessage` me — a depth-2 agent cannot address its parent, and `to: 'main'` reaches the dispatcher, not me.
  If you need input, end your turn with `STATUS: NEEDS_CONTEXT` and the question in your report. If you ever do send a message
  anyway, its FIRST WORD must be `SC-592:`.
- Report extras in two lists: `Drive-by fixes:` (already made, obviously correct, local, can't move a baseline) and `Follow-ups:` (left alone).

## 5. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc592-pool-modal-condition-rewrite/sc592-r1-impl-report.md`,
opening with a ≤10-line executive summary (head shas, rule as implemented, gate line per gate, red-on-base evidence).
Include a before/after byte diff of one realistic note for: a pool-modal removal, and an unrelated tracker write.

## 6. Return contract

Final text: raw facts, no prose — verdict (DONE / BLOCKED / NEEDS_CONTEXT), plugin head sha + commit list, superproject
CHANGELOG commit sha, each gate's measured summary line, red-on-base results, Drive-by fixes / Follow-ups, and the absolute
path of every evidence artifact (report, gate logs, e2e run ids/dirs, diffs).
