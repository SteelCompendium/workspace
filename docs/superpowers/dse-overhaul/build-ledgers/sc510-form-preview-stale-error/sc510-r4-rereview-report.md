# SC-510 r4 scoped re-review — delta be35c6a..2d01bd8 (reviewer B)

## Executive summary
- Verdict: **LAND-READY**. Reviewed dse 2d01bd8 on f89f69f (origin/develop is still f89f69f after fetch), superproject 088bbc9. Findings: 0 HIGH, 0 MEDIUM, 1 LOW (test-only), 3 INFO.
- Rebase: `git range-diff 253aa5f..be35c6a f89f69f..51f24b6` shows both r1 commits unchanged (`=`): 47892bb is now 550827d, and be35c6a is now 51f24b6.
- Pure move (8cda8a2): the moved block is byte-identical apart from blank lines and the new header comment.
  - `errorCard.ts` has only type imports (`./registry`, `./validation`), so it introduces no import cycle.
  - pipeline re-exports `ElementStageError`, `renderErrorCard` and `ErrorStage`.
  - The dropped `ValidationResult` import is the only drive-by.
- Mutants on 2d01bd8: 7 run.
  - Killed (5): no current-slot check, badge left on, a stale rejection touching the badge, no error card, and M2 (host `containerEl` left as the box). LOW-1 from r2 is now killed.
  - **R2 (draw into `previewEl` instead of the slot) SURVIVES.** That is the new LOW-1.
  - R5 (`previewSlot` not reset) survives but is an equivalent mutant (INFO-1).
- Real Obsidian 1.15.0, with the 2d01bd8 bundle and real keys:
  - `@Bad510.md`: the preview shows the error card with text identical to the real card's ("Feature: failed to render (render)Cannot read properties of null (reading 'effects')"). The card sits inside the slot, there is no badge, and there are 0 unhandled rejections.
  - Typing a valid body (`@Ref.md`, or the inline example) brings the badge back (`::after` content "Read-only").
  - `@Ref.md` typed char by char ends on Ref Strike.
- Battery on 2d01bd8:
  - Re-ran myself: tsc rc 0; lint rc 0; jest **6099 / 1 / 246 of 247** (rc 0, rerun); e2e 123/123, 0 known-bug, 87/87; freeze 280/280.
  - The first jest run had 1 timeout in the known SC-506 load flake. Details in INFO-3.
  - Taken from A's r3 logs, tied to 2d01bd8: lifecycle 38/38, shots 592 / 0 FAIL / host-leak 114/684, parity 0/0/24.

## 1. Rebase fidelity
`git range-diff 253aa5f..be35c6a f89f69f..51f24b6`:
```
1:  47892bb = 1:  550827d test(SC-510): red -- ...
2:  be35c6a = 2:  51f24b6 fix(SC-510): ...
```
Log: `sc510-r4-range-diff.log`.

## 2. Pure move (8cda8a2)
- I diffed the lines removed from `pipeline.ts` against the lines added in `errorCard.ts`. The only differences are:
  - the import line: pipeline's `import type { ValidationService, ValidationResult }` becomes `ValidationService` in pipeline, and errorCard gets `import type { ElementDefinition }` plus `import type { ValidationResult }`;
  - the new 4-line header comment;
  - two blank lines.
- Every body (`ErrorStage`, `ElementStageError`, `isValidationResult`, `renderErrorCard`) is identical. Log: `sc510-r4-pure-move.log`.
- `pipeline.ts` adds `import { ElementStageError, renderErrorCard } from './errorCard'`, `export { ElementStageError, renderErrorCard }` and `export type { ErrorStage }`. `RefUnwrapView.ts:16` and `test/dom/framework/pipeline.test.ts:17` still import from pipeline and pass (tsc and jest are green).
- No cycle:
  - `errorCard.ts` imports types only.
  - `registry.ts` imports `./experimental` and `validation.ts` imports ajv and obsidian; neither imports pipeline or authoring.
  - `FormModal.ts:37` imports `@/framework/errorCard`, not pipeline.
- `isValidationResult` stays module-private, as before. It is not exported and is used only inside `renderErrorCard`.

## 3. Fix 2d01bd8 (`src/authoring/FormModal.ts:109,424,443,463-467`)
- `previewSlot` is set to the new slot at :443, reset to null at :424 on every render, and the catch at :464 returns unless `this.previewSlot === slot`.
- The card is drawn into the slot at :465, and the badge is removed from the box only for the current slot at :466.
- This matches the ruling: a stale slot's rejection draws nothing at all, not even into its own detached slot, which is stricter than "only into its own detached slot" and is fine.

Mutants (each applied to FormModal.ts, the 21-test suite run, then restored; log `sc510-r4-mutants.log`):

| Mutant | Result |
|---|---|
| R1 drop `if (this.previewSlot !== slot) return;` | 2 fail (killed) |
| **R2 `renderErrorCard(this.previewEl!, …)` instead of `slot`** | **0 fail (SURVIVES)** |
| R3 keep the badge (drop :466) | 2 fail (killed) |
| R4 a stale rejection removes the badge | 2 fail (killed) |
| R5 no `previewSlot = null` reset (:424) | 0 fail (survives, equivalent; see INFO-1) |
| R6 no error card (drop :465) | 2 fail (killed) |
| M2 host `containerEl: this.previewEl` (r2 LOW-1) | 2 fail (killed) |

## Findings

### LOW-1: the error card's placement inside the current slot is not pinned (R2 survives)
- Where: `src/authoring/FormModal.ts:465`. Test: `test/dom/authoring/formModalStalePreview.test.ts:261-279`, which checks `preview.querySelector('.dse-error-card')` text, child count 1 and no badge.
- What happens: R2 draws into the box instead of the slot. `renderErrorCard` empties the box, which removes the slot, then appends the card directly. Every assertion still holds: there is 1 child, the text is the same, and there is no badge.
- Failure scenario: today the user sees the same thing. But the "slot is the only thing a mount writes to" invariant (D1) is then broken for the current-render error path with no test to catch it. A later change that relies on the slot being the box's only child (for example a second late writer into the slot) would go unnoticed. The brief requires this mutant to go red.
- Real Obsidian confirms HEAD is correct: `.dse-form__preview > .dse-form__preview-slot > .dse-error-card` is present.
- Fix (one assertion at :276): `expect(form.preview.querySelector(':scope > .dse-form__preview-slot > .dse-error-card')).toBe(card);`

### INFO-1: R5 (the `previewSlot = null` reset at :424) is an equivalent mutant
- Without the reset, `previewSlot` keeps a superseded slot only when the render that superseded it returns early: `saveDisabled` at :428, or a `def.parse` throw before :443. In both cases the box has no slot and no badge.
- A late rejection of that old slot would then draw into its detached slot, which is invisible, and remove a badge that is already absent. No observable effect. Keep the reset (it makes the intent explicit); no test needed.

### INFO-2: element-drawn error cards still carry the Read-only badge
- The new rule ("no badge over an error card") applies only to mount rejections. Error cards that `RefUnwrapView` draws itself for a lookup failure ("Reference file … not found", "Failed to parse YAML in …", "Reference nesting too deep") resolve the mount successfully, so the badge stays over them (`sc510-r2-shot-fu1-held.png`).
- This is unchanged from r1, and the implementer flagged it. Fixing it means element code or FormModal inspecting the slot after the mount resolves, which is outside D2. Owner's call whether to note it on SC-525 or a new Backlog ticket. Not blocking.

### INFO-3: jest load flake on the first run
- `sc510-r4-jest1.log`: 1 failure, a 5000 ms timeout at `test/dom/elements/initiative-default-keys.test.ts:459`. This is the documented SC-506 load flake; 1-minute load was 21.37.
- Re-running the suite alone gave 25/25 (`sc510-r4-jest-initiative-rerun.log`). The full re-run gave rc 0, `Tests: 1 skipped, 6099 passed, 6100 total`, `246 of 247` (`sc510-r4-jest2.log`).

## 5. Real Obsidian (throwaway scenario; scratch copy of the lifecycle harness, port 9294, own Xvfb, 2d01bd8 bundle)
Summary line: `SC510-R4 ok (sameAsCard=true badgeOnError=null badgeAfterValid=true/true ref=true rejections=0/0/0/0)`.
- **Real card**, note `Lifecycle/sc510-bad-card.md` with body `@Bad510.md` (whose block is `# only a comment`): "Feature: failed to render (render)Cannot read properties of null (reading 'effects')".
- **Form preview**, `@Bad510.md` typed with real keys:
  - The `.dse-error-card` text is identical to the real card's (`sameAsCard: true`), with 1 child and 1 slot, and the card is inside the slot.
  - `data-dse-readonly` is absent, and `getComputedStyle(preview,'::after').content` is `none`. The box is 69 px tall.
  - 0 page errors and 0 rejections.
  - Screenshot: **`sc510-r4-shot-error-preview.png`**. It shows the YAML box with "@Bad510.md", below it the red "Feature: failed to render (render)" card with "Cannot read properties of null (reading 'effects')", and no badge.
- **Then a valid body**, `@Ref.md` via insertText: Ref Strike is shown, the badge attribute is "true", the `::after` content is "Read-only", and there is no error card.
- **Error again, then the inline feature example**: Coverage Strike is shown, the badge is "true", there is no error card, and there are 0 errors (`sc510-r4-shot-valid-after-error.png`).
- **r2 path**, `@Ref.md` typed one character at a time with real keys: it ends on Ref Strike with the badge "true", 1 slot, no error card and 0 errors (`sc510-r4-shot-ref-natural.png`).
- Log: `sc510-r4-obsidian-probe.log`. Scenario source: `sc510-r4-obsidian-probe-scenarios.js.txt` (it uses the r2 kit, `sc510-r2-obsidian-probe-kit.js.txt`).

## 6. Battery on 2d01bd8
| Gate | Source | Result |
|---|---|---|
| tsc (incl. `-p e2e`) | re-run, `sc510-r4-tsc.log` | rc 0 |
| lint | re-run, `sc510-r4-lint.log` | rc 0 (only the existing `.eslintignore` warning) |
| jest | re-run, `sc510-r4-jest2.log` | rc 0, 6099 passed / 1 skipped / 246 of 247 (first run: SC-506 flake, INFO-3) |
| e2e | re-run, `sc510-r4-e2e.log` | `123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs` |
| freeze | re-run on the worktree shots, `sc510-r4-freeze.log` | `freeze OK (280/280 …)` |
| lifecycle | A's `sc510-r3-lifecycle.log` | `38/38 ok, 0 failed` |
| shots | A's `sc510-r3-shots.log` | 592, 0 FAIL, button host-leak 114/684 |
| parity | A's `sc510-r3-parity.log` | 0 gaps / 0 undeclared / 24 declared |

How A's r3 logs are tied to 2d01bd8:
- The commit is dated 07:24:05.
- The worktree's `visual-harness/shots/*.png` are dated 07:43, and parity's harness build in `visual-harness/dist/harness.js` is dated 07:50:20. Both are after the commit.
- The shots log reads 114/684, which only f89f69f's harness produces, so it ran on the rebased tree.
- Each r3 log's content differs from the r1 logs except freeze's one-line summary. The r3 logs themselves all share one copy time, 07:50:31.

## Tree state
- dse is clean at 2d01bd8 before and after. Every mutant was restored with `git checkout -- src/authoring/FormModal.ts`, and the `main.js` / `styles.css` build artifacts were removed.
- The superproject is at 088bbc9 with only ` M draw-steel-elements`, the unbumped pointer, as found.
