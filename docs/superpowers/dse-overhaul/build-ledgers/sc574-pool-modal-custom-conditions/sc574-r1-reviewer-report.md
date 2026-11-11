# SC-574 r1 — independent review of dse `580c9f84` (base `c3fd8323`)

## Executive summary
- **Verdict: FIX-REQUIRED, docs and test wording only (no code change).** HIGH 0 · MED 1 · LOW 1 · INFO 5.
- (1) The tracker draws the same icon. Both paths draw `circle-dashed` for a custom key, and an entry's own `icon` wins in both. Color, effect and the title-cased name also match, and runtime probes covered 11 entry shapes. The aria-label wording differs ("Remove On Fire" vs the tracker's "Remove condition: On Fire"), but that difference was already there for built-in conditions (SC-572). Details in INFO-1.
- (2) Mutation results. With the whole fix reverted, 8 of the 9 new jest cases fail, and POOL-C07 and POOL-C08 fail in real Obsidian. **But POOL-C08 fails only on its "On Fire" setup line.** With the fallback kept and only the old value filter put back, **POOL-C07 and C08 both PASS**. Three jest (b) cases fail.
- **MED-1:** gap (b) cannot happen in the app. Both parsers turn every plain-text condition into a new `{key}` object (`initiative/model.ts:109-135`, `EncounterData.ts:855-877`). The old `entry !== conditionEntry` filter therefore already removed only one copy. POOL-C08 does not fail on the old code, and the CHANGELOG reports a symptom that users never had. The (b) bug was produced by the jsdom harness, which injects raw strings after parsing.
- The fix itself is correct and defensive: removal by array position, an unchanged focus hand-off, one persist per click, no cross-talk, and no write-back format change (SC-592 untouched).
- Gates I re-ran at `580c9f84`: tsc and lint rc 0 · jest 7207 passed / 1 skipped · lifecycle part 1 (has G-S1, the pool modal) 21/21 · e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`. All match the implementer's numbers.
- I skipped shots, freeze and parity. The diff touches no CSS and no shot fixture, the shot's `fight` fixture has only built-in conditions, and the DOM for built-in conditions is unchanged.
- The tree is left at `580c9f84`. `git status --porcelain` was empty before and after. Mutations were made with `git checkout` on the one src file, and the probe test file was deleted.

## Question 1: does the tracker draw the same icon? Yes.

**Pool modal** (`src/views/MinionStaminaPoolModal.ts`):
- `:30` imports `FALLBACK_CONDITION_ICON` and `titleCaseConditionKey` from `@/elements/conditionDisplay`.
- `:647` sets `displayName = condition?.displayName ?? titleCaseConditionKey(conditionKey)`.
- `:655` sets the aria-label to `Remove ${displayName}`.
- `:656` calls `setIcon(iconEl, conditionData?.icon?.trim() || condition?.iconName || FALLBACK_CONDITION_ICON)`.
- `:664-667` apply color and effect for object entries only.

**Tracker:**
- `src/elements/initiative/view.ts:2136` calls the kit's `kitBuildConditionIcons(..., control 'init.cond.remove')`.
- `src/framework/kit/conditionIcons.ts:55` defines `FALLBACK_ICON = 'circle-dashed'`. This is a deliberate copy: the kit may not import from `src/elements` (F1 OD-8, enforced by `kit-index.test.ts`).
- `:117` uses the same `icon?.trim() || iconName || FALLBACK` precedence.
- `:118` uses `titleCaseKey`, which is the same code as `titleCaseConditionKey`.
- `:127` sets the label to `Remove condition: ${displayName}`.
- `:142-143` apply color and effect to every entry. For a string entry this does nothing.

**Shared source:** the modal uses the same constant as the Conditions modal (`ConditionsModal.ts:68,282`). The tracker's copy is the SC-186 boundary duplicate.

**Can the copies drift apart?** Each copy is pinned to `'circle-dashed'` by its own test, so changing one alone turns a test red:
- `test/unit/model/conditionDisplay.test.ts:54`
- `test/dom/kit/conditionIcons.test.ts:57`
- the new pool test at `minion-stamina-pool-modal-matrix.test.ts:1123`

**Runtime probe.** A temporary jest file (since deleted) rendered each entry through the kit tracker core and through the pool modal.

| Entry | Tracker | Pool modal |
|---|---|---|
| `on-fire` | circle-dashed, "Remove condition: On Fire" | circle-dashed, "Remove On Fire" |
| `{key: hexed, icon: skull}` | skull | skull |
| `{key: hexed, color: crimson, effect: glow}` | circle-dashed, `--dse-condition-color: crimson`, `condition-effect-glow` | identical |
| invalid color or effect | both cleared | both cleared |
| `{key: hexed, icon: "   "}` | circle-dashed | circle-dashed |
| `high_ground big` | "High Ground Big" | "High Ground Big" |
| pseudo `used-triggered-action` | repeat, "Triggered Action Used" | identical |
| whitespace key `"   "` | circle-dashed, label "Remove condition: " | circle-dashed, label "Remove " |
| string `""` | label "Remove condition: " | label "Remove " |
| `{key: ""}` | skipped | skipped |
| `{}` | skipped | skipped |

Icon, color, effect and name match in every case. Only the label prefix differs (INFO-1).

## Question 2: are the new tests non-vacuous? Partly.

**Mutation A: `src/views/MinionStaminaPoolModal.ts` restored to `c3fd8323`.**
- jest (`minion-stamina-pool-modal-matrix` + `minion-stamina-pool-modal`): `Tests: 8 failed, 192 passed, 200 total`. Every new SC-574 case fails except "two equal-looking object entries are removed one at a time" (`:1165`). That case passes on the old code because the identity filter already handled distinct objects (LOW-1).
- e2e `--only=POOL-C07,POOL-C08,POOL-C01`: `OBSIDIAN-E2E done: 1/3 ok, 2 failed`. **Both C07 and C08 fail on the first `conditionNames()` assertion: "On Fire" is missing.** C08 never reached its duplicate-removal steps.

**Mutation B: fallback kept, only `:674` set back to `conditions.filter((entry) => entry !== conditionEntry)`.**
- e2e `--only=POOL-C07,POOL-C08`: `OBSIDIAN-E2E done: 2/2 ok, 0 failed`. **POOL-C08 passes on the old removal code.**
- jest matrix: `Tests: 3 failed, 127 passed, 130 total`. The failures are (b) `:1148`, second-of-two `:1156` and keyboard-focus-after-second `:1174`. All three inject raw strings after parsing.

After both mutations I ran `git checkout HEAD -- src/views/MinionStaminaPoolModal.ts`. Porcelain was empty and HEAD was `580c9f84`. The full e2e afterwards rebuilt `main.js` from HEAD.

**Other e2e checks:**
- No e2e title carries a bracketed ticket id. The only brackets are `[POOL-C07]` and `[POOL-C08]`.
- `e2e/manifest/minion-pool-modal.ts:27` lists C07 and C08 under `pool.condition`, and coverage stays at 164/164.
- Pre-existing and not from this diff: the manifest lists C04 and C05, but `--only` reports POOL-C04 as an unknown id. Those scenarios are probably titled differently in the focus specs.

## Findings

### MED-1: gap (b) cannot occur in the app, so POOL-C08 does not test it and the CHANGELOG reports a symptom users never had

**Where:**
- `CHANGELOG.md:128-129`: "A condition written twice as plain text in the note used to vanish from both places with one click; now one click removes the one you clicked."
- `e2e/specs/minion-pool/pool-conditions.e2e.ts:52-54` (comment) and `:71` (POOL-C08).

**Evidence:**
- The only callers of the pool modal are `initiative/view.ts:1762` and `:1883`. Their data comes from `initiative/model.ts:318`, where `normalizeConditions` (`:109-135`) maps every string to a new `{key, ...}` object. `EncounterData.ts:855-877` does the same.
- Probe: the YAML `- grabbed` / `- grabbed` / `- on-fire` parses to `[{key:grabbed},{key:grabbed},{key:on-fire}]`, three distinct objects with no strings left.
- Mutation B is the direct proof: on real Obsidian, the old value filter plus the new fallback passes C08.
- The original `test.failing` (b) failed only because the jsdom harness `open()` (`matrix.test.ts:57`) writes raw strings onto the instance after parsing.

**Failure scenario:** a reader of the CHANGELOG believes a duplicate-removal data-loss bug shipped and is now fixed, but it never happened. A future refactor back to identity removal would also keep C08 green, so C08 protects nothing beyond what C01 already covers.

**Prescribed fix (docs and tests only; keep the position-based removal, which is correct and defensive because the `Condition | string` type allows strings):**
1. CHANGELOG: delete the duplicate sentence, or reword it so it does not describe a symptom users saw. Retitle the bullet to "custom conditions show an icon".
2. e2e: keep C08 if wanted, but rewrite the `:52-54` comment and the title as a regression guard ("each copy of a repeated plain-text condition is its own icon, and a click removes only that one"), not as a repro of an old defect. Better still, retarget it at something the old code got wrong in the app. The custom duplicates `on-fire` / `on-fire` qualify: on the old code they were not shown at all.
3. jest `:1148-1180`: add a one-line note that strings reach the modal only when a caller bypasses parsing, and that the guard is defensive.
4. Owner, toward Scott: part 2 of the ticket did not reproduce in the plugin. It came from the jsdom matrix, not from a user-visible bug.

### LOW-1: one new jest case does not fail on the old code

**Where:** `test/dom/views/minion-stamina-pool-modal-matrix.test.ts:1165` ("two equal-looking object entries ...").

It passes with the whole fix reverted, because identity removal already handled two distinct objects. It is harmless as a guard, but it is listed as SC-574 coverage. **Fix:** either retitle it as a guard, or change it to use the SAME object reference twice (`[obj, obj]`), which the old identity filter would remove together and position-based removal removes one at a time.

### INFO-1: the aria-label prefix differs from the tracker

- Tracker: "Remove condition: On Fire" (`kit/conditionIcons.ts:127`).
- Pool modal: "Remove On Fire" (`MinionStaminaPoolModal.ts:655`).

This was already the case for built-in conditions (SC-572 deliberately matched the Conditions modal's wording), and the ticket asks only for the same icon. No action needed in SC-574.

### INFO-2: a whitespace-only key draws a button with no name

A key such as `- "   "` draws circle-dashed with the label "Remove ". This matches the tracker ("Remove condition: "), but before this diff the pool modal dropped the entry instead. `""` parses to `{key:""}` and is skipped in both.

**Possible follow-up for both renderers together, not here:** when the title-cased name is empty, use the raw key or "custom condition".

### INFO-3: an index mix-up between entries and icons is safe but untested

If a skipped entry (no key) comes before a duplicate, the entry index and the icon index differ. The code handles this correctly: removal uses `entryIndex` (`:631`, `:674`) and the focus hand-off uses the icon index (`:672`). The probe `[{color:red}, grabbed, grabbed, dazed]`: removing the second grabbed with the keyboard leaves `[{color:red}, grabbed, dazed]` and focus lands on "Remove Dazed".

No test pins this, but parsing throws on a keyless entry, so it cannot happen in the app.

### INFO-4: a click on a detached icon brings back a removed entry (unreachable, and already true before)

A synthetic click on an icon from an earlier rebuild filters the stale snapshot. Probe: clicking `[g, g, d]` at index 0, then the detached index 2, gives `[g, g]`. Base does the same with the value filter. The tracker carries the same note (SC-186 fix-round INFO-2, `initiative/view.ts:2141-2157`).

A real pointer or Enter press cannot reach a detached element, so this needs no action.

### INFO-5: the remaining probes all passed

- Mixed duplicates `['grabbed', {key:grabbed,color}, 'dazed']`: removing the second (the object) gives `["grabbed","dazed"]` with persist called once. Removing the first then gives `["dazed"]` with persist called twice in total.
- Three duplicates, keyboard: removing the last moves focus to icon index 1. Removing all of them moves focus to `pool.damage-amount` (the SC-572 r5 behavior).
- Two minions with the same conditions: removing minion 2's `on-fire` leaves minion 1 unchanged.
- In e2e, C07 and C08 each produce exactly one write per click and no write on close. The saved note keeps the other conditions and other instances.
- Lifecycle G-S1, which removes conditions at both pool call sites ("pool 2 sites × 2 removals"), passes.

## Gates (re-run at `580c9f84`; logs in the scratch dir below)
- tsc: `npm run tsc` rc 0, no output
- lint: `npm run lint` rc 0 (only the pre-existing `.eslintignore` warning)
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` / `Tests:       1 skipped, 7207 passed, 7208 total`
- lifecycle, part 1 only (G-S7a … G-S9a, which includes G-S1, the only pool-modal lifecycle scenario):
  - `OBSIDIAN-LIFECYCLE G-S1 ok (modal open across 5 writes; Done→reopen 5/5; pool 2 sites × 2 removals; collisions=0 ambiguous=0)`
  - `OBSIDIAN-LIFECYCLE done: 21/21 ok, 0 failed`
  - Parts 2-5 were not re-run; none of them touches the pool modal (grep of `obsidian-lifecycle.mjs`).
- e2e (full): `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`. The known bugs are SC-257, SC-384, SC-580, SC-355 and SC-588.
- shots, freeze and parity were not re-run (see the summary). The implementer measured 592 shots, host-leak 163/978, modal host-leak 39/234, capture clip 147, freeze 280/280 and parity 0/0/24.

## Artifacts
Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc574-r1-rev/`

| What | Files |
|---|---|
| Gate logs | `tsc.log`, `lint.log`, `jest-full.log`, `lc1.log`, `e2e-full.log`, plus a `.rc` file for each |
| Mutation A (whole fix reverted) | `jest-mut-full.log`, `e2e-mut.log` |
| Mutation B (removal only reverted) | `jest-mutB.log`, `e2e-mutB.log` |
| Probe output | `probe.log` (the probe test file itself was deleted) |

## r2 re-review (580c9f84..ec26b709)

### Summary
- **Verdict: LAND-READY.** No new findings. MED-1 and LOW-1 are fixed (owner ruling). INFO-1 to INFO-4 were dropped by the owner.
- `git diff 580c9f84..ec26b709 -- src` is empty. One commit, `ec26b709`, touches CHANGELOG, the e2e README, the C07/C08 spec, the `squad-custom.md` fixture and the jest matrix.
- (a) The CHANGELOG no longer reports a symptom users had. The duplicate sentence now describes current behavior only.
- (b) C08's title has no bracketed ticket id. On the old code it fails at its first `conditionNames()` assertion (spec `:74`). That assertion is the defect itself, not mere setup: a repeated custom condition used to show no icon at all.
- (c) The same-reference jest case fails when only the identity filter is put back.
- (d) C07 still tests a custom condition with its fallback glyph, a readable name, one write per click and the saved note.
- Gates at ec26b709: tsc and lint rc 0 · jest 7207 passed / 1 skipped · e2e `262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs`.
- The tree is left at `ec26b709`, clean.

### Details
- **(a) CHANGELOG:** `CHANGELOG.md:125-129` now reads "...named "Remove On Fire", and an icon you set on it still wins. A condition listed twice shows two icons, and a click removes only the one you clicked." It states what happens now; there is no "used to vanish" claim.
- **(b) C08, title:** "[POOL-C08] each copy of a repeated custom condition is its own icon, and a click removes only that one". The only bracketed tokens in the file are scenario ids.
- **(b) C08, whole fix reverted** (`git checkout c3fd8323 -- src/views/MinionStaminaPoolModal.ts`), e2e `--only=POOL-C07,POOL-C08`:
  - `OBSIDIAN-E2E done: 0/2 ok, 2 failed`
  - C08 fails at `pool-conditions.e2e.ts:74:34`. It expected `On Fire, Grabbed, On Fire, Dazed` and got `Grabbed, Dazed`, which confirms the implementer's account.
  - C07 fails the same way at `:59:34`.
- **(b) C08, only the identity filter put back:** C07 and C08 both pass (`2/2 ok`).
  - This is expected. Both parsers turn each copy into a separate object, so the removal defect cannot happen in the app (MED-1).
  - No in-app control can fail at a later step. C08's non-vacuity rests on its display assertion.
- **(c) LOW-1:** with only the identity filter put back, the matrix gives `Tests: 4 failed, 126 passed, 130 total`. The four are (b) `:1150`, second-of-two, keyboard-focus-after-second, and the new same-reference case "the same object entry twice is removed one at a time (a value or identity filter would drop both)". With the whole fix reverted it gives `Tests: 9 failed, 121 passed, 130 total`: all nine SC-574 cases now fail on the old code (r1 had 8).
- **(d) C07:** with the new fixture `on-fire, grabbed, on-fire, dazed` it:
  - expects the names `On Fire, Grabbed, On Fire, Dazed`;
  - checks that glyph[0] is `circle-dashed` and glyph[1] (grabbed) is not;
  - removes nth 0 with one write;
  - expects `Grabbed, On Fire, Dazed` on screen and in the note;
  - expects no write on close.
  It still covers the same things. The fixture row in `e2e/README.md` matches the new fixture.

### Gates (r2, ec26b709)
- tsc: `npm run tsc` rc 0
- lint: `npm run lint` rc 0
- jest: `Test Suites: 1 skipped, 260 passed, 260 of 261 total` / `Tests:       1 skipped, 7207 passed, 7208 total`
- e2e (full): `OBSIDIAN-E2E done: 262/267 ok, 0 failed, 5 known-bug, coverage: 164/164 pairs` (POOL-C07 ok, POOL-C08 ok)
- Not re-run: lifecycle, shots, freeze and parity. The r2 diff touches no src, no CSS and no shot or lifecycle fixture.

### Artifacts (r2)
Scratch dir: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc574-r2-rev/`

| What | Files |
|---|---|
| Gate logs | `tsc.log`, `lint.log`, `jest-full.log`, `e2e-full.log`, plus a `.rc` file for each |
| Identity filter only put back | `jest-mutB.log`, `e2e-mutB.log` |
| Whole fix reverted | `jest-mutA.log`, `e2e-mutA.log` |
