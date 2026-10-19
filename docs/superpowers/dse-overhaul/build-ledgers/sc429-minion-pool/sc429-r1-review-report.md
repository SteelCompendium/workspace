# SC-429 round 1: independent review report

**Executive summary**
- VERDICT: **APPROVE-WITH-NITS.** dse `sc429-minion-pool` @ `c1cc4fe` (base `a89ffd9`). All four items meet O1 to O4, and O5 holds (jsdom only, no manifest change, no rebaseline).
- Findings: HIGH 0 · MEDIUM 0 · LOW 2 · INFO 4.
  - LOW-1: the SC-430 draft prediction counts auto-checked boxes. Apply looks disabled ("Select 4") during a typed draft even though the commit would enable it.
  - LOW-2: the Apply Damage handler does not clamp the typed minion count to the living count. This is the §5 ruling: reachable, so fold it in.
- Gates I measured on `c1cc4fe`: tsc+lint clean · jest **4783 passed / 1 skipped / 227 of 228 suites**, rc=0 · lifecycle **`OBSIDIAN-LIFECYCLE done: 25/25 ok, 0 failed`** · e2e **`OBSIDIAN-E2E done: 62/72 ok, 0 failed, 10 known-bug, coverage: 47/47 pairs`**, rc=0.
- Shots, freeze and parity were not re-run. No browser-harness capture renders this modal; only `obsidian-lifecycle.mjs` mentions it. The implementer's logs read 572 / 0 FAIL, 276/276 and 0/0/24.
- Non-vacuity: with `src/views/MinionStaminaPoolModal.ts` reverted to `a89ffd9`, **12 of the 14** new tests fail. The 2 that pass are controls by design: the StaminaEditModal reference pin and "full squad caps at 5".
- Real Obsidian 1.14.4 probe (scratch e2e spec):
  - Focus on open is `INPUT "Damage per minion"`, the same Apply-box focus the stamina modal gets.
  - Space and Enter right after opening leave the pool at 20.
  - The idle info line computes `display: none`.

## What I ran
- Base revert: a scratch worktree at `c1cc4fe` with the modal src checked out from `a89ffd9`, running `npx jest test/dom/views/minion-stamina-pool-modal.test.ts`. Result: `12 failed, 49 passed`. Failing: all 6 item-1 tests, the item-2 focus test, item-3 "2 dead caps at 3" and all 4 item-4 tests.
- jsdom probes: `sc429-rev-probe.test.ts` (scratchpad copy listed below), covering P1 to P8.
  - **P1** stepper 0 -> 1 -> 0 -> 2 with no hand ticks: every step correct. At 0 the boxes are 11111 checked and disabled, and Apply reads "Deal 20, kill 5" enabled. At 1 they are 00000 and enabled, and Apply reads "kill 4" disabled with the "Select 4" title. 0 behaves as before, and 2 matches 1.
  - **P2** typed values (draft + blur) 12 -> 0 -> 1 -> 0 -> 2 with a hand tick on #4: the tick survives every cycle (00010 at 1 and at 2). States match the stepper path.
  - **P3** draft mismatch: this is LOW-1.
  - **P4** 2 dead, pool 12: the count box max is 3. Going 0 -> 1 gives 3 boxes, then 000 and "kill 2". Two hand picks lock the third and enable Apply.
  - **P5** over-count: this is LOW-2.
  - **P6** heal: +1 shows "Heal 1 stamina; dead minions stay dead." with the line visible. +3 past the ceiling shows the refusal text with the line visible. Reset hides it again.
  - **P7** close() after auto-check, revert and a hand tick: no persist, no `isDead` change, pool unchanged.
  - **P8** a 40-seed random walk (stepper ±, Apply Damage, Reset, typed + blur, hand toggles). Two invariants held at every step: at pool 0 all 5 are checked, and at pool > 0 no `auto` flag survives. No state was ever found with more boxes checked than the rule forced plus the user chose.
- Real-Obsidian probe (`--only=SC429REV-01,SC429REV-02`): both "FAIL"s are only the harness invariant "fence changed but not declared". My probe did not call `dse.block()`. The writes are the cell click's `selectedInstanceKey` and REV-02's intended Apply.
  - REV-01: focus, Space/Enter and the hidden info line all as in the summary.
  - REV-02: reproduces the LOW-1 draft state. The real click on the visually disabled Apply still lands, because the mousedown blur commits first. The note shows `minion_stamina_pool: 1` and #1 to #4 `isDead: true`.
- Full jest, lifecycle and e2e are on the branch worktree. The numbers are above.

## Findings

### LOW-1: the draft prediction counts auto-checked boxes, so Apply misreports during a typed pool draft
- **Where:** `src/views/MinionStaminaPoolModal.ts:422-430`, the `updateActionButton` SC-430 prediction block.
- **Scenario** (5 goblins × 4, pool 20):
  1. Apply 4 damage to 4 minions. The pool is 4 and 4 kills are owed.
  2. Tick #1 to #4 by hand. Apply enables.
  3. Press "Decrease Stamina pool" 4 times. At pool 0, #5 becomes the modal's own tick (`auto`).
  4. Type `1` into the pool field and do not blur.
- **What happens:** the draft shows Apply **disabled** with title "Select 4 minion(s) to kill". The committed state after blur is **enabled**, because the revert un-ticks #5 and leaves the user's 4.
- **Why:** with a draft present, `selectedMinions` is the raw checked count (5) whenever `newStamina > 0 && minionsToKill > 0`. That count includes boxes `updateCheckboxes` will revert at commit.
- **Base comparison:** at base no box ever reverted, so the draft and committed states agreed, both stuck. SC-429 introduced this divergence, which breaks SC-430's "draft shows the post-commit Apply state" contract.
- **Impact:** in real Obsidian the click still lands (REV-02), so no input is lost. The cost is a wrong disabled look and tooltip until blur.
- **Fix:** in that block, add a third arm so the prediction matches what `updateCheckboxes` will produce:
  `else selectedMinions = this.minionCheckboxes.filter((i) => i.checkbox.checked && !i.auto).length;`
  Add a jsdom test with the P3 sequence that asserts `snapshot()` (label / disabled / title) is equal before and after the blur, the SC-430 test pattern.

### LOW-2: the Apply Damage handler does not clamp the minion count to the living minions (the §5 ruling)
- **Where:** `src/views/MinionStaminaPoolModal.ts:177-187`.
- **Reachable by real input: yes.** A number input's `max` only bounds the spinner and arrow keys. Typed text and paste go straight through.
- **Scenario** (full squad of 5, pool 20):
  1. Type damage `1` and minions `9`.
  2. Click Apply Damage. The pool goes to 11, and the info line reads "9 damage will kill 2".
  3. Pick 2 and Apply. **Pool 11 is persisted, where the rules allow at most 5 damage (pool 15).**
- The same happens with dead members: max is 3, but typing 5 is accepted.
- **Impact:** no structural corruption (the pool is still clamped to [0, max]), but the wrong Stamina and an extra kill are written to the note.
- **In scope:** it is trivial, it sits on the same control O3 just re-capped, and O3's intent ("the max is the living count") is only advisory without it.
- **Fix:** compute `const alive = this.creature.instances?.filter((i) => !i.isDead).length ?? 0;` and use `const clampedMinions = Math.min(alive, Math.max(0, minions));`. Optionally write the clamped value back into the box so the user sees it. Add a jsdom test: full squad, `applyDamage(content, 1, 9)` gives info "5 damage will kill 1 minion(s)", and the same with `deadCount: 2` capping at 3.

### INFO-1: hand ticks are still wiped whenever no kills are owed (pre-existing)
`:498-502`: when `minionsToKill <= 0`, every box is un-checked and disabled, including hand ticks. For example: tick #2 with 1 kill owed, raise the pool back to the start, then lower it again, and the tick is gone. This happens at base too, and O1 is worded about auto-checks, so it is not a defect of this change. Owner call only if O1's "boxes the USER checked by hand keep their state" was meant generally.

### INFO-2: "Select 0 minion(s) to kill." still shows for damage that crosses no death tick
For example, 3 damage reads "3 damage will kill 0 minion(s). Select 0 minion(s) to kill." This conforms to O4 (something is pending), and the implementer's test asserts it. The ticket's original complaint is the "Select 0" wording, though, so the owner may want the second sentence dropped when `minionsToKill === 0`. It is a one-line change in the `else` arm at `:410-413`, and the SC-429 item-4 and T-4 tests would need adjusting.

### INFO-3: the extra-ticks-persist drop (owner ruling b) is confirmed harmless
In P2/P8 the Apply gate (`minionsToKill !== selectedMinions`) always blocked the over-selected state. No persisted outcome ever had more deaths than ticked boxes.

### INFO-4: CHANGELOG
The dse `CHANGELOG.md` bullet is in the unreleased 7.0.0 block, which is correct. The workspace `CHANGELOG.md` `## Unreleased` has SC-324 but not SC-426 or SC-430, so the precedent is mixed. Adding a workspace bullet at landing is the owner's call.

## Item conformance
- **O1:** met. The auto flag is set only on boxes the user had not ticked (`:481`) and reverted on any pool > 0 (`:490-495`). Hand toggles and Reset clear it. The change-handler `auto = false` is effectively unreachable, since auto boxes are always disabled, but harmless.
- **O2:** met. The `open()` override focuses `damageInput` after `DseModal.open()`'s default first-focusable call (`managedModal.ts:127`). This is confirmed in jsdom and in real Obsidian.
- **O3:** met. `max` uses the `!isDead` count (`:164-165`). The enforcement gap is LOW-2.
- **O4:** met. Line `:399` sets `hidden` iff `pending === 0`, using the attribute rather than an inline display. `.dse-sedit__info` has no `display` rule, so `[hidden]` wins, and real Obsidian computes `display: none`. The heal and refused-heal branches are unchanged.
- **O5:** met. Only the src, test and CHANGELOG files changed.

## Tree hygiene
- Branch worktree: `git status --porcelain` was empty before and after, HEAD is `c1cc4fe`.
- The scratch worktree `/home/scott/code/steelCompendium/worktrees/sc429-review-scratch` was removed with `git worktree remove --force` and pruned.
- `main.js` and `styles.css` (ignored artifacts) were removed before jest, per protocol. Lifecycle and e2e rebuilt `main.js`.

## Artifacts
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/`:
- Logs: `sc429-rev-basejest.log`, `sc429-rev-probe1.log`, `sc429-rev-jest.log`, `sc429-rev-tsclint.log`, `sc429-rev-lifecycle.log`, `sc429-rev-e2e.log`, `sc429-rev-e2eprobe1.log`.
- Probes: `sc429-rev-probe.test.ts`, `sc429-rev-probe.e2e.ts`, `sc429-rev-squad.md`.
- Real-Obsidian bundles: `sc429-rev-e2e-bundle/`.
