# SC-487 scoped re-review, round 5 (r4 reviewer)

**Executive summary**
- **Verdict: LAND-READY** at dse `944922e` (on `66f474b`) and superproject `0b65161` (on `29109b0`). HIGH 0 · MEDIUM 0 · LOW 0 · INFO 2.
- **Range-diff:** dse commits 1-6 are `=` and commit 7 (`944922e`) is new. Superproject commits 1-4 are `=`. Its delta over `29109b0` is only `CHANGELOG.md` (+13) and the dse-verify lifecycle row (34/34 → 35/35).
- **944922e matches the prescription.**
  - The code line is the line from `candidate-ff.patch` (`git apply --check -R` of the patch passes).
  - The 4 rows are in both `blockPrefix.test.ts` and the `e2eIntegrity` table.
  - The rest of the commit is comment edits only (INFO-4).
- **Real Obsidian 1.14.4, 944922e bundle** (main.js sha256 `ab186591…`):
  - `~~~ds-counter<FF>`x`` and `> ~~~ds-counter<FF>`x``: Reading view draws them. The in-note write lands, the pin anchors and mounts the panel, the panel write lands, and the text above and below plus the opening line are kept.
  - `~~~<FF>ds-counter `x``: not claimed, one Notice (`<U+000C>ds-counter`).
  - Every other r4 row gives the same result as r4: tilde space/tab/word/`~~~~`/quoted claimed; the unclaimed forms, `\v` and U+0085 give one Notice and leave the note byte-identical; U+200B pins in Live Preview.
- **Gates at 944922e (own clone):**
  - tsc + lint: rc 0.
  - jest: **5925 passed / 4 skipped / 5929**, 241 of 242 suites. That equals 5928/1; this clone skips 3 more tests.
  - lifecycle: **35/35 ok, 0 failed**.
  - e2e: **108/108 ok, 0 failed, 0 known-bug, 69/69**.
  - From the implementer's r5 logs, written after the 944922e commit: shots rc 0, 592 PNGs, 0 FAIL; freeze 280/280; parity 0/0/24.
- **Logistics (INFO-2):** `origin/develop` is now `c98bd82` (SC-495, 7 commits) and `origin/main` is `a77fd84`. A rebase is due before landing.
- **Working tree:** the worktree's dse and superproject status are the same before and after.

## INFO
- **INFO-1 (cosmetic, optional).** Three comments still say "space / tab" only, though the code now also ends the word at a form feed:
  - `src/framework/host/blockPrefix.ts:69` ("split on space / tab").
  - `test/unit/framework/blockPrefix.test.ts:203` and the test title at `:208` ("first space/tab word").
  - No behaviour impact.
- **INFO-2 (landing).** The remote `develop` moved `66f474b` → `c98bd82` (SC-495). Files it touches: `src/framework/kit/stepper.ts`, `rollBar.ts`, `counter/view.ts`, `feature/rollController.ts`, `styles-source.css`, 2 new e2e specs, 2 shipped-vault fixtures, kit tests. None overlaps SC-487's files. The new e2e specs will change the e2e count after the rebase. The superproject `origin/main` is at `a77fd84` (SC-495 merge plus a CHANGELOG bullet), so a CHANGELOG rebase conflict is possible but trivial.

## Evidence
`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc487-rev-r5/`:
- **Gates:** `range-diff-dse.txt`, `r5-gate-tsc.log`, `r5-gate-lint.log`, `r5-jest-full.log`, `r5-gate-lifecycle.log`, `r5-gate-e2e.log`.
- **Probe:** `probe-head-114/` (`meas-head-114.json`, `unreg.json`, `after/`, `lifecycle.log`).
- **Bundle:** `bundle-head/` (`build.log`).
- **Status snapshots:** `status-{before,after}-{dse,super}.txt`.
