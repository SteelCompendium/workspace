# SC-497 r1 implementer report

## Executive summary
- Verdict: DONE. `npm run shots` is green again (rc 0, 592 PNGs, 0 FAIL) with `host-copy pin OK ... verbatim Obsidian 1.15.0`.
- Commit (plugin, branch `sc497-obsidian-115-pin`, base dse `develop` d152ea4, unmoved after fetch): `6576fd4`. One commit. Not pushed, no tag, superproject pointer untouched.
- Freeze `freeze OK (280/280 ...)`, no rebaseline. All 6 rule differences are minifier spelling (class a); 28/28 token pairs identical.
- Host-leak: `button host-leak OK (113 kinds, 678 comparisons)`, 20-record exemption boundary; modal: 10 scenarios / 9 classes / 38 kinds / 228 comparisons, 6-record boundary, no ALLOWLISTED line. Text scale: 1626 comparisons; once: 107256 comparisons over 214 loads.
- NOTE for dse-verify CURRENT: the gallery numbers are 113/678 and a 20-record boundary, not 112/672 and 10. I proved this is pre-existing drift, not 1.15.0: base d152ea4 run against a 1.14.4-only HOME prints the identical 113/678/20-record lines.
- Other gates: tsc/lint clean; jest 5769 passed / 1 skipped / 238 of 239 suites (no test needed changing); lifecycle 32/32; e2e 104/104, coverage 69/69; parity 0 GAP / 0 undeclared / 24 DECLARED.
- app.css pin WARNING (not acted on, per ruling): printed as `OBSIDIAN APP.CSS PIN DRIFT` (line below).

## Step 2 classification (before editing)
1.14.0 asar no longer exists on the machine (1.14.4 and 1.15.0 only). "1.14.0 text" = the committed copy in shoot.mjs at d152ea4 (`$S/model-1.14.0-copy.css`); 1.14.4's six rules equal that copy exactly under the pin's comparator. 1.15.0 app.css is MINIFIED (598,237 B vs 668,206 B), asar sha256 `0e6383301078a798f0f3bdb42bdb606d904ada77eab8c8fc89da533573979248`.

| # | Rule | Old copy (1.14.0 spelling) | 1.15.0 spelling | Comparator verdict | Class |
|---|---|---|---|---|---|
| 1 | `button` | 19 decls | same 19 decls, same order | = | none |
| 2 | `button:not(.clickable-icon)` | 3 decls | same | = | none |
| 3 | `@media (hover: hover) { button:hover }` | at-rule prelude with spaces | `@media(hover:hover)` | ctx DIFF | (a) spacing only |
| 4 | `button:focus-visible` | `0 0 0 3px var(--background-modifier-border-focus)` | same | = | none |
| 5 | `button[disabled], button[aria-disabled="true"], button[disabled="true"]` + `opacity: 0.7` | quoted attr values, `0.7` | `[aria-disabled=true]`, `[disabled=true]` unquoted, `opacity:.7` | sel DIFF, decls DIFF | (a) quoting + leading zero only (`.7` == `0.7`) |
| 6 | `@media (forced-colors: active) { button }` | spaced prelude | `@media(forced-colors:active)` | ctx DIFF | (a) spacing only |

No class (b) (real declaration/selector change). Tokens: 14 tokens x dark/light = 28 pairs resolved in Chromium for copy@1.14.0, app@1.14.4, app@1.15.0: 0 differ (`$S/tokens.out`). Classification: pure minifier spelling, so no rendered byte can move; confirmed by freeze 280/280.

## Change (commit 6576fd4)
- `visual-harness/shoot.mjs`: `OBSIDIAN_HOST_BUTTON_CSS` rules #3, #5, #6 re-spelled verbatim as 1.15.0 (`@media(hover:hover)`, `@media(forced-colors:active)`, unquoted attribute values, `opacity: .7`); SC-497 provenance paragraph added after the SC-202 one. Comparator NOT loosened (ruling).
- `visual-harness/obsidian-host-pin.mjs`: `PINNED_OBSIDIAN = '1.15.0'`, SC-497 provenance paragraph in the SC-202 style.
- `styles-source.css`: `[SC205-HOST-RULES]` listing kept in step (3 lines).
- `visual-harness/fetch-obsidian-app-css.mjs:136`: comment only ("1.14.0 when this was written; 1.15.0 as of SC-497").
- Jest: no test pins the copy text or the version string; none changed. `obsidianAppCssPin.test.ts` compares the app.css pin (1.13.7) against `PINNED_OBSIDIAN` with cmp -1 before and after; green.
- `obsidian-light-island.mjs:63` does not name 1.14.0 (its text is the generic bump procedure), so it was not touched.

## Gates (scratch/log dir `$S` = /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-impl-k4w9zq)
| Gate | Result | Log |
|---|---|---|
| tsc (incl -p e2e) | clean, rc 0 | $S/tsc.log |
| lint (incl e2e) | clean, rc 0 (only the known .eslintignore deprecation warning) | $S/lint.log |
| jest | Tests: 1 skipped, 5769 passed, 5770 total; Suites: 1 skipped, 238 passed, 238 of 239 | $S/jest.log |
| lifecycle (port 9397) | `OBSIDIAN-LIFECYCLE done: 32/32 ok, 0 failed`, rc 0 | $S/life.log |
| e2e | `OBSIDIAN-E2E done: 104/104 ok, 0 failed, 0 known-bug, coverage: 69/69 pairs`, rc 0 | $S/e2e.log |
| shots | rc 0, 592 PNGs, 0 FAIL | $S/shots.log |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, rc 0 | $S/freeze.log |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s).`, rc 0 | $S/parity.log |

Order note: jest ran after a shots run (cached `dist/obsidian-app.css`), as required. Fresh worktree had no node_modules; I ran `npm ci` (rc 0, no tracked changes).

## Verbatim shots lines ($S/shots.log)
- `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.15.0; 18 further rules whose subject is a plain button were excluded by documented ancestor scope, 0 unclassifiable — see EXCLUDED_ANCESTOR_SCOPES)` (excluded count is 18 under 1.15.0 vs 20 under 1.14.4 - a SKILL.md line that cites "21 further rules" is already stale)
- `button host-leak OK (113 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 678 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)`
  - boundary: `20 of those (kind,state) records sampled the node at rest ...` = 10× focus-visible: disabled; 6× hover: renders a zero-sized box; 2× hover: no point in its box hit-tests to it; 2× focus-visible: renders no box at all (a display:none ancestor). Identical on base d152ea4 + 1.14.4 ($S/shots-base.log), so not caused by this change; the "10-record" / "112 / 672" figures in dse-verify are stale from landings since 2026-10-21 (SC-279 etc. - not bisected).
- `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)`
  - `not openable in the harness (3, no <button> of their own beyond the swept kit footers): CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal`
  - boundary: `6 of those (kind,state) records ...` = 6× focus-visible: disabled. NO `ALLOWLISTED` line (grep count 0).
- `text scale OK (1626 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal, on 5 chrome surfaces (search modal rows + empty-index hint, settings preview caption, sidebar header + empty message) and in both print surfaces; a knob scales its own tokens exactly and moves no other knob's; control text does not move on paper; the "Untitled encounter" prompt stays on the label size)`
- `text scale once OK (107256 comparisons over 214 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 98s)`
- `pressed toggle parity OK (toggled vs rendered, both directions: 96 comparisons across 8 sites x dark/light x rest/hover/focus-visible on the computed cascade, 9 paint properties each)`
- `pipette selected look OK (a custom colour fills the pipette, hides its glyph and draws the check; the kit ring shows on keyboard focus: idle/picked/focused x dark/light on the computed cascade)`
- `chrome host-leak OK (18 family/scheme combos: chrome buttons carry no host box-shadow, the panel's box is unchanged by Obsidian's `button` rule, and the card's top border is continuous under the panel AND around the top-right arc beside it)`
- app.css pin line (out of scope, reported only): `OBSIDIAN APP.CSS PIN DRIFT — installed Obsidian is 1.15.0 (app.css sha256 dabc7a75001af0cf898501d570e110d86f269496789942fbb3370bba47a3db07) but the harness gate runs against the pinned 1.13.7 (app.css sha256 f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41). Expected until the pin is deliberately bumped — see visual-harness/README.md → "Obsidian app.css pin" for the bump procedure.` It is a WARNING-style line, shots rc 0.

## Drive-by fixes:
- None.

## Follow-ups:
- dse-verify SKILL.md "Current expected numbers" and the in-run-gates section: host-leak is now 113 kinds / 678 comparisons with a 20-record boundary (10 focus-visible disabled, 6 hover zero-sized, 2 hover no-hit, 2 focus-visible no-box); "host-copy pin OK" excluded count is 18 on 1.15.0 (20 on 1.14.4); e2e/dse-verify text still says pinned Obsidian app 1.14.4 for the e2e cache (unchanged here). Also `text scale once` is now 107256 over 214 loads. Owner/dispatcher updates the skill; I did not touch the workspace.
- `OBSIDIAN_APP_CSS_PIN` is still 1.13.7 and prints a standing PIN DRIFT line; a deliberate bump with its own sanctioned rebaseline (per SC-202) is a separate ticket. `obsidian-light-island.mjs` documents bumping both pins together - its procedure text now disagrees in practice with this host-model-only bump (no change made).
- The 1.15.0 minified spelling means every future host-copy re-extract from a minified Obsidian will carry odd spellings (`@media(hover:hover)`); the whitespace/quote-only normalizer is why. A tokenizing comparator is SC-276 territory (ruling: not done here).

## Artifacts
- Report: /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc497-obsidian-115-pin/sc497-r1-impl-report.md
- Logs, extracted css, tokens/rules diffs (all under $S): app-1.14.4.css, app-1.15.0.css, model-1.14.0-copy.css, tokens.out, rules.out, tsc/lint/jest/life/e2e/shots/freeze/parity .log + .rc, shots-base.log (A/B on d152ea4 + 1.14.4-only HOME, rc 0).

---

## r2 section (fix round, comment-only, 2026-10-23)
- Verdict: DONE. Plugin commit `docs(SC-497)` on top of `6576fd4` (sha in the return message / `git -C <plugin> log -1`). Not pushed, no trailers.
- LOW-1 `visual-harness/obsidian-light-island.mjs` (~62-69): reworded. The generated light-island block derives from `OBSIDIAN_APP_CSS_PIN`, so it regenerates only when THAT pin moves; `PINNED_OBSIDIAN` (host button-rule model floor) is an independent pin (SC-202 and SC-497 bumped it alone) and needs no regeneration; the app.css pin's bump carries its own sanctioned rebaseline.
- LOW-2 `visual-harness/shoot.mjs:1354`: "668,206" replaced. Measured on my extracted `app-1.14.4.css`: `wc -c` = 668,223 bytes, `wc -m` = 668,205 characters (the 18-byte gap is multibyte characters). 1.15.0: 598,237 bytes = 598,237 characters (pure ASCII), so that figure stands. Comment now says "668,223 bytes / 668,205 characters in 1.14.4".
- Diff stat: 2 files, 9 insertions, 5 deletions; `git diff` shows only `//` comment lines changed.
- Gates (scratch `.../sc497-r1-impl-k4w9zq/r2/`): `node --check` on shoot.mjs rc 0 and on obsidian-light-island.mjs rc 0; lint (incl e2e) rc 0; tsc (incl -p e2e) rc 0. Logs: check1/check2/lint/tsc `.log` + `.rc`. No shots re-run (comment-only).

---

## r3 section (fix round, comment-only, 2026-10-23)
- Verdict: DONE. One commit `docs(SC-497)` on top of `45dd1d1` (sha via `git -C <plugin> log -1`). Not pushed, no trailers.
- LOW-3: `styles-source.css` (inside the SC-127 light-island CSS comment, ~15988-15992): "bump the pin in obsidian-host-pin.mjs AND obsidian-app-css.pin.mjs ... commit both together" replaced by: the block derives from `OBSIDIAN_APP_CSS_PIN` ONLY and regenerates only when that pin moves; `PINNED_OBSIDIAN` is an independent pin that needs no regeneration. +6/-3 lines, one file.
- Grep of the plugin (visual-harness/*.mjs, README.md, styles-source.css, AGENTS.md, docs/, e2e/README.md, src, package.json; tests excluded from edits) for other "bump both together" wording: no other place. `visual-harness/README.md` step 5 ties the light island to the app.css pin only (correct); `obsidian-app-css.pin.mjs` header says the two pins "answer different questions" (correct); the light-island header was fixed in r2; no jest test reads the edited wording.
- Built-output check (`npm run build-no-check`, before the edit at 45dd1d1, then after): styles.css sha256 `c0a364349fe826b6e1dcbfa08848c95d8a069a73a53351c8e73da7da5bee3b04` before and after (identical); main.js `d558816ff015725961ef6a0e2ef829c639bb742cfa406316779bb249b348dbb9` before and after (identical).
- Gates: build before rc 0, build after rc 0, lint (incl e2e) rc 0, tsc (incl -p e2e) rc 0. Logs and sha files in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-impl-k4w9zq/r3/` (`build-before/after`, `lint`, `tsc` `.log`+`.rc`, `sha-before.txt`, `sha-after.txt`).
