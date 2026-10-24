# SC-501 r1 survey: the 10 new gallery host-leak exemptions

## Executive summary

1. All 10 new records (5 kinds/states × dark+light) are in the `ds-roll` gallery section. They come from **SC-279** (roll strip, `ae8719f`, landed `c0e761b`). No other landing in `ea56712..d152ea4` changed the gallery's button set (kind lists diffed directly, both schemes).
2. Cause: SC-279 moved the strip's steppers and Reset into a **"Modifiers" disclosure that is collapsed by default** (`rollBar.ts:112` `open: false`). Its region is `[hidden]` (display:none), so those buttons have a 0×0 box and no client rects in the swept gallery.
3. Verdicts: **8 records HIDE A BUTTON** (hover zero-sized ×6, focus-visible "no box" ×2). **2 are LEGITIMATE** (focus-visible `disabled` on Reset: Reset is disabled while the strip is at its authored defaults, `rollBar.ts:263`). A user opens the disclosure with one click, so the hidden buttons are reachable in the product.
4. Two of these kinds, the roll steppers (enabled and disabled), **were fully swept at `ea56712`** with a 23.8×23.8 box. SC-279 removed that coverage without saying so. Reset's own rule (`styles-source.css:15240`, `padding-inline-start: 0`) has never been host-compared in hover.
5. Prescribed fix (harness only): in `assertBtnHostLeak`, before `tagButtons`, **open the strip's Modifiers disclosure with a real click** (the same move SC-377 R1F makes for the initiative title input). I prototyped it in a scratch copy and measured: **113 kinds / 678 comparisons, still OK, 12-record boundary** = 10× focus-visible disabled + 2× hover no hit point. No new leak appears.
6. 8 → 10 focus-visible-disabled: the +2 is the new `roll|…dse-rollbar__reset|disabled` kind (dark+light). The 2 old hover no-hit-point records are the **same 2 as at SC-356**: `initiative|dse-btn.dse-init__stamina` ("Edit stamina: Frodo Baggins", 33×20.39), at both commits.
7. +1 kind = −`roll|dse-btn.dse-btn--ghost|aria-pressed:false` (the old Skill +2 toggle, now a native checkbox) +`roll|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` +`roll|dse-collapse__header`.
8. SC-498 (head `b624eef`) changes nothing here: the button kinds are identical and the 20 records are identical. Only the initiative aria-label is now capitalised, "Edit Stamina". The bar it makes focusable is a `div[tabindex][role=group]`, which the sweep does not tag.
9. Adjacent (same cause, outside the 10): the **input** and **checkbox** sweeps tag `roll|dse-stepper__input` and `roll|(no class)` checkbox while they have no box, and neither sweep prints an exemption boundary. The same click should go in `assertInputHostLeak` / `assertCheckboxHostLeak`.

## Method

- sc501 worktree at `c98bd82`. `origin/develop` = `c98bd82` (not moved).
- I added temporary instrumentation, env-gated (`DSE_SC501_DUMP` = per-record JSONL with the DOM path and computed box, plus the full kind list; `DSE_SC501_BTN_ONLY` = run only `assertBtnHostLeak`). Patch: `…/scratchpad/sc501-r1-survey/sc501r1-instrumentation.patch`. It was **reverted** in the sc501 worktree (`git checkout -- visual-harness/shoot.mjs`), and `status --short` is empty.
- I ran the same patch on: `c98bd82` (sc501 worktree); `ea56712` (a scratch `git worktree add`, now removed with `git worktree remove --force <literal path>`); SC-498 head `b624eef` (a `git archive` copy, because that commit is not in the sc501 module's object store); and a `c98bd82` copy with the prototype fix.
- All runs reproduce the published line exactly: `c98bd82` and `b624eef` 113/678/20 records, `ea56712` 112/672/10 records.
- I did not run full `npm run shots`. Only the sweep ran, via the env gate.

## All 20 records at `c98bd82` (identical in dark and light; one row = 2 records)

| # | kind key | element / fixture | node | state | reason | box at rest | status vs `ea56712` |
|---|---|---|---|---|---|---|---|
| 1 | `initiative\|dse-btn.dse-init__stamina` | initiative / default | "Edit stamina: Frodo Baggins" (`80/80`) | hover | no point hit-tests (clipped by the rail) | 33×20.39 | OLD (same as SC-356) |
| 2 | `montage\|dse-btn\|disabled` | montage / default | "Undo" | focus-visible | disabled | 74.06×25.09 | OLD |
| 3 | `negotiation\|dse-btn\|disabled` | negotiation / default | "Complete Argument" | focus-visible | disabled | 170.06×25.09 | OLD |
| 4 | `party\|dse-btn.dse-btn--icon.dse-stepper__btn\|disabled` | party / default | "Decrease Kira's Wealth" | focus-visible | disabled | 23.8×23.8 | OLD |
| 5 | `roll\|dse-btn.dse-btn--icon.dse-stepper__btn\|disabled` | roll / default (`example.yaml`) | "Decrease Banes" | focus-visible | disabled | **0×0** (was 23.8×23.8) | OLD record, now on a hidden node |
| 6 | `roll\|dse-btn.dse-btn--icon.dse-stepper__btn` | roll / default | "Decrease Reason" | hover | renders a zero-sized box | 0×0, 0 rects | **NEW** |
| 7 | `roll\|dse-btn.dse-btn--icon.dse-stepper__btn\|disabled` | roll / default | "Decrease Banes" | hover | renders a zero-sized box | 0×0, 0 rects | **NEW** |
| 8 | `roll\|dse-btn.dse-btn--ghost.dse-rollbar__reset\|disabled` | roll / default | "Reset modifiers" | hover | renders a zero-sized box | 0×0, 0 rects | **NEW** |
| 9 | `roll\|dse-btn.dse-btn--icon.dse-stepper__btn` | roll / default | "Decrease Reason" | focus-visible | renders no box at all (display:none ancestor) | 0×0, 0 rects | **NEW** |
| 10 | `roll\|dse-btn.dse-btn--ghost.dse-rollbar__reset\|disabled` | roll / default | "Reset modifiers" | focus-visible | disabled | 0×0, 0 rects | **NEW** |

Tally: focus-visible disabled = rows 2, 3, 4, 5, 10 = 5 × 2 = **10**. Hover zero-sized = rows 6, 7, 8 = **6**. Hover no-hit = row 1 = **2**. Focus-visible no-box = row 9 = **2**.

DOM path for rows 5–10 (the first `display:none` ancestor in the dump): `div.dse-collapse__region.dse-rollbar__panel[hidden]{display:none, 0×0}`. Inside it: `.dse-rollbar__mods` (`display: contents`), then `.dse-rollbar`, then `[data-dse-element="roll"]`. The header is `roll|dse-collapse__header` "Modifiers · Reason 0, 1 edge", `aria-expanded=false`, 635.94×27.17.

Row 5 caveat: `focusTagged` (`shoot.mjs:2425`) tests `disabled` before `getClientRects()` (`:2426`). A disabled button inside a hidden region therefore reports "disabled", not "no box". That masks rows 5 and 10 as plain disabled records today.

## Attribution

- `git log ea56712..d152ea4 -- src/framework/kit/rollBar.ts src/elements/roll/view.ts visual-harness/entry.ts`: only SC-279 commits (`ae8719f`, `f14533d`, `d732a7a`, `674311d`, `187c83a`).
- `ae8719f` "roll strip — collapsed Modifiers disclosure, captioned controls, Reset to authored defaults" introduced all of the following:
  - the collapsed disclosure (`rollBar.ts:110-118`);
  - Reset with text, its `.dse-rollbar__reset` class and disabled-at-defaults (`rollBar.ts:205-219, 263`);
  - native checkboxes in place of the Skill/Main-action ghost toggles.
- Landed as SC-279 at develop `c0e761b`. That is also where shots went from 580 to 592 (the new roll interaction shots).
- Measured kind diff, `ea56712` → `c98bd82`, identical in both schemes:
  - `roll|dse-btn.dse-btn--ghost|aria-pressed:false` 62.31×25.09 was removed;
  - `roll|…stepper__btn` went from 23.8×23.8 to **0×0**;
  - `roll|…stepper__btn|disabled` went from 23.8×23.8 to **0×0**;
  - `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset|disabled` was added at 0×0;
  - `roll|dse-collapse__header` was added at 635.94×27.17.
  - Net 112 → 113. No other key changed. SC-361, SC-433, SC-465, SC-477 and SC-482 touched no gallery button.

## Verdict per new record

| row | verdict | evidence |
|---|---|---|
| 6 hover, stepper "Decrease Reason" | **HIDES A BUTTON** | 0×0 only because the panel is `[hidden]`. After a real click on the header: 23.8×23.8, 1 rect, hover reachable. Swept in all 3 states at `ea56712`. |
| 7 hover, stepper "Decrease Banes" (disabled) | **HIDES A BUTTON** | Same panel. Disabled buttons still hit-test and take `:hover`; this was swept in hover at `ea56712`. |
| 8 hover, Reset (disabled) | **HIDES A BUTTON** | Same panel. Opened: 128.91×25.09. It carries its own rule, `[data-dse-element] .dse-rollbar__reset { padding-inline-start: 0 }` (`styles-source.css:15240`), and Obsidian's `button` sets padding, so this is exactly what the sweep exists to check. |
| 9 focus-visible, stepper "Decrease Reason" | **HIDES A BUTTON** | The "no box" reason applies only because the disclosure is collapsed. The product reveals the region with one click (`collapsible.ts:77-81` drops `hidden`). |
| 10 focus-visible, Reset (disabled) | **LEGITIMATE** | Genuinely `disabled`: Reset disables itself while the strip equals its authored defaults (`rollBar.ts:263`; fixture seeds `edges: 1`). It stays an exemption after the fix, at 128.91×25.09 with a box. |

Why driving the reveal is sound here, which is the CHROME_REVEAL_CSS dependency rule at `shoot.mjs:2253-2277`:

- The only `[data-open]`-keyed rule is the chevron rotation (`styles-source.css:14538`).
- The panel's layout rule is keyed `.dse-rollbar__panel:not([hidden])` (`:15186`).
- No open/closed-keyed rule reaches a `.dse-btn`.
- A real click puts the strip into a state the product really shows; it is not a superposition.
- The open state lives in the in-memory harness session store (`roll.modsOpen.0`), so each scheme's navigation starts collapsed again.

## Prescribed fix (not implemented)

Where: `visual-harness/shoot.mjs`, in `assertBtnHostLeak`, directly after `await page.addStyleTag({ content: CHROME_REVEAL_CSS });` (`:2566`) and before `tagButtons`:

- Click each `[data-dse-element="roll"] .dse-rollbar__mods > .dse-collapse__header[aria-expanded="false"]` with a real Playwright click. Make it idempotent: click only while `aria-expanded="false"`.
- Then move the mouse to (0, 0).
- Then assert that no `[data-dse-element="roll"] .dse-rollbar__panel[hidden]` remains. If one does, push a problem ("the roll strip's Modifiers disclosure could not be opened — its buttons would be swept with no box"), the same way `titleOpened` is handled at `:4154-4166`.
- Add a comment that cites SC-205 "MOUNT THE CHROME" and SC-501.

Prototype result, measured on a scratch `c98bd82` copy:

- Output: `SC501-PROTO dark/light: opened 1 …; still collapsed: 0`, then `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)`, then the 12-record boundary `10× focus-visible: disabled / 2× hover: no point in its box hit-tests to it`.
- Per-scheme records: rows 1–5 and 10.
- No property differs with the host present, so the fix does not turn the gate red.

Optional, owner's call:

- (a) **Coverage still missing after the fix:** an *enabled* Reset (`roll|…dse-rollbar__reset`, no `|disabled`) never mounts in the gallery. Mounting it means one further real click on "Increase Banes", but that removes the disabled-stepper kind from this single roll section. It needs a second roll mount or a separate navigation, so it is not prescribed.
- (b) Apply the same click in `assertInputHostLeak` (before `tagInputs`, `:4167`) and `assertCheckboxHostLeak` (before `tagCheckboxes`, `:6029`). A probe shows they currently tag `roll|dse-stepper__input` (0 rects) and the `roll|(no class)` checkbox (0 rects).
  - `input host-leak OK (14 kinds × 6 states … = 164 …)` is 4 short of 14×6×2 = 168. That is likely the hidden roll input's hover/focus-visible. I inferred this from the count and did not trace it.
  - Neither sweep prints an exemption boundary.
  - Recommend filing it as a follow-up, or folding it in if the owner judges it in scope.
- (c) Make the sweep loud about this class of gap: in the gallery pass, treat a record whose node sits under `.dse-collapse__region[hidden]` as a problem rather than an exemption (a user-openable disclosure is never "unreachable"). Optionally swap the `focusTagged` order so "no box" wins over "disabled".

Is a permanent per-record listing in the boundary print worth adding? **Yes, recommended.** The aggregate hid which element the 10 came from; it took an instrumented run to see that all 10 were one section. A cheap form: in `btnExemptionBoundary`, print the distinct kind keys under each reason line (one scheme, de-duplicated). That is about 6–10 short lines today, and a new exemption names its kind on sight. This is the owner's decision.

## Proposed dse-verify boundary sentence

To replace "…with a 20-record boundary as of `d152ea4` (10 focus-visible disabled, 6 hover zero-sized, 2 hover no hit point, 2 focus-visible no box; … the 10 new records are unexplained, SC-501 tracks confirming them)".

If the fix lands:

> **113 kinds / 678 comparisons with a 12-record boundary (SC-501, 2026-10-23)**. One row per record pair, both schemes:
> - 10× focus-visible `disabled`: montage Undo, negotiation Complete Argument, party Decrease Wealth, roll Decrease Banes (all disabled at rest in their default fixtures), plus roll "Reset modifiers" (disabled while the strip is at its authored seeds).
> - 2× hover no hit point: initiative `.dse-init__stamina`, clipped by its overflow rail, unchanged since SC-205.
>
> The sweep opens the `ds-roll` strip's collapsed "Modifiers" disclosure with a real click before tagging (SC-279 had made it default-collapsed, which silently dropped the roll steppers and Reset to 0×0 for a 20-record boundary at `c0e761b`–`c98bd82`). Any "zero-sized box" or "no box at all" record in the gallery pass is a red: it means a control the product reveals was not mounted.

If no fix lands (documentation only), which is not recommended because 8 records hide reachable buttons:

> **113 kinds / 678 comparisons with a 20-record boundary**: the 12 above, plus 8 from SC-279's collapsed `ds-roll` Modifiers disclosure (steppers and Reset have no box: 6 hover zero-sized, 2 focus-visible no box). These are *not* legitimate; SC-501 tracks mounting them.

## Evidence artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc501-r1-survey/`:

- `sc501r1-instrumentation.patch`: the temporary dump patch (not committed anywhere).
- `c98bd82-btnonly-run1.log`, `c98bd82-dump-run1.jsonl` (20 records with DOM path and computed style), `c98bd82-dump-run1.keys.jsonl`, `c98bd82-keys-{dark,light}.txt`.
- `ea56712-btnonly-run1.log`, `ea56712-dump-run1.jsonl` (10 records), `ea56712-dump-run1.keys.jsonl`, `ea56712-keys-{dark,light}.txt`.
- `sc498b624eef-btnonly-run1.log`, `sc498b624eef-dump-run1.jsonl`, `sc498b624eef-keys-{dark,light}.txt`; the tree is in `tree-sc498-b624eef/`.
- `c98bd82proto-btnonly-run1.log`, `c98bd82proto-dump-run1.jsonl` (12 records), `c98bd82proto-keys-{dark,light}.txt`; the tree is in `tree-c98bd82-proto/`.
- `c98bd82-rollprobe.log` + `sc501r1-rollprobe.mjs`: roll section buttons collapsed / opened / after Increase Banes.
- `c98bd82-inputprobe.log` + `sc501r1-inputprobe.mjs`; `c98bd82-inputs-checkbox-run1.log`.
- Run scripts: `sc501r1-btnonly-{c98bd82,ea56712,sc498,proto}.sh`, `sc501r1-inputs-c98bd82.sh`.
- The scratch worktree `wt-ea56712/` has been removed.
