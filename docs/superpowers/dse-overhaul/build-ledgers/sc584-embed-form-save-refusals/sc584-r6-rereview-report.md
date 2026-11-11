# SC-584 r6 scoped re-review (reviewer-r2), dse b4e7b4f4..796f5a87, superproject fa43eb02

**Executive summary**
- Verdict: **FIX FIRST**. Counts: CRITICAL 1, HIGH 0, MEDIUM 1, LOW 0, INFO 2.
- CRITICAL-1 (r6), real Obsidian, RV and LP, no outside edit: the r5 guard `ownFence.lineStart !== section.lineStart` is false for a quote whose first line IS the upper counter's fence (a `>` blockquote with no callout header). There the body search picks the sibling, which sits on the window's first line.
  - `![[note#^id]]` of such a quote holding two counters, + on the lower one, then the pencil, then Save: HEAD writes the **upper** counter with no Notice. b4e7b4f4 refuses. This is a regression from SC-584.
  - The heading-embed variant writes the upper counter on base too (pre-existing).
  - Fix, checked in scratch: guard on "the window's first line is not a plain fence" instead of comparing lines. 124/124 jest including my probes.
- r4 CRITICAL-1 (callout with two counters, block and heading embed) is closed: lower counter written, RV and LP, in jest and in Obsidian. G-S77 is real: it fails on the r3 and base bundles (r5 logs; my r4 runs of the same shape on the r3 bundle wrote the upper).
- Record attacks Q1-Q10 behave as in r4. The mK (remount) and unload tests exist, and the unload line is right. The NO-+ cells are verified: lower counter on base and HEAD, RV and LP.
- Gates on HEAD: tsc/lint clean · jest 7122 passed / 2 skipped · p3 9/9 (509 s) · p5 4/4 incl. G-S77 (245 s) · e2e 255/262 ok, 0 failed, 7 known-bug, 163/163 · styles.css 5e5ff488 = clean b4e7b4f4 · range-diff r1+r3 8/8 `=`.

## Findings

### CRITICAL-1: a header-less quote with two counters, + on the lower, form: Save writes the UPPER (block embed: regression; heading embed: pre-existing)
- **Where:** `src/framework/host/ReadingModeBlockHost.ts` `takePin`, the r5 guard `if (forForm && embedded && this.ownFence.lineStart !== section.lineStart)` (commit 4de2c646, just above `const pin = { text: section.text, … }`).
  - `findOwnFence` takes the plain-fence shortcut only when the first line is an UN-prefixed fence. A quote whose first line is `> ```ds-counter` therefore goes through `locateInSection` by body.
  - In the stale window after the +, the only block holding the known body is the UPPER counter, which is on the window's first line. So `ownFence.lineStart === section.lineStart`, the guard is false, and the record is not used.
  - `verifiedPinLine` then accepts the upper counter: the link resolves, and the quoted fence looks for its `^id` after the part's end.
- **Scenario (real Obsidian 1.15.1, `sc584-r6-probe-obsidian-r6head-q.log` / `-r6base-q.log`):**
  - Fixture `r6-q.md`: lines `> ```ds-counter` (upper counter, plugin key order, value 6), `> mid text`, the lower counter `COUNTER(5,'Twin')`, all prefixed `> `, then a blank line and `^r6q`.
  - Host note: `![[r6-q#^r6q]]`.
  - Steps: + on the lower card, then its pencil in one page turn, then rename to `Edited` and Save.

  | cell | b4e7b4f4 | HEAD 796f5a87 |
  |---|---|---|
  | `^id` embed, RV | refused, 1 Notice | **wrote the UPPER**, no Notice |
  | `^id` embed, LP | refused, 1 Notice | **wrote the UPPER**, no Notice |
  | heading embed `![[r6-qh#Tracker]]`, RV | wrote the UPPER | **wrote the UPPER** |
  | heading embed, LP | wrote the UPPER | **wrote the UPPER** |
  | control: the r4 callout shape (Q9 / Q9h), RV and LP | — | lower (fixed) |

- **Jest:** R1 (`^id`) and R1h (heading) write the upper on HEAD. R1 refuses on b4e7b4f4 and writes the upper on r3 39ccf926. R1h writes the upper on base. Logs: `sc584-r6-probe-jest-head.log`, `sc584-r6-probe-jest-R1-base-r3.log`.
- **Fix (scratch-checked, reverted):** replace the guard condition with "the section's first line is not a plain (un-prefixed) fence", i.e. the own fence was found by body in a window:
  - `if (forForm && embedded && (parseOpenFence(section.text, section.lineStart)?.prefix ?? 'x') !== '') { … }`
  - Pin suite 109 plus my 15 probes: 124/124. R1 and R1h now land in the lower counter (`sc584-r6-candidate-fix-jest.log`, `sc584-r6-candidate-fix.py.txt`).
  - Add R1 and R1h as jest tests (RV- and LP-style hosts), and a header-less quote shape (block and heading embed) in G-S77.

### MEDIUM-1: the CHANGELOGs and the proposal claim more than the code does
- **Where:** dse `CHANGELOG.md` (796f5a87) and superproject `CHANGELOG.md` (fa43eb02): "the form is placed at the spot where the plugin wrote that +". The proposal §1 says the record is taken "when the own fence was found inside a quote/callout window (`ownFence.lineStart !== section.lineStart`)".
- **Scenario:** CRITICAL-1. In a header-less quote the form is placed on the sibling, so the claim is false there.
- **Fix:** the claim becomes true once CRITICAL-1 is fixed. Then reword the proposal's guard description to the new condition.

### INFO-1: attacks on the guarded variant and the record that hold (jest `sc584-r6-probe-jest-head.log`)
- Q1-Q10 (refused +, two + rounds, + / outside edit / +, Save then a second form, a record 600 lines stale, part redrawn, callout deleted, card pins) give the same results as r4. B is never written.
- Q9 and Q9h now land in the lower counter.
- R2: a hover of a whole short note holding the header-less quote lands in the lower counter. The link finds nothing and the text search finds nothing, so the record is used.
- R3: a nested callout (`> > `) with two counters lands in the lower counter (its first line is the header).
- Remount (mK) and unload: the r5 tests exist and pass in the jest gate. `this.lastWrite = null` sits after the `renderChild !== this.renderChild` guard in `onRenderChildUnload`, so an adopted host's new section keeps its record.
- A non-callout window with two fences (a list item) was not tried in Obsidian.

### INFO-2: NO-+ probe verified
- A callout with two identical counters (both `C6`), `![[r6-nop#^r6nop]]`, pencil on the lower card with no +, then Save.
- Writes the **lower** counter, no Notice, on HEAD and on b4e7b4f4, RV and LP (`sc584-r6-probe-obsidian-r6{head,base}-nop.log`).
- This matches r5's cells. I did not run the heading-embed NO-+ cells.

## Gates (HEAD 796f5a87)
- tsc `GATE=tsc RC=0`; lint `GATE=lint RC=0`.
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7122 passed, 7124 total`.
- lifecycle part 3: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`, 509 s (loadavg 11-14).
- lifecycle part 5: `OBSIDIAN-LIFECYCLE done: 4/4 ok, 0 failed` (G-S59, G-S49, G-S73, G-S77), 245 s.
- e2e: `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (229 s).
- styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`: HEAD = my `git archive b4e7b4f4` build.
- Range-diff `734d7745..3e81f9a5` vs `b4e7b4f4..39ccf926`: 8/8 `=`. The r5 source delta is `ReadingModeBlockHost.ts` +11. `MinionStaminaPoolModal.ts` differs from 3e81f9a5 only by base (SC-566).

## Working tree
`git status --porcelain` of the dse worktree: empty (probe files removed; candidate and base-source swaps restored with `git checkout HEAD -- src/framework/host/ReadingModeBlockHost.ts`).
