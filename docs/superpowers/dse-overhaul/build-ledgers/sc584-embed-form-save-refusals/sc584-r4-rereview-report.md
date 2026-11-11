# SC-584 r4 scoped re-review (reviewer-r2), dse 734d7745..3e81f9a5, superproject 43f99341

**Executive summary**
- Verdict: **FIX FIRST**. Counts: CRITICAL 1, HIGH 0, MEDIUM 1, LOW 2, INFO 3.
- CRITICAL-1, new and in real Obsidian, with **no outside edit**:
  - Setup: a `![[note#^id]]` embed of a callout that holds TWO counters. The + on the lower one makes it read like the upper one.
  - Then the pencil, then Save. HEAD writes the **upper** counter, in RV and LP, with no Notice. 734d7745 refuses.
  - Cause: SC-584 case 2's `^id`-after-the-part rule (also in r1 c8f8ef57) now lets `verifiedPinLine` accept an own-fence that `findOwnFence` picked by body in the stale callout window. That is the sibling counter.
  - The same shape as a heading embed (`![[note#Tracker]]`) writes the upper counter on base too (pre-existing). One fix closes both.
- HIGH-1 (r2) is closed: P1 P1d P2 P2n P3 refuse on HEAD (with a real + via the host, and with my r2 shapes).
- Case 1 still lands. Jest: short note, heading hover, F3. Real Obsidian: (zk)(zl)(xd)(yd) in G-S64, F3 saved, F2 keyboard path saved in RV and LP.
- (zm) "lands in the + block" was confirmed in RV- and LP-hosted hovers: the lower (+) block was written, the upper untouched, no Notice.
- The rebase changed nothing: `git range-diff` shows all 5 r1 commits as `=`.
- Gates on HEAD: tsc/lint clean · jest 7111 passed / 2 skipped · lifecycle p3 9/9 (499 s) · p5 3/3 (260 s) · e2e 255/262 ok, 0 failed, 7 known-bug, 163/163 (no RECOV-R07 / CENSUS-07 recurrence) · styles.css `5e5ff488…` = my clean 734d7745 build.

## Findings

### CRITICAL-1: a `^id` callout embed with two counters, + on the lower one, then the form: Save writes the UPPER counter (regression; base refused)
- **Where:**
  - `src/framework/host/ReadingModeBlockHost.ts:614-619` (`findOwnFence` → `locateInSection(…, this.knownBody, …)`): with a stale window, the only block holding the known body is the SIBLING.
  - `:822-830` (`takePin`): that wrong `ownFence.lineStart` becomes the pin's relative line.
  - `:936-944` (`verifiedPinLine`): the marker for a quoted fence is looked for after `max(found.lineEnd, partEnd)`. That is the callout's end, so `^id` verifies for the sibling's fence. Before SC-584 the marker was looked for after the sibling's closing fence, found `> mid text`, and refused.
- **Scenario (real Obsidian 1.15.1):**
  - Fixture `r4-cal2.md`: `> [!note] Camp`, then the upper counter (plugin key order, value 6), then `> mid text`, then the lower counter (`COUNTER(5,'Twin')`), then a blank line and `^r4cal`.
  - Host note: `![[r4-cal2#^r4cal]]`.
  - Steps: + on the lower card, then its pencil in the same page turn. The form opens; the + made both counters read `max_value: 20|current_value: 6|min_value: 0|name: Twin`. Rename `Twin` → `Edited` in the raw box, then Save.
  - HEAD, RV and LP: the disk gets `name: Edited` in the **upper** counter. No Notice, the form closes. No outside edit is involved.
  - 734d7745 bundle, RV and LP: refused, one Notice, the form stays open, nothing written.
  - Logs: `sc584-r4-probe-obsidian-r4-head-q9.log`, `sc584-r4-probe-obsidian-r4-base-q9.log`.
  - Jest Q9: HEAD and r1 c8f8ef57 write the upper; 734d7745 refuses (`sc584-r4-probe-jest-Q9-head-base-r1.log`).
- **Same shape, heading embed (pre-existing):** `![[r4-cal2h#Tracker]]` writes the upper counter on HEAD **and** on 734d7745, RV and LP, in real Obsidian (`sc584-r4-probe-obsidian-r4{head,base}-q9h.log`) and in jest Q9h. Not caused by SC-584, but it is the same + then pencil shape SC-584 is about, and the same fix closes it.
- **Fix (checked in scratch, then reverted):** a form pin taken right after this host's own write should come from that write, not from a by-body search of a stale window.
  - In `takePin`, before `const pin = { text: section.text, … }`, add:
    `if (forForm && embedded && this.ownFence.lineStart !== section.lineStart) { const w = this.pinFromLastWrite(); if (w) return w; }`
    (for a block inside a quote/callout window, which is where the own fence is found by body).
  - With it, the pin suite (101) plus my 11 probes pass: 112/112, Q9 and Q9h land in the lower counter (`sc584-r4-candidate-fix-jest.log`).
  - Add Q9 and Q9h as jest tests, and a lifecycle phase (G-S77 in part 5, or G-S64): a `^id` callout embed with two counters, + then pencil, RV and LP, lands in the lower.
  - Optional hardening: when `locateInSection` has several fences in the window, prefer the DOM ordinal over the body.

### MEDIUM-1: the CHANGELOG over-claims, for CRITICAL-1
- **Where:** dse `CHANGELOG.md` (3e81f9a5) and superproject `CHANGELOG.md` (43f99341): "It now saves into the counter you pressed + on … an identical counter elsewhere in the note is never chosen."
- Q9 and Q9h contradict this today.
- **Fix:** true once CRITICAL-1 is fixed. Re-check the proposal's "Still refused" list then.

### LOW-1: `setMountedBody` clearing the record is load-bearing, and r3 calls the mutant mK "equivalent"
- **Where:** `ReadingModeBlockHost.ts:692-695`; `remountReused.ts:63` (`host.setMountedBody(body)` when Obsidian hands this host's element to ANOTHER block with the same body).
- **Scenario:** without the clear, a host re-mounted onto a twin block with the same body keeps the record of its old block (body equal to the known body). A form opened right after on the re-mounted card would be pinned at the old block.
- The code is correct (it clears); only the "equivalent" claim and the missing test are wrong.
- **Fix:** add a jest test: + (record), then `setMountedBody(sameBody)` as remountReused does, then a stale part, then a form: refused, never the old block.

### LOW-2: the record is not explicitly dropped on unload
- **Where:** `ReadingModeBlockHost.ts:486`, `:530-538` (`onRenderChildUnload`).
- The note string lives as long as the host. The host is released with its registry entry (`viewRegistry.ts:238-243`) and is otherwise referenced only by its view/closures and an open form.
- So it is bounded, and it cannot be consumed by another host: it is a per-instance field (test "a write by ANOTHER host"; my Q-probes).
- **Fix (optional, per owner's FOLD/DROP rule):** `this.lastWrite = null` in `onRenderChildUnload`. Otherwise DROP.

### INFO-1: the record attacks I could not break (jest `sc584-r4-probe-jest-head.log`)
- Q1, the + refused by SC-480 (identical block above): no record, form refused, note unchanged.
- Q2, two + rounds then the pencil: lands in A with the second body.
- Q3, +, an outside edit of A, a second +: the second + is dropped; the form is refused; B is never written.
- Q4, a form Save then a second form at once with the part still stale: lands in A again.
- Q5, an old record and the note changed by 600 lines: refused, never B.
- Q6, the part redrawn after the + (fresh, A identical to B, block-only part): the form uses the record and lands in A.
- Q8, a callout + then the lower callout deleted, the upper holding the + body: refused.
- Q10, card pins never take the record: the third + was refused as on base.
- Also covered: the sibling host (r3 test), and "+ on A then the pencil on B's card" (B's host has no record: refused, as on base).
- Note renamed between + and pencil: `getAbstractFileByPath` of the old path fails, the pin stays partial, refused (by inspection).

### INFO-2: SC-596 shapes are unchanged
- P13 without a + (callout, stale window, host knows the body by mount, A edited, upper holds the body) still has no pin and writes the upper (Q7). The same holds on base. It is in SC-596.
- P4 is unchanged.

### INFO-3: r2 items that are closed
- P1-P3 refuse.
- P5 lands (the plain `^id` rule restored).
- P11 refused, P12 lower.
- (zc) relabelled as a smoke check.
- The proposal's footgun matches F2.
- SC-595 is not claimed fixed.
- r3 mutants: I did not re-run them, apart from the candidate-fix check above.

## Real Obsidian matrix (r4 HEAD bundle bc0afa1d… / 734d7745 bundle 8ecd8cfd…; styles 5e5ff488 both)

| probe | 734d7745 | HEAD |
|---|---|---|
| Q9 `^id` callout embed, 2 counters, + lower, pencil, Save (RV) | refused, 1 Notice | **wrote the UPPER** |
| Q9 same (LP) | refused, 1 Notice | **wrote the UPPER** |
| Q9h heading embed, same callout (RV / LP) | **wrote the UPPER** | **wrote the UPPER** |
| (zm) shape: hover from an RV host, + on the lower (now reads like the upper), pencil, Save | n/a | wrote the lower (+) block, no Notice |
| (zm) shape: hover from an LP host | n/a | wrote the lower (+) block, no Notice |
| F3 whole long-note hover, scrolled, + then pencil, Save | (r2: refused) | saved |
| F2 keyboard path, RV / LP | (r2: refused) | saved / saved |

## Gates (HEAD 3e81f9a5)
- tsc `GATE=tsc RC=0`; lint `GATE=lint RC=0`.
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` · `Tests: 2 skipped, 7111 passed, 7113 total` (134 s, loadavg 20).
- lifecycle part 3: `OBSIDIAN-LIFECYCLE done: 9/9 ok, 0 failed`, 499 s (loadavg 12-14).
- lifecycle part 5: `OBSIDIAN-LIFECYCLE done: 3/3 ok, 0 failed`, 260 s.
- e2e: `OBSIDIAN-E2E done: 255/262 ok, 0 failed, 7 known-bug, coverage: 163/163 pairs` (236 s, loadavg 9-12). RECOV-R07 and CENSUS-07 did not recur.
- styles.css `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`: HEAD = my `git archive 734d7745` build.
- Range-diff `eeed5182..525115b0` vs `734d7745..ec4875a2`: 5/5 `=`.

## Working tree
`git status --porcelain` of the dse worktree: empty. The probe test files were removed, and the candidate-fix and base-source swaps were restored with `git checkout HEAD -- src/framework/host/ReadingModeBlockHost.ts`.
