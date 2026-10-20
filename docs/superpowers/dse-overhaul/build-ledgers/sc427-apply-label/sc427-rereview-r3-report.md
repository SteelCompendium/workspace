# SC-427 re-review: r3 + r4 delta (efbbe9b..d58cf6a, rebased on 6bcf9c8)

**Executive summary**
- **VERDICT: LAND.** 0 CRITICAL / 0 HIGH / 0 MEDIUM / 0 LOW / 2 INFO.
- **R1-M1 is closed.** The invariant sweep at d58cf6a found 0 violations (label, field and disabled state against the persisted value) across 7,560 sequences, and 0 draft-label violations. The same sweep at efbbe9b found the 104 M1 violations.
- **No persisted number changed.** The persisted current/temp value and the APPLY/DISABLED state are byte-identical between efbbe9b and d58cf6a for all 7,560 sequences (5,857 APPLY, 1,703 DISABLED; diff is 0 lines).
- **Real-Obsidian probes pass at d58cf6a.**
  - 25/20, Damage 3: label "Lose 5 Stamina", field 20, persists 20.
  - Hero -14/20, Healing 2: label "Gain 4 Stamina", field -10, persists -10.
- **R3-F5 holds.** On the clamped-pending check (gauge vars plus where the legacy track ends, compared with a modal opened at the persisted value) the sweep found 0 violations at d58cf6a and 104 at efbbe9b. In the 60 efbbe9b violations printed, the Steel gauge never differed; every one was in the legacy track.
- **Legacy track is NOT visible in Steel**, in real Obsidian. `.dse-stamina__track` computes to `display: none`, 0x0, offsetParent null. The modal root has `data-dse-theme="steel"` and no `data-dse-print`. The R4 follow-up ruling therefore lands on **DROP**.
- **Rebase is intact.** `git range-diff c616e22..943fc47 6bcf9c8..efbbe9b`: 4 of 5 commits are `=`, and only 9aab55b→1c67a01 differs, in CHANGELOG context only. The efbbe9b ≡ old 943fc47 mapping is confirmed: `git diff 943fc47 efbbe9b` is empty for src/views, the stamina tests and the e2e stamina specs.
- **Gates at d58cf6a:** tsc 0 · lint 0 · jest 4950 passed / 1 skipped / 229 of 230, rc 0 · e2e 71/76 ok, 0 failed, 5 known-bug, 51/51, rc 0 · lifecycle 26/26 (port 9293), rc 0.

## Delta reviewed
- **f82b7d0 (r3) and d58cf6a (r4)** in `src/views/StaminaEditModal.ts`:
  - `staminaFrame {current, floor, max}` is set once in onOpen.
  - `appliedStaminaChange(raw)` = `raw === 0 ? 0 : clampStamina(current + raw) - current`.
  - That one helper feeds three things: `updateActionButton` (label and disabled state, including the draft via `draft ?? pending`), the legacy `bar.set` fill/delta/kind, and the gauge's pending `current`.
  - It matches ruling R1-M1 option A exactly, and Apply (`:607` path) is untouched.
- **Tests:** the new `[M1]` rows (5 scenarios, all the ledger's) and the `[M1b]` gauge rows in `test/dom/views/stamina-edit-modal-matrix.test.ts` match the ledger's expected numbers.

## R1-L1 (CHANGELOG)
- The DSE `CHANGELOG.md` bullet (r3 wording: "a Damage or Healing that only brings it part of the way back still shows the change that really gets saved") and the superproject `CHANGELOG.md:13-24` at ec016a0 are now accurate against the behaviour measured above.
- The headline "says exactly what it will apply" now holds: 0 label violations in the sweep.
- Both bullets are plain-language. **L1 closed.**

## INFO
- **I1:** on an out-of-range stored value, the Steel gauge already draws the stored value clamped (O8 class). A correction-only change therefore shows no delta band. Example: 25/20 Damage 3 reads "Lose 5 Stamina", but the gauge sits full at max with no band (screenshot ZZREV-01-pending.png). The gauge, field and persisted value all agree (20), so this is consistent with O8, not a defect.
- **I2:** the legacy fill is still computed from the unclamped stored value (`--dse-fill: 116.67%` at open for 25/20, and -13.33% for -14/20). The node is display:none in Steel and only the print scheme would show it, so DROP per the R4 ruling is correct.

## Evidence

Scratch worktrees `/tmp/claude-1000/sc427-rereview-{efbbe9b,d58cf6a}-be71a0a9` were removed and pruned. The branch head is untouched at d58cf6a.

Evidence dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/evidence-r3/`
- Sweep:
  - `probe-d58cf6a.log` / `.rc`
  - `probe-efbbe9b.log` (the efbbe9b job was cut by my 590 s timeout after the sweep test finished, so it has no `.rc`; the sweep result and the persisted file are complete)
  - `persisted-efbbe9b.txt`, `persisted-d58cf6a.txt`, `persisted-diff.txt` (empty)
  - `zz-sc427-review-probe-v2.test.ts`
- Gates: `tsc.log/.rc`, `lint.log/.rc`, `jest.log/.rc`, `e2e.log/.rc`, `lifecycle.log/.rc`
- Real Obsidian:
  - `e2e-probe.log/.rc` (computed styles, labels, persisted values)
  - `ZZREV-01-pending.png`, `ZZREV-02-pending.png`
  - `zz-review-probe.e2e.ts`
- Fixtures: `../evidence/zz-review-over.md`, `../evidence/zz-review-under.md`
