# SC-356 round 2 implementer report

STATUS: DONE
- dse branch sc356-hostleak-modal-buttons @ b01268c, rebased onto origin/develop 772c3cd (re-fetched right before the battery; still 772c3cd). 4 commits: 3569f23 modal pass + aria-pressed key, 5cc0ebb scenario drivers, 1ae02f1 SC-361 swatch allowlist, b01268c A30 chip CSS + jsdom pin. Working tree clean.
- Superproject: fast-forwarded to origin/main 27ed1bf; doc commit db07e0a (dse-verify bullet, CHANGELOG). DESIGN.md has no option-chip entry, untouched. No pointer bump.
- A30 CSS: `.dse-optchip` height `var(--input-height, 30px)` (follows Obsidian), display flex/centred, fill var(--dse-surface), idle ink var(--dse-fg-muted); pressed ink/border/focus ring untouched. Pinned by 5 new tests in test/dom/theme/hostRegrounding.test.ts.
- Full battery green: tsc/lint clean, jest 5541 (5536 + 5 new), lifecycle 31/31, e2e 89/93 (COND-E02..E06 ok), shots 580, freeze 280/280, parity 0/0/24.
- Modal pass green after rebase (all 9 scenarios still open the right modal; no driver changes needed); allowlist count 100 printed. Injected regression (drop `height`) -> 96 FAIL lines.
- Real Obsidian: desktop chips match r1b A30 exactly. PHONE: under `is-mobile is-phone` Obsidian 1.14.4 gives 44px (not 40px as the ruling text said): `--input-height` resolves to 44px and a plain host `<button>` measures 44px; chips measure 44px, i.e. they follow Obsidian exactly (same as today's chips).

## Gates (verbatim summary lines)
- tsc (incl. `tsc -p e2e`): exit 0, no output. lint: exit 0 (only the pre-existing .eslintignore warning).
- jest: `Test Suites: 1 skipped, 233 passed, 233 of 234 total` / `Tests: 1 skipped, 5541 passed, 5542 total`
- lifecycle: `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed`
- e2e: `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs`
- shots: 580 PNGs, exit 0. `button host-leak OK (112 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 672 comparisons …)` (10 exempt: 8 focus-visible disabled, 2 hover no-hit-point). `modal button host-leak OK (9 modal scenarios over 8 modal classes, 36 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 216 comparisons …)` + `100 property difference(s) ALLOWLISTED … (SC-361: .dse-swatch, 10 properties)` + `not openable in the harness (3 …): CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal` + 6 exempt (6x focus-visible disabled).
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`
- parity: `**0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).**`

## Injected regression (final CSS)
Dropping `height: var(--input-height, 30px);` from the new `:where(.dse-optchip)` rule: modal pass exit 1, 96 lines, e.g.
`dark|ConditionsModal|rest|modal:(none)|dse-cond-icons__choice.dse-optchip|pressed|aria-pressed:true: Obsidian's `button` rules change height — "28.1562px" without the host, "30px" with it`. Restored via git checkout; tree clean.

## Real-Obsidian table (camera on private Xvfb :282 / port 9382, killed by PID; camera edit uncommitted, reverted, saved as patch)
| kind | desktop h | phone-class h | fill dark / light | idle ink dark / light | pressed ink dark / light |
|---|---|---|---|---|---|
| .dse-optchip (duration/effect) | 30px | 44px | rgb(26,30,33) / rgb(246,248,248) | rgba(220,226,230,.62) / rgb(85,89,96) | rgba(220,226,230,.88) / rgb(44,46,48) |
| .dse-cond-icons__choice | 30px | 44px | same | same | same |
| .dse-mt__sheet-resultchip | 30px | 44px | same | same | same |
Phone: `--input-height` = 44px, plain host button 44px, in both modals and both schemes. Phone class applied via `document.body.classList.add('is-mobile','is-phone')` (real app stylesheet resolves it; `emulateMobile` not used because it reloads the app). The resolved value follows the installed Obsidian (1.14.4) — if the ruling's "40px on a phone" is from another version/device, the chips will follow whatever Obsidian gives.

## Drive-by fixes: none.
## Follow-ups: none new. (SC-361 reconciliation pending: remove/narrow HOSTLEAK_KNOWN_LEAKS in shoot.mjs when it lands.)

## Artifacts
Under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc356-hostleak-modal-buttons/evidence-r2/: sc356-{conditions,logaction}-{dark,light}-r1b-vs-final.png (r1b A30 vs final, chip area, native res), sc356-{conditions,logaction}-{dark,light}-phone.png (desktop vs phone class, full dialog), modal-pass-final.log, modal-pass-injected-regression-final-css.log, cam-final.log, sc356-r2-camera-temp-evidence.patch.
Scratch: /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc356-r2-impl-7q4k/ (tsc/lint/jest/lifecycle/e2e/shots/freeze/parity logs).
