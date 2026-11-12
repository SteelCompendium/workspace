# SC-582 scoped re-review, round 2 (delta only)

Executive summary
- Verdict: LAND. Findings: HIGH 0, MEDIUM 0, LOW 0, INFO 1.
- Heads: plugin dcc53f0f on dse develop 711844f3 (origin/develop still 711844f3); superproject 54ddb2ea on a11ad144.
- (1) LOW-1 is closed. The `hex === h` mutant gives `test/dom/views/` 1 failed / 1092 passed, and the one failure is test (c). With the code restored: 1093/1093, rc 0. The getter override cannot leak, and the INFO-1 comment is literally true.
- (2) `git range-diff` reports e7ac41b1 `=` b59913b5 (identical patch). SC-602 does not change `ConditionsModal.ts`. Its `controlFocus.ts` change extracts `controlSuccessor` and finds controls by family and position, not by aria-label. `focusPickedOption` does not use it.
- (3) Both CHANGELOG resolutions keep the SC-602 entry byte-identical, with SC-582 above it. Both diffs are pure 4- or 5-line additions.
- (4) `a11ad144..HEAD` is exactly 2 commits: 8a4b6ece (CHANGELOG.md, +5) and 54ddb2ea (draw-steel-elements 711844f3 -> dcc53f0f only).
- e2e (implementer log, not re-run): `OBSIDIAN-E2E done: 304/307 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`; COND-E02 and COND-E03 pass.
- Tree same as before (porcelain --ignored diff empty, after rebuilding the ignored main.js/styles.css that my jest pre-step removed). No commits.

## (1) LOW-1 / INFO-1 fold, dcc53f0f
- Test (c) at `test/dom/views/conditions-modal.test.ts:1241-1245` sets `Object.defineProperty(input, 'value', { configurable: true, get: () => '#1E8449', set: () => undefined })`. It also adds a setup assertion that `onChange` received `#1E8449`, which proves the capitals reached `setColor`.
- Mutant (`sc582-rev2-mutant.diff`: `SWATCHES.find(([, h]) => hex === h)`): only `SC-361 › SC-582: a custom pick equal to a preset (any case) …` fails, on the focus assertion. The pressed mark still passes because `renderSwatches` keeps `sameColor`. This matches the implementer's "1 failed / 403 passed", which counted only the two conditions files.
- No leak: the property is defined on that one `<input>` instance, not on `HTMLInputElement.prototype`. `renderList()` throws the input away on the change, and the suite's `afterEach` empties `document.body`. The clean `test/dom/views/` run after the mutant is 1093/1093.
- INFO-1: `conditions-modal-matrix.test.ts:235-236` now says "the hex is only in the tooltip (the `title`, "Name (#hex)"), which a screen reader may still read after the name as the description". That is accurate: the title becomes the accessible description.

## (2) Fix after the rebase
- `git range-diff d0561a68..dcec985a 711844f3..6607a2a9`: `1: b59913b5 = 1: e7ac41b1`. The only difference is in the CHANGELOG commit's context lines, where the neighbouring entry is now SC-602's.
- `git diff d0561a68..711844f3 -- src/views/ConditionsModal.ts` is empty. SC-602's `src/framework/kit/controlFocus.ts` diff (+6/-2) moves the successor lookup into `controlSuccessor(root, focus, families)`, a family-and-nth lookup. `ConditionsModal` does not import controlFocus. `focusPickedOption` still queries `[role="group"][aria-label=…] button` by `aria-label` (ConditionsModal.ts:271-277).

## (3) CHANGELOGs
- dse `CHANGELOG.md` `## 7.0.0`: `git diff 711844f3..dcc53f0f` adds 4 lines only. The SC-582 bullet sits directly above the SC-602 `[FIX] In Live Preview…` bullet, which is untouched.
- Workspace `CHANGELOG.md` `## Unreleased`: `git diff a11ad144..HEAD` adds 5 lines only (bullet plus blank line). SC-582 is first; the SC-602 bullet follows unchanged.

## (4) Superproject
- `git log --oneline a11ad144..HEAD`: `54ddb2ea chore: bump draw-steel-elements to dcc53f0f (…)`, `8a4b6ece docs(SC-582): CHANGELOG Unreleased entry`. The bump commit changes `draw-steel-elements` only (`Subproject commit 711844f3… -> dcc53f0f…`). `ls-tree HEAD` shows dcc53f0f.

## INFO-1 (new): workspace origin/main has moved one docs-only commit past the base
- origin/main is now 91a05435 (`docs: sc606 ledger note on the stuck reviewer's exit`). It touches 2 sc606 ledger files, and its draw-steel-elements pin is still 711844f3. It does not conflict with this branch and is no stale-pin hazard. Landing needs a trivial rebase or merge; `just wt-finish` / `land-stack` handle it.

## Evidence
Scratch `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc582-rev-r2/`:
- `sc582-rev2-mutant.sh`
- `sc582-rev2-mutant.diff`
- `sc582-rev2-jest-mutant.log` (1 failed / 1092)
- `sc582-rev2-jest-views.log` (1093/1093)
- `sc582-rev2-rc.txt`
- `sc582-rev2-mutant-status-after.txt`
- `sc582-rev2-build.log`
- `sc582-rev2-status-{before,after}.txt`
- `sc582-rev2-wstatus-{before,after}.txt`

Implementer e2e log: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc582-impl-r2/sc582-e2e.log`.
