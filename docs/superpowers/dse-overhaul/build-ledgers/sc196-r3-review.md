# SC-196 round-3 review — independent verification of dse `068a2a6` / super `95c88a7`

## Executive summary

**Verdict: FIX-ROUND** — 2 HIGH, 2 MEDIUM, 2 LOW. Rebase integrity and all six gates pass; the tooltip condition does not.
Decisive fact (decompiled from the installed Obsidian 1.13/1.14 asars): `setTooltip` only writes `aria-label`, and the hover
renderer reads `aria-label` at hover time — tooltip text and accessible name are one attribute and cannot differ.
HIGH-1 (surface 3): `iconButton.setTooltip` restores the old `aria-label` right after, so a selected cell still hovers as
"Select Goblin #1" — "Selected" never renders; Scott's condition unmet. HIGH-2: that kit method is a no-op for every kit button.
MEDIUM-1 (surface 1): the run-together label is real — hover (and any AT) gets "Not rolled. ≤113 + M damage".
MEDIUM-2: those roll rows are roleless divs, so the new aria-label reaches no screen reader. Surface 2 (`+N` badge) passes.
Gates (mine == the r3 report's): tsc 0 · lint 0 · jest 3870/1 skip/202-of-203 suites · shots 524 ok/0 FAIL (host-copy pin OK,
host-leak OK 113×3×2=678) · freeze 260/260 exit 0 · parity 0/0/16 exit 0. Tooltip tests are can-fail in 5 of 9.
Rebase: light block 45 decls 0 diffs vs `a74fa87`, identical 148-add/8-del CSS delta pre/post; dark 0/132, print 0/130, realprint 0/130 PNGs changed vs develop, light 50/132 (expected).

---

## How the decisive fact was established (execute, don't read)

Obsidian's public `setTooltip` and its hover renderer, decompiled from the two installed builds:

- `/opt/Obsidian/resources/obsidian.asar` → `app.js`: `function tD(e,t,n){e.setAttribute("aria-label",t),eD(e,n),UT===e&&QT(e,t,n)}`
- `~/.config/obsidian/obsidian-1.14.1.asar` → `app.js`: export map `setTooltip:()=>GM`, and
  `function GM(e,t,n){e.setAttribute("aria-label",t),_M(e,n),OM===e&&jM(e,t,n)}`
- hover renderer (both builds): `var t=e.getAttribute("aria-label")||""; …` after
  `n.matchParent("[aria-label]")`.

So **`setTooltip` has no storage of its own: the tooltip text is read off `aria-label` at hover time.**
Tooltip text and accessible name are the same attribute and cannot differ. The repo already knows half of
this (`test/mocks/obsidian-core.ts:1251-1261`, `iconButton.ts:103-110`), but round 3's design assumes the
other half (that a later `aria-label` write leaves the tooltip alone). It does not.

---

## Findings

### HIGH-1 — Surface 3: the selected cell's hover tooltip still says "Select Goblin #1"; "Selected" never renders
`src/framework/kit/iconButton.ts:129-133` (`setTooltip` handle) + `src/framework/kit/iconButton.ts:109-110`
(mount order) + `src/elements/initiative/view.ts:1321,1325,1331`.

`iconButton.setTooltip(text)` calls `tooltip(el, text)` — which writes `aria-label = text` — and then
immediately restores the previous `aria-label`. Because the hover renderer reads `aria-label`, the restore
erases the tooltip it just set. Same at mount: `opts.tooltip` is written first and `aria-label = opts.label`
last (`iconButton.ts:109-110`).

Failure scenario: a sighted, colourblind user hovers the selected creature cell. Obsidian shows
"Select Goblin #1" — identical to every unselected cell. The only cell-level carrier of "this one is
selected" remains the `--dse-select` ring (plus `aria-pressed`, AT-only). The lone exception is cosmetic:
if the tooltip is *already open* when the user clicks (`UT===e` branch of `tD`), the text flashes to
"Selected" and reverts on the next hover.

Evidence: the implementer's own DOM dump shows the end state — `[EVIDENCE surface3] AFTER aria-pressed=true
aria-label="Select Goblin #1"` (`sc196-r3-dom-evidence.log`) — and the new test *asserts* that value
(`test/dom/elements/initiative.test.ts:693,712`, `expect(cells[1].getAttribute('aria-label')).toBe('Select Orc #2')`).
The suite is green because it asserts `setTooltip` was *called*, never the attribute state that production
actually renders. So Scott's condition ("so long as they have on-hover tooltips") is **not met** for surface 3.

Prescribed fix (a judgment call belongs to the owner, because Obsidian forbids the split the code attempts):
- Preferred — carry the state in the accessible name, which is also the tooltip:
  `handle.setLabel(\`Selected — ${creature.name} #${instance.id}\`)` on the pressed cell and
  `Select ${creature.name} #${instance.id}` on the rest (and the same ternary for the mount-time `label`),
  dropping the `setTooltip` calls at `view.ts:1325,1331` and the `tooltip:` option at `view.ts:1321`.
  Deviates from APG's "don't change a toggle's name with its state" — but `aria-pressed` still carries the
  state to AT, and the ruling is the governing requirement.
- Then either delete `IconButtonHandle.setTooltip` (HIGH-2 below) or redefine it as "sets the tooltip AND the
  accessible name", with a test that asserts the post-call `aria-label`.

### HIGH-2 — `IconButtonHandle.setTooltip` cannot do what it documents; it is a no-op for every button the kit builds
`src/framework/kit/iconButton.ts:53-60` (doc comment) and `:129-133` (body).

`label` is required on every `iconButton`, so `currentLabel` is never null and the restore always fires:
the method changes no observable state at all. Any future caller gets a silently dead API, and the new test
(`test/dom/kit/iconButton.test.ts:195-201`) locks the dead behaviour in as correct.

Prescribed fix: remove the method, or implement it as `buttonEl.setAttribute('aria-label', text)` with the
doc rewritten to say tooltip == accessible name in Obsidian (cite `setTooltip`'s implementation).

### MEDIUM-1 — Surface 1: the run-together string is real, not a dump artifact
`src/framework/kit/powerRollPanel.ts:260` — `rowEl.setAttribute('aria-label', \`${stateText}. ${rowEl.textContent ?? ''}\`.trim())`.

The row is a badge span (`dse-pr__badge-text`, e.g. `≤11`) followed by the outcome span (`dse-pr__text`,
e.g. `3 + M damage`) with no separator node (`powerRollPanel.ts:150-155`, `:92-97`), so `textContent`
concatenates them. Produced strings (verbatim from the r3 evidence dump, and reproduced by the committed
test at `test/dom/kit/powerRollPanel.test.ts:507-512`):

```
Not rolled. ≤113 + M damage              (low:  "≤11" + "3 + M damage")
Rolled result — 14 (12-16). 12-166 + M damage   (mid: "12-16" + "6 + M damage")
Not rolled. 17+9 + M damage              (high: "17+" + "9 + M damage")
Not rolled. critextra main action        (crit: "crit" + "extra main action")
```

Failure scenario: the user hovers a tier row — Obsidian renders that whole `aria-label`, so the tooltip
reads "Not rolled. ≤113 + M damage"; a screen reader on the selectable variant would say "less than or
equal to one hundred thirteen". The state word is present (Scott's condition is technically met for this
surface), but the numbers are corrupted. Graded MEDIUM rather than HIGH only because the state word does
reach the hover text; the owner's probe said HIGH if real — it is real, so treat the grade as the owner's call.

Prescribed fix (either):
- Drop the row body from the label — `rowEl.setAttribute('aria-label', stateText)` — the outcome text is
  visible on the row and, on the non-selectable rows both call sites use, the label is not an accessible
  name anyway (MEDIUM-2); or
- Build the string from the parts with separators:
  `\`${stateText}. ${TIER_BADGES[tier].range}: ${rowEl.querySelector('.dse-pr__text')?.textContent ?? ''}\``.

### MEDIUM-2 — the aria-label added to the roll rows reaches no screen reader at either real call site
`src/framework/kit/powerRollPanel.ts:246-260` vs `src/elements/feature/renderFeature.ts:412-416` and
`src/elements/roll/view.ts:47-51`.

Both `setRollResult` callers mount the panel **without** `selectable`, so the rows are roleless
`<div class="dse-pr__row">` (`powerRollPanel.ts:140-142`). `aria-label` on a generic-role element is
ignored by AT (ARIA 1.2 name-prohibited role), so the claim in `powerRollPanel.ts:248-252` and in the r3
report ("the state word reaches screen readers … as its accessible name") is false in production. What the
attribute does deliver is the Obsidian hover tooltip — which is what the ruling asked for.

Prescribed fix: no new mechanism needed — correct the comment and the ticket claim; if AT exposure is
wanted, give the row a naming-permitted role (e.g. `role="group"`) or append a visually-hidden span.

### LOW-1 — 4 of the 9 new tests do not guard the tooltip (mutation-green)
Mutation run (`setTooltip` neutralised via a scratch jest config outside the repo; no repo file touched):
9 failed / 173 passed / 182 total across the four suites. Failing = can-fail:
`iconButton › setTooltip updates the hover text in place`; `staminaBarPanel › temp > 0 …`;
`staminaBarPanel › updateStaminaBar clears the tooltip in place`; `powerRollPanel › active row: on-hover
tooltip + aria-label …`; `initiative › instance-cell select: on-hover tooltip toggles Select/Selected`
(plus 3 pre-existing tests, proving the mutation bit).
Still green under mutation: `powerRollPanel › active row without a total`, `powerRollPanel › dimmed rows
are tooltipped/labelled "Not rolled"` (name says "tooltipped"; it only asserts `aria-label`),
`powerRollPanel › clearing the result (null) …`, `staminaBarPanel › temp == 0 …` (the last two are
absence assertions, acceptable).
Prescribed fix: in `powerRollPanel.test.ts:507-512`, add the `setTooltip` spy assertion for the dimmed rows,
or rename the test to say it guards the label only.

### LOW-2 — the tooltip tests assert the call, not the rendered result
`test/dom/kit/iconButton.test.ts:195-201`, `test/dom/elements/initiative.test.ts:693-713`.
Asserting `expect(spy).toHaveBeenCalledWith(el, 'Selected', undefined)` passes even when a later write
erases the tooltip — which is exactly how HIGH-1 shipped green. Prescribed fix: assert the observable
end state (`el.getAttribute('aria-label')` after the whole repaint), since that attribute *is* the
production tooltip text.

---

## Verification detail

### 1. Rebase integrity — PASS
- `git log --oneline origin/develop..HEAD` = `068a2a6`, `fdc5d85`, `9f575a2`; `git rev-parse HEAD~3` =
  `e12c6bd` = `origin/develop`. Linear, nothing else on top.
- Light-scheme state block (`.theme-light :is([data-dse-element], .dse-modal)[data-dse-theme="steel"]`)
  `a74fa87` vs HEAD: 45 declarations both, **0 diffs, identical order**. Values (the SC-196 state column):
  `--dse-stamina-healthy #147c40`, `--dse-stamina-winded #886106`, `--dse-stamina-dying #bb2d1f`,
  `--dse-stamina-temp #562ec5`, `--dse-tier-crit #66450a`, `--dse-turn-done #147c40`, `--dse-malice #c83426`,
  `--dse-vp #66450a`, `--dse-warn #a34810`, `--dse-danger #bb2d1f`, `--dse-select #bd392c`;
  tiers `#c0392b / #b9770e / #1e8449`, `--dse-stamina-track #eaeeef`, act spines
  `#c0392b / #2874a6 / #1e8449 / #b9770e / #5a6368 / #7d3c98`, surface/ink/accent/metal block unchanged.
- Whole-file delta identical pre- and post-rebase: `c09cf6f..a74fa87` and `e12c6bd..fdc5d85` are both
  148 insertions / 8 deletions on `styles-source.css`, and the **added-line sets are byte-identical**
  (`diff` clean). `lightContrast.test.ts` md5 identical to `a74fa87`'s; the `theme-steel.test.ts` delta
  md5-identical pre/post.
- No develop change dropped: the only 8 removed lines in `e12c6bd..HEAD -- styles-source.css` are the two
  `--dse-tier-crit` / `--dse-vp` dark-block comment lines SC-196 rewrites and 6 lines of the two comment
  paragraphs it corrects — no rule, no selector, no token. Marker counts identical develop vs HEAD:
  SC-202 42/42, SC-205 3/3, SC-170 7/7.

### 2. Tooltip condition — see findings
- Surface 1 (roll rows): tooltip exists; wording informative; **string corrupted** (MEDIUM-1), no AT
  exposure at either call site (MEDIUM-2). Can-fail: yes (active-row test).
- Surface 2 (`+N` temp badge, `StaminaBarPanel.ts:270-277`): **PASS.** `setTooltip(tempEl, "Temporary
  Stamina: 4")` is the last write to that element, so the hover text and the attribute agree; wording is
  informative to a colourblind reader; cleared at `temp == 0`. `setTooltip` is imported straight from
  `obsidian` rather than the kit `tooltip()` wrapper, but that import is pre-existing in this file
  (`StaminaBarPanel.ts:14`) — no new convention break. Can-fail: yes (2 of 3 tests).
- Surface 3 (selection ring): **FAIL** (HIGH-1). Can-fail: yes, but the test pins the wrong assertion (LOW-2).

### 3. Gates — re-run by me, foreground, one log each
| Gate | My result | r3 report | Match |
|---|---|---|---|
| tsc | exit 0, clean | clean | yes |
| lint | exit 0, clean (only the pre-existing `.eslintignore` deprecation warning) | clean | yes |
| jest | 3870 passed / 1 skipped / 3871 total, 202 of 203 suites, 3 snapshots, exit 0 | same | yes |
| shots | exit 0, **524 `ok` lines**, 524 PNGs, 0 FAIL (the 6 "fail" greps are the `montage-failed` fixture + prose); `host-copy pin OK (… verbatim Obsidian 1.14.1 …)`; `button host-leak OK (113 kinds × 3 states × dark/light = 678)` | 524 / 0 FAIL, same two lines | yes |
| freeze | `freeze OK (260/260 frozen print PNGs byte-identical …)`, exit 0, 0 mismatches | same | yes |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 16 declared deferral(s)`, exit 0 | same | yes |
Load average during jest 3.1–10.7 (no load-sensitive timeouts). `rm -f main.js styles.css` before jest.
Non-failure noise to ignore: `OBSIDIAN APP.CSS PIN DRIFT — installed 1.14.1 vs pinned 1.13.7` (documented).

### 4. Dark + print untouched — PASS
Hashed all 524 PNGs from my shots run and compared per class against the same-day develop reference
`.superpowers/sdd/sc202-visual-harness-obsidian/sc202-r6crerev2-allshots-run1.sha256` (SC-202 landed at
develop `e12c6bd`; its print/realprint hashes also match the current freeze baseline, which anchors it):
- `--steel-dark`: 132 shots, **0 changed**
- `--steel-print`: 130 shots, **0 changed**; `--steel-realprint`: 130 shots, **0 changed**
- `--steel-light`: 132 shots, 50 changed (the approved palette, expected)

## Working tree
`git status --porcelain` before and after, dse clone: empty both times. Superproject worktree: the same
5 pre-existing ` M` submodule entries (`data-gen`, `data-sdk-npm`, `steel-etl`, `steelCompendium.github.io`,
`v2`) before and after — unchanged by me. No source file edited; the mutation harness lives entirely in the
session scratchpad. dse HEAD `068a2a6`, super HEAD `95c88a7` at exit.

## Evidence paths
- `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc196-light-contrast/sc196-r3-review-gate1-tsc.log` (+ `.code`)
- `…/sc196-r3-review-gate2-lint.log` (+ `.code`)
- `…/sc196-r3-review-gate3-jest.log` (+ `.code`)
- `…/sc196-r3-review-gate4-shots.log` (+ `.code`)
- `…/sc196-r3-review-gate5-freeze.log`
- `…/sc196-r3-review-gate6-parity.log` (+ `.code`)
- `…/sc196-r3-review-allshots.sha256` (my 524-shot manifest, used for the dark/print comparison)
- `…/sc196-r3-review-canfail-mutated.log` (+ `.code`) — the setTooltip-removed mutation run
- `…/sc196-r3-review-canfail-baseline-check.log` — first mutation attempt (module-resolution error, superseded)
- Scratchpad (not repo): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/aa65ef48-5b2f-47b4-b280-f736e1cbbfd6/scratchpad/{jest.mutated.config.ts,obsidian-notooltip.ts,extract_light.py,app.js,app-1141.js}`
