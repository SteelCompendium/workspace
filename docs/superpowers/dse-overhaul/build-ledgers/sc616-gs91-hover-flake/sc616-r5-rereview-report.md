# SC-616 r5: scoped re-review of the r3 fix delta (reviewer)

## Executive summary
- **Verdict: LAND** on dse `1cc54eac` (on develop `3a5986d3`). Findings: 0 HIGH, 0 MEDIUM, 0 LOW, 2 INFO (both optional wording).
- **Range-diff:** `1516f894..33dd0a1b` against `3a5986d3..a2797330` shows `c7e15725 = 54b08986` and `33dd0a1b = a2797330`, so both are identical to the pair r3 reviewed (`sc616-r5-range-diff.txt`).
- **`1cc54eac` closes r3 INFO-2, INFO-3 and INFO-4 correctly.** It touches only comments plus the text of one failure message, and changes no behaviour. The retry test `bad.length === 1` counts messages, not their text, and is unaffected.
- **The INFO-4 message works.** I ran the `1cc54eac` harness on r3's SC-598-reverted bundle. title rv, title lp and apply rv now print `second click N ms after the opening click, M ms after its dispatch ended`. The dblq lines keep the old form, as intended. The run was red 6 of 6 trials, for product reasons.
- **Proposal: LOW-1 and INFO-6 are fixed as prescribed.**
  - The r4b numbers match the ledger: jest 11794/2, lifecycle 62/62 in seven parts with the times, e2e 331/334 with 0 failed and 176/176, modal host-leak 40/240 (from the dispatcher's `3a5986d3` baseline).
  - The worktree `main.js` `825bd341…fbd7` and `styles.css` `18730938…f1f9` match the r4b report.
  - The SKILL anchors 30 / 182 / 493 / 495 and every quoted span were checked against the current SKILL.md. "G-S111 free" matches the live CURRENT block (SKILL.md:1498).
- **G-S91 alone on `1cc54eac`:** 1 of 1 green, no retry, `gapEnd` 23-42 ms.
- **Trees:** dse is clean at `1cc54eac`, and the superproject shows only ` M draw-steel-elements`. Nothing was committed or edited. The one FAIL temp dir my base run kept was deleted by literal path.

## 1. The `1cc54eac` delta (`visual-harness/obsidian-lifecycle.mjs`, 4+/3-)
- **:1814 JSDoc (r3 INFO-2):** "for `reopen` it changes nothing, the preview is already focused and gets no synthetic click". True.
- **:1883 press comment (r3 INFO-2):** "(reopen: … no synthetic click and no 10 ms timer; the hold changes nothing there, and that trial tests the 150 ms editor switch.)". True; r3's M4 is caught by `reopen` alone.
- **:1854 install comment (r3 INFO-3):** "on the base … armed its 150 ms timer for this click just before …; on the head the 10 ms one is armed just after". True; r1 timeline: `arm150` +62.1, `bub:click` +62.1, `arm10` +62.2. See INFO-2.
- **:8386 message (r3 INFO-4):**
  - It appends `, ${r.gapEnd} ms after its dispatch ended` for every target except dblq, so dblq, which has no gate, keeps its old text.
  - The nested template is valid, and the run loaded and printed it.
  - No assertion, gate, retry condition or ordering changed.

## 2. The proposal (`sc616-dse-verify-proposal.md`)
- **LOW-1 (§3, line 33):** the r3 wording is now in place: "Do not lengthen it: the hold is part of `gapEnd` … it never turns the base green (the gate catches a late release)". The `reopen` sentence and the head/base timer sentence were added too, consistent with the code.
- **INFO-6 (§1):** "all six trials red each time (title, apply, dblq: "preview gone"; reopen: "source editor")". The 4x/6x data point is in as well.
- **Numbers:**
  - "0 of 19 natural runs" = 15 (r2) + 4 (r4b: 3 alone + 1 part 5), which is 16 alone + 3 part 5. The arithmetic holds.
  - §4 has the seven part times.
  - §5's CURRENT block matches the r4b exec summary and the `3a5986d3` dispatcher baseline.
  - The shas and twins listed in the header agree with `git log`.

## 3. Findings
### INFO-1: the §1 `gapEnd` range and run count leave out r3's runs
- **Where:** `sc616-dse-verify-proposal.md:11` ("`gapEnd` 23-69 ms", "0 of 19 natural runs").
- r3 measured 13 more natural green runs on the same commits (`33dd0a1b` = `a2797330`), with `gapEnd` up to 107 ms (title rv, loadavg 5.6, `sc616-r3-b3.log`).
- A future reader who sees about 100 ms might take it for unusual.
- Optional fix: "`gapEnd` 23-107 ms (over 70 only at loadavg ~5, r3)". Optionally also "0 of 32" (19 + r3's 13 runs: 12 alone + 1 part 5).

### INFO-2: the install comment can read as if the head arms no 150 ms timer
- **Where:** obsidian-lifecycle.mjs:1854.
- On the head the helper also arms its 150 ms timer for the opening click just before the mark, and then skips it because the click was default-prevented.
- Optional: "on the base (and the head, where it is then skipped) …". The gate reasoning is unaffected.

## 4. Runs
- **`sc616-r5-gs91-head-1.log`:** G-S91 alone on `1cc54eac`, worktree bundle `825bd341…`, `done: 1/1 ok`, 51 s, loadavg 1.5.
  - title rv gap 89 / gapEnd 29; title lp 62 / 42; apply rv 80 / 25; reopen rv 43 / 23; dblq rv 135, dblq lp 133.
  - No re-run.
- **`sc616-r5-gs91-base598rev-1.log`:** the `1cc54eac` harness with `DSE_LIFECYCLE_BUNDLE` = r3's SC-598-reverted bundle (`…/scratchpad/sc616-r3-rv/base598rev`, built from `1516f894`; `managedModal.ts` is the same at `3a5986d3`). `done: 0/1 ok`, all 6 trials red:
  - title rv, title lp, apply rv: "preview gone", with the new `gapEnd` text, at 25 / 41 / 24 ms;
  - dblq rv, dblq lp: "preview gone";
  - reopen rv: source editor plus focus in the preview.
  - No re-run.

## 5. Artifacts (this directory)
- `sc616-r5-rereview-report.md`: this report.
- `sc616-r5-range-diff.txt`: the range-diff.
- `sc616-r5-gs91-head-1.log`: the G-S91 run on the head.
- `sc616-r5-gs91-base598rev-1.log`: the run on the SC-598-reverted bundle.

Scratch scripts: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc616-r5-rv/run1.sh`, `run2.sh`.
