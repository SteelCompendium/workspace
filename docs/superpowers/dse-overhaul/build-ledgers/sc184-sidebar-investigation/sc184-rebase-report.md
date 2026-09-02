# SC-184 — pre-landing rebase + full battery (report)

## Executive summary

- **Verdict: LAND-READY.**
- dse branch `sc184-sidebar-investigation`: old HEAD `51ba4e8` → new HEAD `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732`, rebased onto `origin/develop` `778a341556be69bd5c885a1bdd1da2bb5d91db0c`. Still exactly 10 commits.
- One conflict: `CHANGELOG.md`, trivially additive (two bullets under the same `## 7.0.0 (unreleased…)` heading) — resolved keeping both. `docs/initiative-tracker.md` and `styles-source.css` auto-merged clean, no conflict.
- Gates (dse worktree): tsc clean/exit 0; lint clean/exit 0; jest **3514 passed / 1 skipped / 190 suites** (≥3417/≥190 expected — pass); shots **478 PNGs, 0 FAIL** (474 expected, higher is fine — new SC-195 fixture entries); freeze **210/210, 0 mismatches**; parity **0 GAPs / 0 undeclared / 16 DECLARED**, exit 0; obsidian-shots **59/59**, exit 0.
- Superproject probe (no rebase/commit performed): `origin/main` = `e5e7ce2` (matches ledger). `git merge-tree` found a `CHANGELOG.md` conflict — two bullets (SC-120's and SC-184's) inserted at the same point under `## Unreleased` — also trivially additive. Not resolved (superproject probe-only per brief; landing skill owns it).
- Report: this file. Gate logs listed in §4 below.

## 1. Rebase

```
cd /home/scott/code/steelCompendium/worktrees/sc184-sidebar-investigation/draw-steel-elements
git fetch origin
git rev-parse origin/develop   # 778a341556be69bd5c885a1bdd1da2bb5d91db0c — confirmed
git rebase origin/develop
```

Package-lock check before rebasing: `git diff 1619396 778a341 --stat -- package-lock.json` produced no output → unchanged, `npm ci` not run (per brief).

**Conflict (1 of 10 commits, `2bc96b4` "docs: reframe the sidebar pitch…"):** `CHANGELOG.md` only. `docs/initiative-tracker.md` auto-merged cleanly; `styles-source.css` was untouched by this branch's commits and never conflicted.

Conflict shape: both sides insert one bullet under the same `## 7.0.0 (unreleased; previously numbered 6.0.0)` heading — SC-195's captain-minion-pool bullet (`HEAD`, base side) and SC-184's sidebar-fix bullet (incoming, `2bc96b4`). Trivially additive per the brief's rule. Resolved by keeping both bullets, SC-195's first (it was already the base content) followed immediately by SC-184's, with the conflict markers removed. No wording inside either bullet was changed.

`git rebase --continue` then replayed the remaining 9 commits with no further conflicts.

**Post-rebase verification:**

- New HEAD: `69eb5f709f695bc5f1a3d5d3ce70578e34fdb732`
- `git log --oneline origin/develop..HEAD` → exactly 10 commits (same messages/order as before rebase, just new hashes: `20c2470 6dae836 b794949 ff9f496 f4f27e4 fb04043 086d448 7dd9e1a 147e0fd 69eb5f7`).
- `git status --short` → clean (nothing left uncommitted).
- `git diff 51ba4e8 HEAD --stat -- . ':!CHANGELOG.md' ':!docs/initiative-tracker.md' ':!styles-source.css'` → shows exactly the SC-195 delta (`src/drawSteelAdmonition/EncounterData.ts`, `src/elements/initiative/{model,resolveRefs,view}.ts`, `src/views/MinionStaminaPoolModal.ts`, four test files, `visual-harness/entry.ts` — 11 files, 1601(+)/42(-)). Confirms the branch's own content (sidebar files) is byte-for-byte what it was before the rebase; the only diff against old HEAD is SC-195's landed work now present via the new base.

## 2. Full battery (dse worktree)

All commands via `devbox run -- bash -c 'cd /home/scott/code/steelCompendium/worktrees/sc184-sidebar-investigation/draw-steel-elements && <cmd>'`, gate command last in each string (no pipe/echo after it), output redirected to a per-gate log. `main.js`/`styles.css` removed before jest (stale-build footgun). `/proc/loadavg` was 1.51/2.32/1.64 before starting (not load-sensitive-timeout territory).

| Gate | Result | Expected | Log |
|---|---|---|---|
| 1. tsc | clean, exit 0 | clean | `sc184-rebase-tsc.log` |
| 2. lint | clean, exit 0 | clean, exit 0 | `sc184-rebase-lint.log` |
| 3. jest | **3514 passed / 1 skipped / 190 suites** (190 of 191 total) | ≥3417 passed, ≥190 suites | `sc184-rebase-jest.log` |
| 4. shots | **478 PNGs, 0 FAIL**; host-copy pin OK; button host-leak OK (666 comparisons); print-twin parity OK (119 ids) | 474 PNGs, 0 FAIL | `sc184-rebase-shots.log` |
| 5. freeze | **freeze OK (210/210 frozen print PNGs byte-identical)**, exit 0 | 210/210, 0 mismatches | `sc184-rebase-freeze.log` |
| 6. parity (last) | **0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)**, exit 0 | 0/0/16 | `sc184-rebase-parity.log` |
| 7. obsidian-shots | **all 59 shots written**, "quit cleanly in-app" | 59/59 | `sc184-rebase-obsidian-shots.log` |

Notes:
- jest exceeds baseline (3514 > 3417, 190 suites matches floor) — consistent with SC-195 having added tests, per the brief.
- shots exceeds baseline (478 > 474 PNGs) — the SC-195 delta added entries to `visual-harness/entry.ts` (confirmed in the `git diff … --stat` above), which produced additional browser captures; 0 FAIL either way.
- The shots directory also held 59 pre-existing `--obsidian-*.png` files from a prior run before step 7 executed (537 total files = 478 browser + 59 stale obsidian); step 7 (obsidian-shots) then regenerated exactly those 59 fresh, so the 59/59 in the table is this run's own output, not leftover.
- `host-copy pin OK` (not PARTIAL) — an asar at/above the pinned version (1.13.7) was present on this machine.
- No `token-coverage.test.ts` failure encountered; no stale `D3-token-map.md` footgun triggered.

## 3. Superproject probe (probe only — no rebase, no commit)

```
cd /home/scott/code/steelCompendium/worktrees/sc184-sidebar-investigation
git fetch origin
```

- `origin/main` = `e5e7ce21c9b7bfd303a517f034dc55f31497c8d7` (matches ledger's `e5e7ce2`).
- Superproject `HEAD` = `4c2035cfd724bae63af6500d8145a953dd6efa35`.
- `git merge-base origin/main HEAD` = `da492e2a1c54eba4c788a05f006da695bf7627b8`.
- `git merge-tree da492e2 e5e7ce2 4c2035c` (full log: `sc184-super-mergetree.log`) reports `changed in both` for `CHANGELOG.md`, with an in-band conflict: SC-120's bullet (base/`origin/main` side) and SC-184's changelog bullet (incoming/`HEAD` side) both insert at the same point under `## Unreleased`. Trivially additive shape — same class of conflict as the dse-level one, two independent bullets under one heading — but **not resolved here**: this was a probe only, superproject `draw-steel-elements` submodule pointer is currently dirty (`M draw-steel-elements`, reflecting the just-completed dse rebase) and nothing in the superproject tree was modified or committed. The dispatcher's landing skill owns the actual superproject rebase/merge.

## 4. Artifacts (absolute paths)

- Report: `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-report.md`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-tsc.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-lint.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-jest.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-shots.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-freeze.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-parity.log`
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc184-sidebar-investigation/sc184-rebase-obsidian-shots.log`

Superproject probe scratch (not in the ledger dir, per brief's "never touch workspace/ except the ledger dir" — these are outside that dir, in the session scratchpad):
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc184-super-mergetree.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc184-super-fetch.log`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc184-rebase-op.log` (dse rebase, first hunk to conflict)
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/4931eaaf-23fa-45a6-9d71-eaf64645d32d/scratchpad/sc184-rebase-op2.log` (dse rebase, continue-to-completion)
