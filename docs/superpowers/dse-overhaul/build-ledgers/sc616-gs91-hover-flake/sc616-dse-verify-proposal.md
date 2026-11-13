# SC-616: proposed dse-verify SKILL.md edits (for the dispatcher to apply at landing)

Source file: `/home/scott/code/steelCompendium/workspace/.claude/skills/dse-verify/SKILL.md`. Line numbers are as of workspace `b31eb542`. Nothing was edited here.
dse change: harness only (`visual-harness/obsidian-lifecycle.mjs`), branch `sc616-gs91-hover-flake`, on dse develop `3a5986d3` as `54b08986` + `a2797330` + the comment/message fix `1cc54eac` (earlier twins of the same three commits: `87092b17`, `dad054fc`, `de60b4c9` on `1f1ae442`; `40b61802`, `05dbe21e`, `b0c1f68c` on `2074a152`; `c7e15725`, `33dd0a1b` on `1516f894`; `ce03e0e7`, `5decbc4c` on `c0995beb`).

## 1. The G-S91 flake bullet in "Lifecycle and e2e notes" (line 182)

Replace the whole bullet that starts `- G-S91 (part 5, SC-616) is a timing flake` with:

```
- G-S91 (part 5, SC-616) used to flake ("title rv: 700 ms after the second press the preview was gone", 2 of 17 plain runs; "title lp: the second click came 155 ms after the opening click" under load); fixed in the harness, no product change. Cause: the title / apply / reopen trials sent a zero-length second press (down and up at once) 8-25 ms after the opening click's dispatch ended. Obsidian's click-to-edit helper arms its 10 ms timer at the end of that dispatch, and queued input is handled before a timer that is already due, so the press raced the timer and `T3` hid the preview 5 ms later: SC-598's documented residual (see "Hover preview modals"), not a new bug. With the title point cached the race went red in 16 of 20 trials. The 155 ms form was the validity gate measured from the START of the opening click, which counts the dispatch itself (20-62 ms idle, about 110 ms at 4x CPU). Now: title / apply / reopen release the second press only after an in-page 11 ms timer (DOM timers run in due order, so the helper's 10 ms timer has run first; on the base its timer is 150 ms and still pending, so the trial stays red there), the gate is `gapEnd < 140` (the second click's capture minus the END of the opening click's dispatch), and a trial whose ONLY problem is that gate is re-run from fresh state up to twice, named in the outcome line (`title lp (re-run 1x, the host was too slow to prove anything: 150 ms from the end of the opening dispatch)`). A product failure (preview or modal gone, source editor, focus) is never re-run. Measured: 0 of 33 natural runs red after the fix (implementer: 15 on earlier twins of the final commit and 4 on the final head `1cc54eac` on `3a5986d3`, 16 G-S91-alone runs and 3 full part-5 runs; independent reviewer: 13 on `33dd0a1b` (6 alone, 6 three-at-once, 1 part 5) and 1 alone on `1cc54eac`), `gapEnd` 23-107 ms (107 at load average 5.6), no retry fired without a CPU throttle, and 20 of 20 in the worst-case straddle (r1); red on the SC-598-reverted bundle in 4 of 4 runs (r1) and 2 of 2 (r2), all six trials red each time (title, apply, dblq: "preview gone"; reopen: "source editor"), no retry. At 6x CPU throttle the title trials FAIL inconclusive after their re-runs (by design); at 4x a re-run fires now and then and passes (r3). So a G-S91 FAIL is now a real signal, except an inconclusive gap that survived two re-runs (a host too slow to prove anything: free the host and re-run). The dblq trials have no gate and are unchanged.
```

## 2. The SC-598 bullet's residual sentence (line 493)

Add one sentence after "...and still closes both, as before." (inside the bullet that begins `**focuses the preview itself for the click that opened it (SC-598).**`):

```
G-S91's title / apply / reopen trials release their second press after an in-page 11 ms timer, so they test what SC-598 promises (a click after the preview had its 10 ms) and not this residual; the dblq trials keep the queued double-click, which the base fails at any gap (SC-616).
```

Also change "(measured at 4x/8x CPU slow-down and with zero-length scripted presses)" to "(measured at 4x/8x CPU slow-down and with zero-length scripted presses, which hid the preview in 2 of 17 plain G-S91 runs before SC-616)". Optional; the first sentence is enough.

## 3. G-S83 authoring footgun (12) (line 495)

r1's finding bears on it: the text says cutting the lead "MAKES THE TRIAL RED FOR THE WRONG REASON ... So the evaluation, the awaited `mouseMoved` and the press with its own release stay; the 140 ms vacuity gate stays." That is now wrong in two places (the release no longer goes at once; the gate is from the dispatch end). Replace the span from `A queued double-click` through `the 140 ms vacuity gate stays.` and the opening of (12) as follows.

In (12), change `so the gap gate applies to title / apply only` to `so the gap gate applies to title / apply / reopen only`.

Replace the sentence `The gap before the second press is mostly the renderer ... the 140 ms vacuity gate stays.` with:

```
The gap before the second press is mostly the renderer still busy opening the modal (it grows with host load: 35-70 ms idle, 100-135 ms at loadavg 6-14), and the validity gate must not count it: `gapEnd` is measured from the END of the opening click's dispatch (a window-bubble `click` listener; on the base the helper arms its 150 ms timer for that click just before, on the head the 10 ms timer is armed just after), and the trial proves something only when `gapEnd < 140`. Script-side lead stays short (one evaluation, an awaited `mouseMoved`, the press), but the RELEASE is sent after an in-page 11 ms timer (`await t.ev('new Promise(r => setTimeout(() => r(true), 11))')` between `mousePressed` and `mouseReleased`): input sent while the renderer is busy is handled before the helper's due 10 ms timer, which is the documented residual (a zero-length press went red in 16 of 20 trials with the title point cached, and in 2 of 17 plain runs), and a DOM timer armed after the press has run after the helper's, which was armed first. Do not take that wait out. Do not lengthen it: the hold is part of `gapEnd`, which must stay under 140 ms (at 4x CPU it already reaches about 120-175 ms, at 6x the title trials exhaust their re-runs); a longer hold only makes the trial inconclusive sooner, it never turns the base green (the gate catches a late release). The hold does nothing for `reopen` (the preview is already focused and gets no synthetic click, so there is no 10 ms timer; that trial tests the 150 ms editor switch).
```

## 4. Battery row 4's part-5 timing note (line 30)

Measured part 5: 389 s (c0995beb-based, loadavg 1.3-3.7) and 391 s (rebased on 1516f894); G-S91 alone 50-51 s, as before. The 11 ms hold costs about 15-25 ms per trial. No change needed; if a data point is wanted, prepend to the part-5 parenthesis: `389-391 s at SC-616 r2 (loadavg 1-5); `. All six parts at SC-616 r2 (on 1516f894): 185 / 326 / 406 / 297 / 391 / 296 s. All seven parts at SC-616 r4b (on 3a5986d3): 184 / 324 / 408 / 295 / 393 / 296 / 67 s.

## 5. CURRENT block draft (dse sha `1cc54eac` on `3a5986d3`)

```
**CURRENT — dse `develop` @ `<sha after the SC-616 landing>` (2026-11-13; SC-616 landed on `3a5986d3`; G-S91 (lifecycle part 5) no longer flakes: its title / apply / reopen trials release the second press after an in-page 11 ms timer (the helper's 10 ms timer has run first), its validity gate is measured from the END of the opening click's dispatch (`gapEnd < 140`), and a trial whose only problem is that gate is re-run up to twice, named in the outcome line; harness only, no `src/` or `styles.css` change; no lifecycle id used (G-S111 free)):**
tsc and lint clean · jest **11794 passed / 2 skipped** in a fresh worktree without the shots cache · lifecycle **62/62** (seven parts: 21 + 16 + 9 + 4 + 7 + 4 + 1; 184 / 324 / 408 / 295 / 393 / 296 / 67 s) · e2e **`OBSIDIAN-E2E done: 331/334 ok, 0 failed, 3 known-bug, coverage: 176/176 pairs`** · `main.js` `825bd341…fbd7` and `styles.css` `18730938…f1f9` byte-identical to a build of `3a5986d3`, so shots **592** / host-leak 163/978 / modal host-leak 40/240 / capture clip 147, freeze **280/280** and parity **0 / 0 / 24** carry (SC-557 precedent). G-S91 alone: 3 of 3 green on the final head (`gapEnd` 24-51 ms, no retry fired), 0 of 19 natural runs red across the head and its pre-rebase twins; red 6 of 6 trials in 2 of 2 runs on the SC-598-reverted bundle (r2, earlier twin). Numbers as reported by the SC-616 implementer on `1cc54eac` on `3a5986d3`; the dispatcher relayed, not re-ran.
```

(The hashes above are from builds of `3a5986d3` and of the final head in the SC-616 worktree (`git archive` export, `node esbuild.config.mjs production`); both builds hash the same. If more commits land on develop first, rebuild both and recompare before relaying.)
