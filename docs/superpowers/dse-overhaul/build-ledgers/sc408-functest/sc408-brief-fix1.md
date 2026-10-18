# SC-408 fix round F1 — address review R1's findings

## 0. Context loading

1. Re-read `sc408-brief-common.md` (environment rules, reserved lifecycle port 9308, reporting
   contract) and the ledger `decisions.md` — especially the newest entry, "Review R1 … Rulings".
   Those rulings are your scope. Quote, don't reinterpret.
2. The review: `sc408-r1-review.md` (same dir). Its **Findings** section is your spec — each
   finding has `file:line`, a failure scenario and a prescribed fix. Read it in full.
3. Worktree: `/home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements`,
   branch `sc408-functest`, head `52f0099` (your P2a work plus the merged `sc408-jsdom`
   commits). Superproject worktree `/home/scott/code/steelCompendium/worktrees/sc408-functest`
   carries your skill-docs commit `85216b6` and an UNCOMMITTED submodule pointer change — leave
   the pointer alone. `git -C … fetch origin`; if `origin/develop` moved off `be4f002`, rebase
   and report it.
4. Workers never call the tracker.

## 1. Task

Scott's ask (verbatim, ledger): "I want the tests to be comprehensive and able to be ran
relatively easily to find regressions and other bugs."

Fold these R1 findings, using the review's prescribed fixes as amended by the ledger's rulings:

- **M-1** RECOV-R06 flake: fixes 1–3 (clear every `.notice` in `closeEverything` and wait for
  zero; resolve Undo inside the newest notice once its rect is stable; assert the toast is gone
  within ~1 s with a distinct message, `dse.waitForWrite`, count is 1). Fix 4 is dropped.
- **M-2** silent skips: a pre-scan makes ANY run (full or filtered) exit 2 as a usage error,
  naming `file:line`, on `.skip(` / `.only(` on `it|describe|knownBug`, or `xit(` / `xdescribe(`
  in a selected spec. Backstop: pending tests the reporter sees (runtime `this.skip()`) count as
  failures.
- **L-1** loose pins: give each bug assertion in D09, S08, R03/R08 and INIT-STAM-B2 a unique
  `message:` and pin `failsWith` on it (as STAM-S13 does).
- **L-2** exercised-set honesty: record after the action resolves; `press()` asserts
  `document.activeElement` is inside the target for DSE ids (host ids need an explicit
  `aimedAt` pseudo-target); `blur()` asserts the control had focus; a full run fails if any pair
  is driven only by known-bug tests (list them).
- **L-3** block cross-talk: a fixture note with two `ds-stamina-bar` blocks; the invariant takes
  the target fence index and requires every non-target fence byte-equal to the fixture; one
  scenario edits the second block and asserts the first is untouched.
- **L-5** lint `e2e/` (its own Node config block in the eslint config); fix what it finds.
- **L-6** convert STAM-S06 to `knownBug('SC-431', …)` asserting the intended behaviour from
  SC-431: "the stepper swallows Escape and reverts only the half-typed draft; the modal stays
  open with the Damage still pending." Then a second Escape closes the modal with no write.
- **L-7** docs: `run.mjs` header (exit codes, `coverage:` in the summary line); README DISPLAY
  wording ("every wdio/Obsidian child"); the dse-verify skill in the SUPERPROJECT worktree
  (`.claude/skills/dse-verify/SKILL.md`): add the e2e expected numbers, update jest to your final
  count, and lifecycle 19/19 → 25/25. Commit that file only, in the superproject worktree.
- **I-2** reap backstop: make `taggedPids` match something Electron keeps (e.g.
  `/proc/<pid>/cmdline` containing the run's unique path), or delete the dead path with a
  one-line comment saying why. Re-prove SIGINT to run.mjs leaves 0 Xvfb / chromedriver /
  Obsidian survivors.
- **I-3** ergonomics: add the reviewer's scenario `[STAM-R1X] Reset also returns a pending Spend
  Recovery` (it must fail under the review's M29 — prove it); README table of what each fixture
  note contains; README note that `npm run tsc` type-checks the specs; the `FAIL:` summary line
  keeps the first few lines of the assertion diff instead of cutting at "Object {".

**Prove each new check bites** (temporarily break it, show the failure line, revert):
M-2 (an `it.skip` → exit 2), L-1 (one pin "fails differently" under an unrelated break, e.g.
B2 with a cell-repaint break), L-2 (a pair driven only by a known-bug test fails the gate),
L-3 (a write aimed at the wrong block fails the invariant).

**Out of scope** — do not touch: any product bug fix (SC-425…SC-431 stay open; the code under
`src/` changes only if a seam is strictly needed, and say so); L-4 census scope (carried into
the rollout); new surfaces (pool modal, conditions, initiative tracker beyond the stamina entry
points); CI; B5/B6 behaviour (still "[current behaviour — ruling pending SC-408]").

Commit after every coherent step (`git -C <path> …`). No push. No Claude/AI attribution in
commit messages.

## 2. Gates (dse-verify order; absolute paths; devbox from the workspace shape)

1. `npm run tsc` clean · 2. `npm run lint` clean (now including `e2e/`) ·
3. `rm -f main.js styles.css` then `npx jest` → **4666 passed / 1 skipped / 224 of 225
   suites** plus any jest tests you add, 0 failures.
4. `DSE_LIFECYCLE_PORT=9308 npm run obsidian-lifecycle` → 25/25 ok.
5. `npm run e2e` → 0 failed, coverage Y/Y. Expected about 69 scenarios (67 + STAM-R1X + the
   two-block scenario), **8 known-bug** (the 7 existing + SC-431). Then **25 back-to-back full
   runs at `--shards=4`, 0 failures** (the R06 flake was 2 in 42; a single failure is a finding —
   never add retries). Report per-run wall time and the count.
6. `npm run shots` → 568, 0 FAIL. 7. Freeze:
   `bash /home/scott/code/steelCompendium/workspace/.superpowers/sdd/check-freeze.sh /home/scott/code/steelCompendium/worktrees/sc408-functest/draw-steel-elements/visual-harness/shots`
   → 274/274. 8. `npm run parity` LAST → 0 / 0 / 24.

## 3. Report

`/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc408/sc408-fix1-report.md`,
opening with a ≤10-line executive summary: verdict, final DSE sha + superproject skill commit
sha, every gate number, the 25-run flake result, scenario / known-bug / coverage counts. Then one
row per finding (finding → what changed → `file:line` → bite proof), deviations, evidence paths.
End with `Drive-by fixes:` and `Follow-ups:`.

Return contract: your final text goes to the ticket-owner, not a human — raw facts, shas,
numbers, and the absolute path of every evidence artifact. Copy any failure bundle you cite out
of `e2e/.out/` (12-run retention prunes it) into `/tmp/claude-1000/sc408-fix1/evidence/`.
If the report write is blocked, return it inline. Redirect long-running output to a file; run
gates in the foreground — never background a job and wait for a notification. Never key a wait
on a scratch filename. You cannot message me; if you need input, end with
`STATUS: NEEDS_CONTEXT` and the question.
