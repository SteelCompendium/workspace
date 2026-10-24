# SC-501 r2 independent review — dse 1918a29 (on a993a60)

## Executive summary
- Verdict: **APPROVE_WITH_NITS**. 0 HIGH, 0 MEDIUM, 2 LOW, 4 INFO.
- Gates I re-ran at `1918a29`: shots rc 0, 592 PNGs, 0 FAIL, expected `OBSIDIAN APP.CSS PIN DRIFT`. Freeze `freeze OK (280/280 …)` rc 0. Every host-leak line matches the implementer's report exactly: gallery 113/678 with 12 records, modal 10/9/38/228 with 6, input 164, checkbox 60.
- The fix can fail, and it does so loudly. With no click, a wrong click, or no roll strip, each of the button, input and checkbox sweeps exits 1 with a named problem. None of them falls back to exemptions. A second call is a no-op (`toOpen=0`), so the helper never closes an open disclosure.
- No leak into captures: all 592 PNGs are byte-identical between a fresh `a993a60` run and `1918a29` (sha256 diff empty). Each sweep navigates first and the open state does not survive a navigation (measured).
- The 12 gallery records are exactly the expected ones, and no exemption got wider. "8 old + 2 Reset" is correct: the 8 old records include roll stepper (disabled) ×2, which was already exempted at `ea56712`.
- **FU-1 measurement: 0.** No input record and no checkbox record is box-less on `1918a29`, in either scheme. Under the owner's FU-1 ruling, the box-presence assertion therefore gets FOLDed into r3.
- No other collapsed disclosure hides a swept control. After the click, all 262 button, 23 input and 7 checkbox nodes in the gallery have a box in both schemes.
- LOW-1: the modal boundary's kind key carries no modal name, so `…--accent|disabled ×6` hides that 3 different modals contribute to it. LOW-2: a comment range is stale.

## Gates (re-run by me)
| Gate | Result | Log |
|---|---|---|
| shots @ 1918a29 (sc501 worktree) | rc 0, 592 PNGs, 0 FAIL, PIN DRIFT warning (expected) | `…/sc501-r2rev-rv1918/rv1918-shots.log` |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical …)` rc 0 | `…/rv1918-freeze.log` |
| shots @ a993a60 (scratch tree, base) | rc 0, 592 PNGs | `…/rv1918-baseshots-a993a60.log` |
| all-PNG byte compare base vs head | 592 vs 592, diff empty | `…/rv1918-png-{a993a60,1918a29}.sha256`, `rv1918-png-diff.txt` (0 lines) |
| in-run line diff base vs head | only the boundary block differs (20 → 12 records, plus the kind listing) and the `text scale once` runtime (81s/89s). The input, checkbox, modal and text-scale counts are identical | `…/rv1918-inrun-lines-diff.txt` |
| jest, the 9 suites that read `shoot.mjs` (scratch tree, pristine head shoot.mjs) | 9/9 suites, 288/288 | `…/rv1918-jest-shootmjs-readers.log` |

Lifecycle and e2e were not run. The commit touches only `visual-harness/shoot.mjs`, and neither `obsidian-lifecycle.mjs` nor `e2e/` imports it (grep). The implementer's runs stand: lifecycle 36/36, e2e 114/114 79/79.

Printed lines at 1918a29 (verbatim excerpt):
```
button host-leak OK (113 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 678 comparisons: …)
  12 of those (kind,state) records sampled the node at rest …:
      10× focus-visible: disabled
          montage|dse-btn|disabled ×2
          negotiation|dse-btn|disabled ×2
          party|dse-btn.dse-btn--icon.dse-stepper__btn|disabled ×2
          roll|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled ×2
          roll|dse-btn.dse-btn--icon.dse-stepper__btn|disabled ×2
      2× hover: no point in its box hit-tests to it (clipped by an ancestor overflow, or covered)
          initiative|dse-btn.dse-init__stamina ×2
modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds … = 228 comparisons …)
      6× focus-visible: disabled
          modal:(none)|dse-btn.dse-btn--accent|disabled ×6
input host-leak OK (14 input kinds × 6 states … = 164 comparisons …)
checkbox host-leak OK (3 plugin-authored checkbox kinds × 7 states [42] + 1 synthetic … = 60 comparisons …)
```

## Method
- Scratch tree `…/sc501-r2rev-rv1918/tree-1918a29` (`git archive 1918a29`, `node_modules` symlinked, pinned app.css cache copied). The instrumentation is env-gated (`rv1918-instrumentation.patch`):
  - `RV_SWEEPS_ONLY` runs only the chosen sweeps.
  - `RV_SKIPCLICK` / `RV_WRONGCLICK` (clicks the strip's Roll button instead) / `RV_NOROLL` (removes every `ds-roll` root first) / `RV_TWICE` (calls the helper twice).
  - `RV_DUMP` prints a per-key census of every button/input/checkbox node (total, visible, tagged box), per-comparison input boxes, and the location of each exemption.
- After the probes I copied the pristine `shoot.mjs` back (`cmp` identical to the sc501 head).
- The base tree `…/tree-a993a60` is unmodified.
- The sc501 worktree was never edited. `git -C …/draw-steel-elements status --porcelain` is empty before and after, and HEAD is `1918a29675f9945179125cb3830212b542528108`. The superproject's ` M draw-steel-elements` was there before I started and is unchanged.

## Probe results
1. **Gate numbers:** match the implementer's report (table above).
2. **Can it fail?** (logs `rv1918-{skip-b,wrong-b,noroll-b,skip-i,skip-c,twice-b}.log`)
   - Click skipped, button sweep: `BUTTON HOST-LEAK VIOLATED … (1 of 1 panel(s) still [hidden] …)`, both schemes, rc 1.
   - Wrong node clicked (the strip's Roll button): same failure, rc 1.
   - No roll strip: `no ds-roll Modifiers panel found in the gallery`, both schemes, rc 1.
   - Click skipped, input sweep: `INPUT HOST-LEAK VIOLATED`, rc 1. Checkbox sweep: `CHECKBOX HOST-LEAK VIOLATED`, rc 1.
   - Idempotency: the second call finds `toOpen=0`, the panel stays open, and the sweep is OK with the same 12 records.
3. **Leak into captures or other sweeps:**
   - The helper has 3 call sites, all in sweeps that run after every capture loop (`shoot.mjs` ~6905–6925). Each of those sweeps navigates before calling it.
   - Measured: each later navigation reports `toOpen=1`. The open state lives in the per-load in-memory session store (`entry.ts:2090`), so it does not persist from one sweep to the next.
   - All 592 PNGs are byte-identical to base.
   - The later sweeps' counts are unchanged versus base: prose, table, list, inline, and text scale 1626 / 107256 over 214 loads.
4. **Vacuity:**
   - If the roll section is gone, or the panel selector stops matching, `panels=0` and the run fails (proved).
   - If the header selector stops matching, nothing is clicked, the panel stays `[hidden]`, and the run fails (the skip-click shape, proved).
   - A panel that is shown but has no box also fails (the `boxless` branch).
   - The assertion is specific to roll. A future collapsed disclosure elsewhere would show up in the button boundary listing, which now names its kinds. For inputs and checkboxes it would be caught only by the FU-1 assertion.
5. **Exemption accounting:**
   - At 1918a29, 12 records = 10 focus-visible `disabled` (5 kinds ×2) + 2 hover no-hit-point (initiative stamina ×2).
   - The diff changes no `blocked` reason and no acceptance rule. It only adds the click and the listing.
   - The gallery goes from 20 to 12 records, the modal pass stays at 6, and input and checkbox have no exemption machinery. Nothing got wider.
   - Every tagged button has a box (census `taggedVisible:true` for all 113 keys in both schemes).
6. **Other collapsed disclosures:**
   - Static candidates: `src/` has `open: false` in `rollBar.ts:112` (fixed), `montage/StripView.ts:91` and `montage/GuideView.ts:101` (tier tables and guide text only), `initiative/view.ts:496` (the malice log, an `<li>` list only), and `CompendiumMigrationModal.ts:385` (declared unreachable). The statblock villain band is `open: true` (`statblock/view.ts:504`).
   - Runtime census after the click, both schemes: buttons 113 keys / 262 nodes / 262 with a box; inputs 14 / 23 / 23; checkboxes 3 / 7 / 7. **No swept control sits hidden anywhere in the gallery**, and no key's tagged first instance is hidden while another instance is shown.
   - Lazily *mounted* controls are a separate class: see INFO-2.
7. **Code and comment accuracy:** every claim checks out except LOW-2:
   - `rollBar.ts:112`.
   - The only `[data-open]` rule is the chevron (`styles-source.css:14538`).
   - The panel layout rule is `.dse-rollbar__panel:not([hidden])` (`:15186`).
   - No `aria-expanded`-keyed rule exists.
   - "8 records" is right: the masked disabled records are counted separately below.
   - The title-input blur guard keeps `initiative|dse-init__title-input` mounted through the roll click (census: present, 694×28.06).

## Findings

### LOW-1 — the modal boundary listing cannot say which modal a record comes from
- **Where:** `visual-harness/shoot.mjs:2703-2705` (`exemptionKinds` keyed by `rec.key` alone) and `:3057` (the modal pass tags with `prefix: 'modal:'`, so every key reads `modal:(none)|…`, whatever the scenario).
- **Measured** (`rv1918-modal-where.log`): the single line `modal:(none)|dse-btn.dse-btn--accent|disabled ×6` is MontageAddHeroModal, StaminaEditModal and MinionStaminaPoolModal, ×2 schemes each.
- **Failure scenario:** a disabled accent button added to a 4th modal prints `×8` under the same key, with no modal named. That is the aggregate-only shape SC-501 set out to end, and the owner's FOLD said it applies to the modal pass too.
- **Fix:** `sweepTaggedButtons` already receives `bg` as `dark|<scenario>` for the modal pass. Add the scenario to the kind key, e.g. `const where = bg.includes('|') ? ` @${bg.slice(bg.indexOf('|') + 1)}` : ''; kinds.set(rec.key + where, …)`. That prints 3 lines ×2. Leave the gallery's output unchanged.

### LOW-2 — a stale range in the helper's comment
- **Where:** `shoot.mjs:2622`, "8 button records at `c0e761b`..`c98bd82`".
- **The problem:** the records persisted through `b624eef` and `a993a60`, this commit's base. My base run measured the 20-record boundary there.
- **Fix:** "from `c0e761b` (SC-279) until this fix". Optional cosmetic in the same edit: the new problem strings use ` - ` where the rest of the file uses `—`.

### INFO-1 — correction to the r2 report's input/checkbox claim (matters for the FU-1 design)
- **The claim:** "those sweeps never exempt box-less records, they compared them anyway". This is only half right.
- **Where it breaks:** in the input sweep's focus-visible pass, `focusInputTagged` (`shoot.mjs:3321`) returns `blocked: 'renders no box at all …'`. The record is then pushed (`:3496-3511`) and counted as a comparison. That is a **silent, unprinted exemption**: before the fix, the roll stepper input's focus-visible record was such a record.
- **Checkbox sweep:** it reads no geometry at all.
- **For FU-1:**
  - Assert a box right after `tagInputs` and `tagCheckboxes` (`getClientRects().length > 0`, w and h > 0) and push a problem, never skip.
  - Turn the input focus-visible "no box" branch into a problem rather than an accepted `blocked`.

### INFO-2 — lazily mounted controls are outside the sweep, by construction
These are not collapsed disclosures: they are not in the DOM until a click.
- The ability roll bar in feature, statblock and featureblock cards (`feature/rollController.ts:108-126`, `ensureBar` on the first "Roll <ability>" click).
- The hero sheet's ability bodies (`hero/view.ts:657-672`, mounted on expand).
- Their kit controls exist under those element roots only after interaction, so kinds like `feature|…stepper__btn` are never tagged.
- Out of SC-501's scope. The owner may want a Backlog ticket next to FU-2 (the enabled roll Reset is never mounted).

### INFO-3 — small redundancy
`acc.exemptions` (reason → count) is now derivable from `acc.exemptionKinds`. It is harmless, and there is no need to change it.

### INFO-4 — arithmetic at `c98bd82` vs `1918a29` (owner question)
Recomputed from r1's dumps (`sc501-r1-survey/{ea56712,c98bd82}-dump-run1.jsonl`) and my run.
- **`ea56712`:** focus-visible `disabled` = montage, negotiation, party stepper, **roll stepper (disabled)**, ×2 each = **8**, all with a box (roll stepper 23.8×23.8). Plus 2 hover no-hit-point.
- **`c98bd82` / `a993a60`:** focus-visible `disabled` = the same 4 kinds + roll Reset (disabled) = **10**. Two of those kinds were really **box-less** (0×0): roll stepper (disabled) and roll Reset. `focusTagged` tests `disabled` before it tests client rects, so they printed as plain "disabled".
  - Plus hover zero-sized 6 (roll stepper, roll stepper disabled, Reset), focus-visible no-box 2 (roll stepper), and hover no-hit 2. Total 20.
- **`1918a29`:** focus-visible `disabled` = the same 5 kinds = **10**, now all with boxes. Plus hover no-hit 2. Total 12.
- So "8 old + 2 Reset" holds. The 8 old already included the roll stepper (disabled) ×2, which is why it is listed. What changed for that kind is that it now has a box: before, it was masked as "disabled" while box-less.

## FU-1 measurement (on 1918a29, both schemes)
Records with no box (0×0 or 0 client rects) at comparison time:

| Sweep | dark | light | Detail |
|---|---|---|---|
| INPUT | **0** | **0** | 14 kinds per scheme; 56 element-state comparisons per scheme (rest/hover/disabled/focus-visible × 14), all w,h > 0. Smallest is `counter\|dse-counter__value.dse-stepper__input` 28.00×13.59; `roll\|dse-stepper__input` 61.19×23.80. The other 26 comparisons per scheme are pseudo-element reads (placeholder 14, spinner 12) on the same nodes. |
| CHECKBOX | **0** | **0** | 3 plugin kinds per scheme (`negotiation\|(no class)`, `project\|(no class)`, `roll\|(no class)`), each 13.33×13.33 with 1 rect. The synthetic task-list checkboxes (rest, checked) are 13.00×13.00 with 1 rect. |

The per-key census is in `rv1918-dump.log` (`RVCENSUS input|checkbox`, `RVCMP`, `RVTL`). Under the owner's FU-1 ruling, 0 means: **FOLD the box-presence assertion into r3** (see INFO-1 for where it goes).

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r2rev-rv1918/`)
- Gates: `rv1918-shots.log`, `rv1918-freeze.log`, `rv1918-baseshots-a993a60.log`, `rv1918-jest-shootmjs-readers.log`.
- PNG compare: `rv1918-png-a993a60.sha256`, `rv1918-png-1918a29.sha256`, `rv1918-png-diff.txt`, `rv1918-inrun-lines-diff.txt`.
- Probes: `rv1918-dump.log`, `rv1918-skip-b.log`, `rv1918-wrong-b.log`, `rv1918-noroll-b.log`, `rv1918-skip-i.log`, `rv1918-skip-c.log`, `rv1918-twice-b.log`, `rv1918-modal-where.log`.
- Instrumentation: `rv1918-instrumentation.patch`, `rv1918-patch.py`, `shoot-1918a29.orig.mjs`. Scripts: `rv1918-*.sh`.
