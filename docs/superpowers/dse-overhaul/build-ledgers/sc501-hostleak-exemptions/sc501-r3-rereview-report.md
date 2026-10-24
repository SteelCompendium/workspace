# SC-501 r3 scoped re-review: dse 054c9c5 (on efc17de)

## Executive summary
- **Verdict: APPROVE.** Findings: 0 HIGH, 0 MEDIUM, 0 LOW, 3 INFO. All three rulings that were folded into r3 are met: FU-1, LOW-1 and LOW-2.
- **Rebase check:** `range-diff a993a60..1918a29 efc17de..af8caae` prints `1: 1918a29 = 1: af8caae`, so the r2 commit is patch-identical after the rebase.
- **Gates I re-ran on `054c9c5`:**
  - shots: rc 0, 592 PNGs, 0 FAIL, with the expected PIN DRIFT warning. Freeze: `freeze OK (280/280 …)` rc 0.
  - Host-leak lines are verbatim the implementer's: 113/678 with 12 records; modal 10/9/38/228 with 6 records, now 3 lines ×2 (@MinionStaminaPoolModal, @MontageAddHeroModal, @StaminaEditModal); input 164; checkbox 60.
- **Can-fail (scratch copy only).** Each of these exits 1 with the node named, in both schemes:
  - an input hidden with display:none (box check plus the new focus-visible check, host-absent and host-present);
  - an input with zero width but a client rect (the `w<=0` branch);
  - a checkbox hidden with display:none.
- **Vacuity:** with zero tagged inputs or zero tagged checkboxes, the sweep fails "the sweep is blind". It does not pass.
- **Scope:** the delta touches only `visual-harness/shoot.mjs`. Nothing from SC-512 or SC-513 is in it (no `entry.ts`, no click-mounted controls). Lifecycle and e2e were not run because neither imports `shoot.mjs`.

## 1. Rebase
`git range-diff a993a60..1918a29 efc17de..af8caae` → `1:  1918a29 = 1:  af8caae fix(SC-501): …`. It is identical. `efc17de..054c9c5` touches only `visual-harness/shoot.mjs`.

## 2. Delta vs rulings (`af8caae..054c9c5`)
- **FU-1, box assertion.** `assertTaggedHaveBox` (`shoot.mjs:2667-2677`) runs right after tagging in the input sweep (`:4259`) and the checkbox sweep (`:6126`).
  - It fails a tagged node when it has no client rects, or when its width or height is 0 or less. It pushes a named problem and never skips.
  - Proved by the hide-input, zero-input and hide-cb probes (below).
- **FU-1 / INFO-1, input focus-visible.** A blocked value starting with "renders no box" now pushes a problem and `continue`s (`:3519-3525`). It is no longer accepted.
  - Proved: hide-input names the input in the `host-absent|focus-visible` and `host-present|focus-visible` passes, both schemes.
- **LOW-1, modal scenario in the kind key.** `where` comes from the `<bg>|<scenario>` label (`:2723-2726`).
  - The gallery passes plain `dark`/`light` (`:2576`), so its output is unchanged. The modal pass passes `at` (`:3095`), giving 3 lines ×2.
  - These are the only two callers.
- **LOW-2, comment.** It now reads "from `c0e761b` (SC-279) until SC-501" (`:2622`).
- **Drive-by:** the two roll-helper problem strings now use `—`. This is cosmetic.

## 3. Probes (scratch tree `…/sc501-r3rev-rv054c/tree-054c9c5`, env-gated sabotage, patch `rv054c-instrumentation.patch`)
| Probe | Result |
|---|---|
| clean (input + checkbox only) | input 164 OK, checkbox 60 OK, rc 0 |
| `.dse-prj__roll-input{display:none}` | `INPUT HOST-LEAK VIOLATED`, rc 1. Names `project\|dse-prj__roll-input` "has no box at all", plus the focus-visible problem host-absent and host-present, dark and light |
| same input set to `width:0`, padding and border 0 | rc 1, "has no box at all" dark + light (the `w<=0` branch; the node still has a rect) |
| negotiation checkboxes `display:none` | `CHECKBOX HOST-LEAK VIOLATED`, rc 1, `negotiation\|(no class)` dark + light |
| every input removed before tagging | rc 1, "only 0 inputs found in the gallery — the sweep is blind" dark + light |
| every plugin checkbox removed before tagging | rc 1, "0 plugin-authored checkboxes found in the gallery — the sweep is blind" dark + light |

## INFO
- **INFO-1, message wording.** A node with zero width but a client rect is reported as "has no box at all" (`:2675`). That is slightly loose. "has no box (0×0 or no client rects)" would be exact. It is cosmetic and needs no action.
- **INFO-2, other silent focus-visible reasons.** `disabled` and `visibility: …` (`focusInputTagged`, `:3342-3344`) are still accepted silently in the input focus-visible pass. That is outside the ruling, which named only the box-less branch.
  - A disabled input that also has no box is still caught at tagging time by `assertTaggedHaveBox`.
  - No tagged gallery input is disabled or invisible today.
  - Mention it only if the owner wants the input pass to print a boundary like the button pass does.
- **INFO-3, scope of the box check.** The check runs once, on the bare page at tagging time. It is not repeated with the host sheet on.
  - For inputs, `w`/`h` are compared host vs bare, so a box the host sheet removes would still show up as a difference.
  - For checkboxes, `CHECKBOX_CONTROL_PROPS` carries no geometry.
  - This is not a regression, and nothing needs doing in SC-501.

## Worktree
`git -C /home/scott/code/steelCompendium/worktrees/sc501-hostleak-exemptions/draw-steel-elements status --porcelain` is empty before and after, and HEAD is `054c9c5227c19c746be6d1d3805f78a678e5b2fc`. The superproject's ` M draw-steel-elements` was there before I started and is unchanged.

## Evidence (`/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r3rev-rv054c/`)
- Gates: `rv054c-shots.log`, `rv054c-freeze.log`
- Probes: `rv054c-clean-ic.log`, `rv054c-hide-input.log`, `rv054c-zero-input.log`, `rv054c-hide-cb.log`, `rv054c-no-inputs.log`, `rv054c-no-cbs.log`
- Instrumentation: `rv054c-instrumentation.patch`, `rv054c-patch.py`, `shoot-054c9c5.orig.mjs`. Scripts: `rv054c-*.sh`
