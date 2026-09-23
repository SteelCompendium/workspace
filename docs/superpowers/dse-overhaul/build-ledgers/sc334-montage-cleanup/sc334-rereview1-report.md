# SC-334 re-review 1 (scoped: review-1 fold) — report

**Verdict: APPROVE.** Every folded finding is fixed, checked by running it rather than reading it. The fold adds no new defect. New findings: 0 HIGH, 0 MED, 1 LOW, 1 INFO. Delta reviewed: dse `e6c551c..49309c6` (`4a3399f`, `49309c6`) plus the worktree superproject's `CHANGELOG.md` bullet.
- **Gates at `49309c6`, re-run by me, all match `sc334-battery-r2.md`:**
  - tsc and lint clean.
  - jest 3919 passed / 1 skipped / 202 of 203 suites / 3 snapshots.
  - shots 524 PNGs, 0 FAIL.
  - freeze `260/260`.
  - parity 0 gaps / 0 undeclared / 16 declared, exit 0.
- **Real-Obsidian camera (private Xvfb):** 6/6 OK. No sideways scroll. The focus ring fits inside the body on 5 of the 6. modal-montage-edit is skipped with "draws no outline" (see the probe below).
- **Can-fail, ring check:** removing the body padding makes the camera FAIL on modal-montage-limits, naming "cut off on **top 4.0px**, right 4.0px". It also fails on modal-form ("left 4.0px, right 4.0px").
- **Can-fail, overflow figure (INFO-7):** putting `.dse-mt__sheet-input` back in GROUP 1 now reports the true **+14.8px**.
- **MED-1:** the Back → Log an action… sequence now finds the button real-disabled and writes nothing. The sheet's own guard refuses a new entry for a `(hero, round)` that already has one. LOW-1 post-Back count is fixed (1 → 1, not 2). INFO-2 is fixed ("3 rounds used"). LOW-2 is a solid red chip in both themes. MED-2 images are regenerated and correct.
- **New LOW-1:** the ledger ruling says the disabled bar button's "tooltip says why". Nothing implements that.
- **Optchip probe (report only):** a keyboard-focused **pressed** `.dse-optchip` shows **no focus indicator at all** in real Obsidian. An unpressed one gets only Obsidian's faint grey host ring. Both predate SC-334.

---

## Folded findings — verification

| Finding | How verified | Result |
|---|---|---|
| MED-1 (bar fallback → hidden duplicate) | Probe P-A: mid fixture → Back to round 2. Probe P-A0: every hero acted in round 1, with no Back | Bar `Log an action…[disabled] \| Undo \| Back to round 1 \| End round 2`. Clicking it opens no sheet; the only write was Back's. P-A0: bar disabled; the row "+" for Kira opens the **edit** sheet ("Save"). |
| MED-1 defence in depth (sheet guard) | Probe P-G: `LogActionModal` built directly on the mid model | New Kira r2 (duplicate) → Log disabled, and stays disabled after changing the Result chip. New Kira r3 → enabled. Edit Kira r2 → Save enabled. |
| MED-2 (stale docs images) | Viewed `docs/Media/montage-sheet-modal.png` and `docs/Media/montage.png` at `49309c6` | Sheet: Result/Skill/Note only, sub-line "the round in play", no right-edge clip. Board: solid red failure slots, no end-cap, the quick trio, bar with **Back to round 2**. |
| LOW-1 (actions left after Back) | Probe P-B: 2 heroes, round 3 half-logged, Back to 2. Probe P-B2: duplicate, orphan and out-of-range entries | Stays 1 → 1 (was 1 → 2). P-B2 gives the exact expected 3. Brink is correct on both. |
| LOW-2 (light sheen over red) | Fresh `montage-mid` crops, light and dark | Solid `--dse-danger` chip in both themes. No pink gradient. Filled vs empty is obvious. Print untouched: freeze 260/260. |
| LOW-3 (no gate for R-6) | Camera run at HEAD, then with the body padding removed | HEAD: ring inside the body on limits, stamina ×2, form and conditions. Can-fail: limits "top 4.0px, right 4.0px"; form "left 4.0px, right 4.0px". The jest source contract (`managedModal.test.ts`) is in the green suite; the owner reports it can fail. |
| INFO-2 (rounds used) | Probe P-C | current 4 / rounds 3 → "3 rounds used". current 9 → 3. Limit reached mid round 2 → 2. |
| INFO-3 / INFO-4 | Read | Comment and CHANGELOG wording fixed ("metal chips"). |
| INFO-7 (overflow figure 4px low) | Camera with `.dse-mt__sheet-input` put back in GROUP 1 | Reports `right+14.8px` (was +10.8). |
| Workspace `CHANGELOG.md` bullet | Read against probed behaviour | Accurate: greyed-out Log an action…, Back to round, solid red, end-cap gone, rounds-used cap. Still uncommitted by design until the pointer bump. |

## New findings

### LOW-1 — the disabled "Log an action…" gives no reason, though the ruling says it should

- **Where:** `src/elements/montage/view.ts:212-228`.
- **Ruling:** the Review-1 MED-1 entry in `sc334-decisions.md` reads "bar button real-disabled when `nextHeroToAct` is undefined (**tooltip says why**)".
- **What shipped:** only `disabled` plus the unchanged `aria-label="Log an action…"`. Probe P-A shows the attributes are exactly `class`, `type`, `disabled`, `aria-label`, with no `title` and no description.
- **Scenario:** a Director (or a screen-reader user) reaches a round where everyone has acted. The accent button is simply dead. Only `docs/gm-trackers.md` explains why.
- **Prescribed fix, either of:**
  - Add the reason. For example `title` / `aria-description` "Every hero has acted this round — End round N, or click a cell to correct it". A `title` on a disabled `<button>` is not reliably hoverable, so `aria-description` or visible hint text is the robust choice.
  - Amend the ledger to drop "tooltip says why". This is the owner's call.

### INFO-1 — the new ring check never covers the montage sheet

- **Where:** `visual-harness/obsidian-camera.mjs`, the new ring check. It returns `skipped` when `outlineStyle === 'none'`.
- **Details:** the sheet auto-focuses the Success `.dse-optchip`, which draws no outline. So the SC-334 sheet's own focus state is never checked. The check is correct as written; the gap is the optchip's missing ring (see the probe below). If the optchip joins the shared ring rule, the sheet's capture starts checking automatically.

## Probe (report only) — does a keyboard-focused `.dse-optchip` show any focus indicator in real Obsidian?

- **Method:**
  - A temporary camera edit, reverted byte-clean afterwards.
  - Real keyboard focus via CDP `Input.dispatchKeyEvent` Tab. `:focus-visible` was true in every sample.
  - For each chip, computed style focused vs the same element blurred.
  - Real Obsidian 1.14.2, Steel dark, montage edit sheet.

| Chip state | Focused vs unfocused (computed) | Visible indicator? |
|---|---|---|
| **Pressed** (Success, the auto-focused one; also reached by Tab) | **Identical**: outline `none`, box-shadow = chip bevel, border `rgb(77,184,199)`, same background | **None.** The focused pressed chip is pixel-identical to the unfocused one (`optchip-focus-success-pressed.png`). |
| **Unpressed** (Failure, Assist) | box-shadow becomes `rgb(85,85,85) 0 0 0 3px` (Obsidian's `button:focus-visible { box-shadow: 0 0 0 3px var(--background-modifier-border-focus) }`) instead of the host input-shadow stack; outline `none` | A faint grey 3px ring (`cam-head2/modal-montage-edit--optchip-focus-unpressed.png`). #555 is about 1.7:1 against the chip's #333 and about 2.2:1 against the modal ground, below the 3:1 non-text contrast guideline. |

- **Why:**
  - `.dse-optchip` is a bare `<button>`. It is not in the shared kit focus-ring rule (~`styles-source.css:14041`) and not in the button host re-grounding.
  - Unpressed chips therefore fall through to Obsidian's host `button:focus-visible` box-shadow at (0,1,1).
  - Pressed chips have `[data-dse-theme='steel']:not([data-dse-print="on"]) .dse-optchip[aria-pressed='true'] { box-shadow: var(--dse-chip-bevel) }` (`styles-source.css:2107`, (0,4,0)). That rule outranks the host focus rule, so the only indicator is removed.
  - The shots' button host-leak sweep does not catch it because `.dse-optchip` only renders inside modals and is not a `.dse-btn` kind.
- **Predates SC-334: yes.**
  - `git diff d124cc3..HEAD -- styles-source.css` contains no `optchip` lines, and `d124cc3` has the same four `.dse-optchip` rules at the same lines (2086–2107).
  - At `d124cc3` the sheet's first focusable control was the pressed **Hero** chip (also `.dse-optchip`), so the auto-focused control had no indicator there either.
  - The same chips are used by ConditionsModal. My Tab walk in modal-conditions did not reach an optchip within 14 stops (its chips live in the customize panel), so they were not measured, but the same rules apply.
  - I did not run the camera on a `d124cc3` build; the conclusion rests on byte-identical CSS for these selectors plus the identical host sheet.
- **Suggested Backlog shape (owner decides):** add `.dse-optchip:focus-visible` to the shared kit ring rule (outline 2px + offset 2px). The body padding already leaves room for it. Also re-ground its host box-shadow the way the `.dse-btn` kinds are.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/39e9758e-af5c-4490-a2ab-3a5ccb229f53/scratchpad/rerev1-1790174991/`)

- Battery: `exits`, `tsc.log`, `lint.log`, `jest.log`, `shots.log`, `freeze.log`, `parity.log`
- `probe.log`: P-A, P-A0, P-G, P-B, P-B2, P-C, from a temporary untracked test file, since deleted
- `tracks-light.png`, `tracks-dark.png`: `montage-mid` failure-track crops at `49309c6`
- `cam-head/`: 6-modal camera at HEAD plus the optchip probe lines (in `cam-modal-montage-edit.log` and `cam-modal-conditions.log`)
- `cam-head2/modal-montage-edit--optchip-focus-unpressed.png` and `optchip-focus-success-pressed.png`: the optchip focus crops
- `cam-canfail-pad/`: body padding removed → limits and form FAIL
- `cam-canfail-g1/`: GROUP 1 re-add → sideways FAIL at +14.8px
- `modalcam.sh`: my wrapper (port 9277, own camtmp). **Note:** my first HEAD run used the owner wrapper's current port **9245**, copied before I patched it, so it shared a port with the owner's wrapper. It completed cleanly. Every later run used 9277.

Tree state: dse `git status --porcelain` was empty before and after. The superproject shows the same ` M CHANGELOG.md` / ` M draw-steel-elements` as at start. The temporary camera, CSS and test edits were all reverted and `git diff` is empty. The ignored `main.js` / `styles.css` were removed.
