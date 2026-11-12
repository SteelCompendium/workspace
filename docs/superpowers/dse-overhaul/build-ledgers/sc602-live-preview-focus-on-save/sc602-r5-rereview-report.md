# SC-602 r5: scoped re-review of the r4 fold delta (reviewer R2)

**Executive summary**
- **Verdict: LAND-READY.** Findings: 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO (optional wording).
- dse `711844f3` on origin/develop `d0561a68` (fetched; unchanged). Superproject `0594056f` on workspace origin/main `5d4611a3` (fetched; merge-base = origin/main). The dse pointer is unstaged.
- `git range-diff 93e8e48c..2848e7eb d0561a68..711844f3`:
  - 1-4 `=`: `19a50c78`→`344d2fb5`, `67b7a558`→`2a4b4c25`, `12a9ab17`→`de34c37a`, `2848e7eb`→`bad99c46`
  - 5-7 new: the folds `774e7286`, `e8ac6d85`, `711844f3`
- The folds match the prescriptions for LOW-1 (SC-603 claims only the pool Apply), LOW-2, LOW-3 (all 11 listed sites; guards untouched), INFO-4 and the README row.
- Gates (my run):
  - tsc (incl. e2e) rc 0 · lint rc 0
  - jest `chromeFocusHandoff` + `livePreviewFocusCarry`: 45/45, 2 suites
  - e2e `--only` (INIT-L01..L08, CTR-L01..L05, CALL-L04, INIT-F01..F14, CTR-F01/F02): **30/30 ok, 0 failed** (37 s)
  - Not re-run, as the brief said: lifecycle and the full e2e.
- No SC-607 / SC-580 file in `d0561a68..HEAD`. No AI attribution in the 3 dse fold commits or the 2 superproject commits.
- Tree as found: dse porcelain empty at `711844f3`; superproject ` M draw-steel-elements` at `0594056f`; styles.css sha `5e5ff488…` unchanged.

## 1. Range-diff
Saved at `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r5-reviewer/range-diff.txt`. The four r2 commits are identical patches (`=`), so the code I reviewed in r3 is unchanged apart from the folds.

## 2. Fold commits against the prescriptions

- **`774e7286` (INFO-4), `focusHandoff.ts`.**
  - The change: `let btn = req.find ? undefined : Array.from(root.querySelectorAll(...)).find(...)`.
  - It does not change behaviour: the `find` branch always overwrote `btn` anyway.
  - Two jest suites pass, 45/45. The e2e LP tests that use the `find` path pass.
- **`e8ac6d85` (LOW-3 + README).**
  - `await browser.pause(1000)` is added after `dse.settle()` at every prescribed site: INIT-L01, L02, L03, L04 (both checks), L05, L07; CTR-L01, L03, L05; CALL-L04. That is 11 sites.
  - `browser` is imported in all three specs.
  - The guards are unchanged, which is correct: INIT-L06, L08 and CTR-L02, L04 assert "not pulled in", and a pause adds nothing there.
  - README: the `Counter/counter.md` row is added. It is accurate: Health 1, min 0, max 3, with ABOVE/BELOW text.
  - The e2e wall times of the paused tests rose by about 1 s, which shows the pause runs.
- **`711844f3` (LOW-1 / LOW-2), dse `CHANGELOG.md`.**
  - SC-602 entry: "...or on the control that replaced it (else on the element itself), with the keyboard ring when you were using the keyboard. This is done once for every element, not per element." This is the prescribed text. The SC-605 / SC-384 not-covered clause is kept.
  - SC-609 (:38) and SC-588 (:78): "Since SC-602 this holds in Live Preview too."
  - SC-603 (:47-48): "Since SC-602 the pool window's Apply keeps focus in Live Preview too (the Conditions window route there is not covered: it closes when the write lands, SC-384)." This claims only the pool Apply, as ruled, and matches my measurement C02.
  - The draft-loss sentences are kept: :31 (SC-605) and :54 (SC-589, "still emptied … (SC-605)").
  - No "focus is still lost … (SC-602)" sentence remains.
- **Superproject `8d0d9b61` + `0594056f`, workspace `CHANGELOG.md`.**
  - Same edits: the SC-602 entry (:11-14), SC-609 (:34), SC-603 (:69-70, pool Apply only), SC-588 (:108).
  - SC-605 (:101) is kept. No stale sentence remains.

## 3. Findings

**INFO-1 (optional wording, no action required): "this" can be misread.**
- In the SC-609 and SC-588 entries (dse :38, :78; workspace :34, :108), "Since SC-602 this holds in Live Preview too" follows a sentence about mouse clicks. A reader could take "this" to mean only that last sentence, not the whole fix.
- It is the wording I prescribed, and it is true either way. Measured: C01 for SC-609 in LP, and INIT-L01..L05 for SC-588.
- If you touch it again: "Since SC-602 all of this holds in Live Preview too."

## 4. Evidence
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r5-reviewer/`:
- `range-diff.txt`
- `tsc.log`, `tsc.rc`
- `lint.log`, `lint.rc`
- `jest.log`, `jest.rc`
- `e2e-only.log`, `e2e-only.rc`
