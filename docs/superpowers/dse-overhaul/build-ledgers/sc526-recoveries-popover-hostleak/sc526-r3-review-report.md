# SC-526 r3 independent review report

## Executive summary
1. VERDICT: LAND-READY at dse `d40197c4` on `248e202b`, superproject `643185bb` on `1ee7c9af`. 0 BLOCKER, 0 HIGH, 0 MEDIUM, 2 LOW (a stale comment and one CHANGELOG word; both optional), 5 INFO.
2. Both bases moved during the review: dse `origin/develop` is now `7bd8040b` (SC-520), superproject `origin/main` is now `bc75ebdd`. Both patches apply cleanly onto the new heads (checked with `git apply --cached --check` against a temporary index; no tree touched). The owner must rebase both and re-gate against the new CURRENT block (jest 6474+9 = 6483 expected, lifecycle 52/52 with part 5 = `G-S59 G-S49`).
3. CSS is option A: `height: auto`. The diff has no `--input-height` and no 30px value (the one "30px" is in a comment). Block G is (0,2,0) inside `:where()`. Section B and the kit ring list only gain entries.
4. Real host copy (`dist/obsidian-app.css`, 3672 rules), Steel, dark + light: every matching app.css rule was blanked one at a time with app.css on. − / + / Catch breath show **0 property changes** in rest, hover and focus-visible, and the disabled Catch breath shows 0 in rest and hover. At develop CSS the same probe shows 10–17 changes per record, so it can fail.
5. No cascade regression: 265 gallery buttons, every computed property plus the box, dev CSS vs head CSS, app.css on and off, dark/light, rest + focus-visible (221 focusable). **0 non-popover buttons differ.** Only the 3 popover buttons change.
6. Shots, my own runs (private `DSE_CAMERA_TMP`): develop `248e202b` 161/966, rc 0. Head `d40197c4` `button host-leak OK (163 … 978 …)`, rc 0, 0 FAIL, the same 34-record boundary with no popover kind in it. 592/592 PNGs sha256-identical between head and develop, and develop is identical to r2's develop run. Freeze `280/280`.
7. jest 6479 passed / 1 skipped / 256 of 257 (rc 0). tsc and lint clean. The diff touches no `src/`, so lifecycle and e2e were not re-run (as briefed).
8. My own anti-vacuity probe was different from r2's (I removed only the two popover focus-ring selectors). Result: rc 1 `BUTTON HOST-LEAK VIOLATED`, exactly 8 problems, all `focus-visible|hero|dse-stamina-rec__pop-btn/-cb` outlineStyle/outlineWidth, dark + light. So the focus-visible state is really reached while the popover is open. Reverted; tree clean.

## Scope reviewed
- dse `git diff origin/develop...HEAD` (`248e202b...d40197c4`): `styles-source.css` +48, `test/dom/theme/hostRegrounding.test.ts` +60, `test/dom/visual-harness/fixtures.test.ts` +80, `visual-harness/shoot.mjs` +57/-13. Commits 179389d5, d40197c4. No AI trailers, no tags, nothing pushed.
- Superproject `643185bb` (CHANGELOG only), in the worktree superproject. The main checkout's CHANGELOG has 0 "SC-526" hits.

## Findings

### LOW-1 — stale "Stamina modal" claim in the focus-ring comment
`styles-source.css:15596-15597` (HEAD): "the Recoveries popover's own buttons (`-`, `+`, Catch breath; the tracker hero's popover and the Stamina modal's)". r1 measured that StaminaEditModal has no RecoveriesStrip (0 strips; the ledger ruling is "the modal has no popover"). The second site is the `ds-stamina-bar` element. Failure scenario: a later maintainer goes looking for a modal popover that does not exist, or adds a pointless modal-pass mount. Fix: replace "and the Stamina modal's" with "and the ds-stamina-bar element's". Optional for this landing (comment only; no gate moves).

### LOW-2 — CHANGELOG: "font" should be "font size"
Worktree `CHANGELOG.md:14-15`: "...with Obsidian's drop shadow, text colour and font. They now keep ... in the card's font". In real Obsidian the buttons already used the card's font family (r1 §3.1: TODAY = card font, because the host rule is `font-family: inherit`). What Obsidian imposed was its 13px size (now 13.6px `--dse-fs-control`). The UA Arial fallback only happens without a host. Failure scenario: a reader expects a visible typeface change that is not there. Fix (optional): "text colour and font size" / "in the plugin's control text size". The rest of the bullet is accurate: the setting label is the real `Edit Recoveries with a popover` (`src/prefs/catalog.ts:604`); 18px / 26px on desktop and phone matches my phone probe (18.31 / 25.78); the ring is teal-cyan (dark: `rgb(77,184,199)` 2px solid) in place of the grey 3px box-shadow halo.

### INFO-1 — rebase needed (both repos moved during the review)
dse `origin/develop` `248e202b` → `7bd8040b` (SC-520: +54 lines of `styles-source.css` in the Element chrome section at ~:16986, callout-scoped, no button family selectors; lifecycle G-S49). The branch patch applies cleanly onto `7bd8040b`. Superproject `origin/main` → `bc75ebdd` (SC-520 CHANGELOG bullet further down Unreleased). `643185bb` applies cleanly. New CURRENT (origin/main SKILL.md:1290): jest 6474/1/256 of 257, lifecycle 52/52 (21+16+9+4+2), shots 161/966, so the post-rebase expectation is jest 6483, shots 163/978, everything else unchanged.

### INFO-2 — disabled Catch breath is not a standing sweep kind
The sweep tags `hero|dse-stamina-rec__pop-cb` (enabled). The `|disabled` kind is never mounted, because the gallery hero's Catch breath is enabled and only one popover can be open (an outside click closes it). My probe shows the disabled state is host-invariant against the real app.css: rest 0 and hover 0 changes. The plugin's `[disabled]` rule (0,2,0) beats the host's `button[disabled]` (0,1,1) on opacity and cursor. jest pins `:not([disabled])` on the ink rule. Possible follow-up (owner's call, not required by the ticket): open a SECOND popover on SC-527's Respite hero section by keyboard (focus its pips, press ArrowRight; the keyboard path calls `openPopover` without a click, so the first popover stays open). That would add `hero|dse-stamina-rec__pop-cb|disabled`.

### INFO-3 — the non-Steel "unscoped base" still takes the host fill
With the root's `data-dse-theme` set to a non-steel id, head still takes these from Obsidian: background (`--interactive-normal`), `border: 0`, 5px radius, and (Catch breath only) the host padding of 4px/12px. The base never authored those. This existed before the change, and the theme is unreachable in the product: Steel is the only shipped theme (SC-144, `src/framework/seams/theme.ts:15`). Only a hand-made snippet theme could reach it. No sweep covers non-Steel. No action.

### INFO-4 — phone host tokens (already ruled DROP)
Under `is-mobile is-phone` on head: heights are 18.31 (− / +) and 25.78 (Catch breath), and the 44px `--input-height` is not followed (as intended for A). Two host values still reach the buttons: `cursor: pointer` on all three, and `font-weight: 500` on Catch breath. These are the known desktop-only host model gaps that the owner already ruled DROP. Nothing new.

### INFO-5 — block G comment tense
`styles-source.css:17558-17559`: "opened only with the `staminaRecoveryPopover` setting on, so the gallery sweep never mounted them". It reads as current but is now history, because the sweep mounts them. Fix if touching LOW-1: "so until SC-526 the gallery sweep never mounted them".

## Checks, with evidence

### 1. CSS = option A, and it re-grounds every host declaration that reaches the two classes
- Diff: `height: auto; display: inline-block; align-items/justify-content: normal; white-space: nowrap; font-family: inherit; font-size: var(--dse-fs-control)`; `color: var(--dse-fg)` on `-pop-btn` and `-pop-cb:not([disabled])`. Both classes are added to section B `box-shadow: none` and to the shared kit `:focus-visible` outline list. No `--input-height` / 30px.
- Specificity: anchor `:is([data-dse-element], .dse-modal):not([data-dse-print="on"])` = (0,2,0), and the subjects are in `:where()`. The Steel skin (`:12867`, `:12880`, (0,3,0)) still wins. The SC-428 disabled rule (`:1798`, (0,2,0), earlier) is protected by the `:not([disabled])`. The only other authored rule is the legacy sizing at `:1778` (0,1,0), and block G restates none of its properties (pinned by the jest "restates nothing" test).
- Real app.css rules matched (head, Steel): rest = `:root *`, `*`, `button`, `button:not(.clickable-icon)`, `*`; hover adds `button:hover`; focus-visible adds `button:focus-visible`; disabled adds `button[disabled], button[aria-disabled="true"], button[disabled="true"]`. The declared union is in `probe-out/p1p2.json`.
- Blank-each-matched-rule probe, Steel, dark + light, app.css on: 22 records at develop CSS, every one leaking (10–17 properties each: height 17.98→30, plate box-shadow, ink, 13px font, flex, etc.); 22 records at head CSS, 0 properties changed (log `probe-out/probe.log`). Compared properties: width/height box plus 38 computed properties, a superset of the sweep's BTN_PROPS (adds outline-color, font-variant-caps, text-transform, vertical-align, margins).

### 2. Sweep mount
- `shoot.mjs:2759` prefs `authoringControls:true,staminaRecoveryPopover:true`, button sweep only. The pref appears once in the file (jest pins it). Call sites: `:2783` passes `{ recoveriesPopover: true }`; input `:4961` and checkbox `:6830` pass nothing.
- Last click: `openRecoveriesPopoverForSweep` is the final statement before `page.mouse.move(0, 0)` in `mountClickRevealedForSweep` (`:3127`). After it the caller only runs `tagButtons`, the assertions and `sweepTaggedButtons`, which moves the mouse and presses keys but never clicks. The popover's keydown handler reacts only to Escape and value keys (`RecoveriesStrip.ts:263ff`), so the sweep's Tab does not close it.
- Selector `.dse-harness-section:not([data-dse-harness-extra]) [data-dse-element="hero"] .dse-stamina-rec__pips` targets the gallery's own hero, not SC-527's Respite hero (an extra section). That is why Catch breath is enabled there.
- Named FAILs exist for: pips count ≠ 1, no popover with 3 visible buttons (via `sc513WaitFor`), and each missing `SC526_EXPECT` key. r2 showed these with its click-removed run. I re-proved the state coverage independently with my focus-ring probe: 8 named problems, all on popover kinds (`av-ring.log:635-643`).
- Input/checkbox claim: the popover DOM is span / button / span / button / div / button only (`RecoveriesStrip.ts:200-215`), with no input or checkbox. The claim holds.
- Stale text: `grep "open gap|NOT mounted|will add"` in head `shoot.mjs` finds nothing. The SC-513 D paragraph (`:2967-2971`) and the SC-527 note (`:3195`) are rewritten to the present tense.

### 3. Shots / freeze / jest
| run | tree | rc | button line | boundary | PNGs | freeze |
|---|---|---|---|---|---|---|
| base-dev | `248e202b` (detached, restored) | 0 | 161 / 966 | 34 | 592; = r2 `base2-592.sha256` | 280/280 |
| head1 | `d40197c4` | 0 | 163 / 978 | 34, no popover kind | 592; = base-dev | 280/280 |
| av-ring | head minus 2 ring selectors | 1 | VIOLATED, 8 problems | n/a | 592; = head1 | 280/280 |
Log diff base-dev vs head1: only the `harness.css` size line, the esbuild time and the button host-leak line. modal 228, input 15/176, checkbox 7/116 and prose 106 [212] are unchanged. jest rc 0: 6479 / 1 / 256 of 257 (53 s). tsc rc 0, lint rc 0.

### 4. CHANGELOG
The bullet is in `/home/scott/code/steelCompendium/worktrees/sc526-recoveries-popover-hostleak/CHANGELOG.md` under `## Unreleased`. It is user-facing, accurate except LOW-2, and commit `643185bb` has no attribution trailer.

## Tree state
Before and after: dse `git status --porcelain` is empty, branch `sc526-recoveries-popover-hostleak` at `d40197c4`. The superproject worktree shows ` M draw-steel-elements` (the unstaged pointer r2 left, unchanged). After the av-ring probe, `dist/harness.css` was rebuilt and is byte-identical to the head build. The shots dir holds head-identical PNGs. The main checkout was not touched.

## Artifacts (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc526-r3-rev-t3wq/`)
- `jest.log`/`.rc`, `tsc.log`/`.rc`, `lint.log`/`.rc`
- `base-dev.log`/`.rc`/`.sha256`/`.freeze.log`, `head1.log`/`.rc`/`.sha256`/`.freeze.log`, `av-ring.log`/`.rc`/`.sha256`/`.freeze.log`, `av-ring.patch`
- `probe.mjs`, `probe-out/probe.log`, `probe-out/p1p2.json` (P1/P2/P3), `probe-dryrun.log` (control: dev CSS on both sides), `probe-phone.mjs`, `probe-phone-out/probe.log`
- `sc526-branch.patch`, `sc526-changelog.patch` (rebase-applicability checks), `gate.sh`, `bgshots.sh`, `probe-site/` (harness copy, dev + head CSS)
