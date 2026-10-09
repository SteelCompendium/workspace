# SC-127 round 7 — fix round for the round-6 re-review findings (guard code)

You are the SC-127 implementer (resumed). Same worktree, branch, skills, devbox wrapping,
gate discipline (FOREGROUND only, output redirected to per-run files, `sc127-r7-` prefix,
read the file when the command returns — never wait on a background job) and footguns as
`sc127-brief-r3-impl.md`. Workers never call the tracker. No AI trailers. Commit after
every coherent step.

Read first: the ledger's 2026-09-25 round-6 entry (your scope = exactly those rulings),
then `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc127/sc127-r6-rereview-report.md`
(each finding's section; evidence + the reviewer's `sc127-r6-gate-runner.mjs` under `r6/`).

## 0. Rebase first
`git fetch origin && git rebase origin/develop` (reviewer saw `619c4bd`, SC-340; no file
overlap expected). `npm ci` if `package.json` changed. Record the base sha.

## Findings — quoted verbatim from the reviewer

> **HIGH-A**: the extractor feeding the 18-literal pin check still truncates at a `}`
> inside a comment, and the shipped tree triggers it.
> - Where: `shoot.mjs:1338-1350` (`[^}]*` unchanged) and `styles-source.css:14496`, whose
>   r5 comment quotes `hr { border-color: var(--hr-color) }`.
> - Measured: the extractor sees 1264 of 6313 chars and 23 of 59 declarations; the pin and
>   census still print OK. The r5 report's "no other comment contains one (checked)" is
>   false.
> - Mitigation: all 18 literals sit before the cut, so today's pin verdict is right. A `}`
>   placed before the literals fails loudly (18 DRIFTED, with a misleading message). The
>   census does not use this extractor.
> - Fix: strip comments first or use `iterRules`, add a loud check that the extracted body
>   is complete, add a jest pin, and reword line 14496.

Do all four parts. The jest pin must feed the extractor a block containing a `}` inside a
comment and assert the full declaration count. Can-fail: revert the extractor → red.

> **MEDIUM-A**: the census has two blind spots, and the class is not closed.
> - Gallery scope (`shoot.mjs:1471`): 10 consumed tokens never appear there, including
>   `--hr-color`, `--link-external-color-hover`, `--checkbox-color` and `--list-indent`.
> - Pseudo-elements: `querySelectorAll('input::placeholder')` returns 0 without throwing,
>   so those tokens drop silently and the skip count stays 0; the comment at
>   `shoot.mjs:1484` says they are skipped.
> - Why `--hr-color` was missed: the gallery renders no `<hr>`. It was not a mapping-chain
>   problem, and the census does scan Obsidian's own sheet, so plain-element rules are
>   covered whenever the DOM is present.

Owner's ruling on the fix shape: make the census **DOM-independent**. Consumed-token set =
every `--*` token referenced by `var()` (incl. fallbacks, transitively through the pinned
sheet's own mappings) in ANY rule of the plugin sheet or the pinned Obsidian sheet whose
selector can reach content inside a reading-view note (no `querySelectorAll` gating; a
textual/`iterRules` scan; pseudo-element and state selectors count). For each such token
whose `.theme-dark` and `.theme-light` resolutions differ in the pinned sheet, assert the
dark preview root's `getComputedStyle(root).getPropertyValue(token)` equals the
`.theme-light` resolution. Print the counts (consumed, differing, checked, 0 skipped).
Can-fail, each must print DRIFTED naming the token: drop `--hr-color`; drop
`--link-external-color-hover` alone; drop `--input-placeholder-color`. Keep the reviewer's
two existing can-fails green.

> **LOW-A** `printTwinDeltaAllowedSet.test.ts:131`: the border-colour jest pin is vacuous.
> With the four entries deleted from `PRINT_DELTA_STYLE_PROPS`, jest still passes 17/17.

Make it non-vacuous (assert the four `border*Color` names are in the sampled set as read
from `shoot.mjs`); can-fail by deleting them → red.

> **LOW-B**: in the dark preview, placeholder text and list bullets are `rgb(102,102,102)`
> vs `rgb(171,171,171)` in the light twin and realprint. Cosmetic only. Fix: restate
> `--input-placeholder-color` and `--list-marker-color` as `var(--text-faint)`; this moves
> some twin PNGs, so the rebaseline must be regenerated.

## Then
Full battery at the rebased tip (expected: jest ≥ 4001 + your new tests, report base vs
branch; shots 524 (or develop's new count), 0 FAIL, every in-run OK line incl. the new
census counts; freeze EXACTLY 130 twin FAILED / 0 realprint / 0 missing; parity 0/0/16).
Regenerate `sc127-rebaseline.txt` from two CLEAN sweeps (byte-identical; realprint ==
baseline in both); after shots `sc127-r7-after-<id>-dark-twin.png` (the five ids);
superproject re-bump (rebase the worktree superproject onto `origin/main` first, keep the
CHANGELOG/SKILL.md edits, `git submodule update -- steel-etl v2 steelCompendium.github.io`
so the three stale checkouts match their pins). Report
`sc127-r7-fix-report.md` (≤10-line executive summary: shas, base, battery, freeze, census
counts, can-fail proofs per finding) and end with the return contract.

## Amendment 2026-09-25 (owner ruling after sweep 1 — replaces the MED-A fix shape above)
Sweep 1's DOM-independent census fired on 222 of 278 theme-differing tokens. Do NOT
re-scope the census by consumption. Instead:
1. Write `visual-harness/obsidian-light-island.mjs` (name yours; keep it beside
   `obsidian-app-css.pin.mjs`): reads the pinned sheet, computes every `--*` token whose
   `.theme-dark` and `.theme-light` resolutions differ (resolve mappings through the
   sheet's own `body`/`.theme-*` declarations the way your census already does), and
   emits the `.theme-dark [data-dse-element][data-dse-print="on"]…` host block with those
   tokens set to their `.theme-light` declarations verbatim (formulas kept as formulas),
   plus the plugin-specific lines that are not palette (`color-scheme: light`, caret,
   scrollbar, the (0,4,0) padding). Write it between `/* SC-127 LIGHT ISLAND — GENERATED
   … BEGIN */` / `END */` markers in `styles-source.css`; `npm run` script entry so a pin
   bump is `bump pin → run script → commit`.
2. Guard (b) = the census, reduced to: (a) completeness — every differing token in the
   pinned sheet is restated in the generated block (DRIFTED names the missing ones);
   (b) correctness — each resolves on a dark preview root to the `.theme-light` value.
   Keep "consumed by `<selector>`" only as a diagnostic in the message when available.
   Can-fail: delete one generated line → DRIFTED naming it; hand-edit one value → DRIFTED.
3. A jest test that the generated block in the sheet equals the generator's output for
   the pinned sheet (so a stale block fails in jest too) — skip gracefully if the pinned
   sheet is absent on the machine, printing why.
4. Update the sheet comment, the host-rules listing comment, and `visual-harness/README.md`
   to describe the generated island and the bump procedure. Note the trade-off in one
   sentence: a custom dark theme's own light variant is NOT used — the preview island is
   stock Obsidian light.
Then the rest of the brief unchanged (LOW-A, LOW-B are still yours; battery; two clean
sweeps; rebaseline; afters; superproject re-bump + submodule update; report).
