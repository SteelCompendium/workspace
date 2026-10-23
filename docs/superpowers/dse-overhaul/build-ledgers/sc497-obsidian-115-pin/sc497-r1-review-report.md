# SC-497 r1 independent review report

## Executive summary
- Verdict: **APPROVE_WITH_NITS**. Reviewed plugin `6576fd4` (branch `sc497-obsidian-115-pin`, base `d152ea4`), 4 files, +36/-11.
- Fidelity: an independent extraction of 1.15.0 app.css (598,237 B, sha256 `dabc7a75…`; asar sha256 `0e638330…`, matching the comment) gives 6 reaching rules, all EQUAL to the new model under the pin's comparator. Token pairs: 0 of 28 differ after normalization. The `[SC205-HOST-RULES]` listing matches 1.15.0's reaching names exactly. All 3 rule differences against 1.14.4 are minifier spelling (class a). No declaration or selector changed.
- Floor: with a HOME holding only the 1.14.4 asar, `findObsidianAsar()` returns `usable:false`, with the reason "1.14.4, OLDER than the 1.15.0". That takes the `skip()` path, which prints `host-copy pin PARTIAL` with no exit(1). Probed, not inferred.
- Scope: `obsidian-app-css.pin.mjs` is untouched (`git diff --quiet` rc 0). The comparator (`normalizeSelector`/`normalizeDecls`) is not in the diff. No comment still names 1.14.0 as the current model pin; the 1.14.0 mentions left are dated history.
- Shots (my run at 6576fd4): rc 0, 592 PNGs, 0 FAIL, no ALLOWLISTED line. Freeze: `freeze OK (280/280 …)`, rc 0. Every in-run line is byte-identical to the implementer's, except the text-scale-once runtime (87s vs 98s).
- Jest (harness/pin suites: test/unit/build, test/dom/theme, test/dom/visual-harness): 30/30 suites, 615 passed, 0 skipped, rc 0.
- Addendum: the base A/B is sound. The base tree is byte-identical to `git archive d152ea4`, and its log differs from head only in the drift line, host-copy pin version/excluded count, and bundle size. The 113/678/20-record figures come from the code before this change. The app.css PIN DRIFT line was already printed on base (1.14.4 vs 1.13.7). It is a `console.log` that never exits non-zero.
- Findings: 0 HIGH, 0 MEDIUM, 2 LOW (a stale procedure comment and a wrong byte count), 3 INFO.

## 1. Fidelity of the copy (probe: `probe-fidelity.mjs`)
I extracted app.css read-only from both asars with the module's own `readAsarFile` and ran `partitionButtonRules`. On 1.15.0: reaching 6, excluded 18, unaccounted 0. On 1.14.4: reaching 6, excluded 20, unaccounted 0.

| # | 1.15.0 raw source (verbatim) | model at head vs 1.15.0 | model at head vs 1.14.4 | Class |
|---|---|---|---|---|
| 1 | `button{--text-color: var(--text-normal);…;transition:var(--button-transition)}` (19 decls) | EQUAL | EQUAL | — |
| 2 | `button:not(.clickable-icon){color:…;background-color:…;box-shadow:…}` | EQUAL | EQUAL | — |
| 3 | `@media(hover:hover){button:hover{…}}` | EQUAL | DIFF (ctx `@media (hover: hover)`) | (a) spacing |
| 4 | `button:focus-visible{box-shadow:0 0 0 3px var(--background-modifier-border-focus)}` | EQUAL | EQUAL | — |
| 5 | `button[disabled],button[aria-disabled=true],button[disabled=true]{cursor:not-allowed;opacity:.7}` | EQUAL | DIFF (quoted `"true"`, `0.7`) | (a) quoting, leading zero |
| 6 | `@media(forced-colors:active){button{border:1px ButtonBorder solid}}` | EQUAL | DIFF (ctx spacing) | (a) spacing |

The implementer's classification table is confirmed: every difference is class (a), and none is class (b). Tokens were resolved in Chromium under `theme-dark` and `theme-light` for the model, 1.15.0 and 1.14.4: 0 of 28 differ after normalization. 4 differ as raw strings (`0.5px` vs `.5px` in the four `--input-shadow*` values), and `normalizeTokenValue` absorbs that by design.

## 2. Floor semantics (probe: `probe-floor.mjs` under a fake HOME)
- With only a symlink to `obsidian-1.14.4.asar` in the fake HOME, the result is `{"version":"1.14.4","usable":false,"why":"the newest Obsidian installed here is 1.14.4, OLDER than the 1.15.0 the host copy was extracted from"}`. At `shoot.mjs:1624`, `if (!found.usable) { skip(found.why); return; }` runs, which prints PARTIAL and keeps rc 0.
- With both asars present, it picks 1.15.0 and returns `usable:true`, so the comparison runs.
- `compareVersions` checks: 1.14.4 < 1.15.0 gives -1, 1.15.1 gives +1, and 1.9.9 gives -1 (numeric, not lexical).
- Other consumers of `findObsidianAsar` (`fetch-obsidian-app-css.mjs:260,374`) use `isEligibleInstalledAsar`, which ignores `usable`. The bump therefore cannot change the app.css fallback or drift path.

## 3. Scope
- `visual-harness/obsidian-app-css.pin.mjs` is unchanged since `a4123ae`.
- The diff touches only comments, `PINNED_OBSIDIAN`, the model template, and the listing. `normalizeSelector`/`normalizeDecls`/`normalizeTokenValue` are untouched.
- No test changed, and `src/` is untouched. Lifecycle, e2e and parity were not re-run, as the brief allows.
- The remaining `1.14.0` mentions (`obsidian-host-pin.mjs:37-38,45`, `shoot.mjs:1338-1347,2236`, `fetch-obsidian-app-css.mjs:30,136`, `README.md:178,207`, `styles-source.css:17992,18302,18747`, `obsidianAppCssPin.test.ts:70`) are all dated history or describe the real-sheet enumeration. None claims 1.14.0 is the current model pin.

## 4. Shots, verbatim lines (my run, `shots.log`, head `6576fd4ba1d79d590b629aa19bcaeb408cfc8b04`)
- rc 0 · 592 PNGs · `grep -c FAIL` = 0 · no `ALLOWLISTED`, `PARTIAL` or `HOST COPY DRIFTED` line.
- `host-copy pin OK (6 button-reaching rules + 14 tokens × dark/light + the styles-source.css listing: the host model is verbatim Obsidian 1.15.0; 18 further rules whose subject is a plain button were excluded by documented ancestor scope, 0 unclassifiable — see EXCLUDED_ANCESTOR_SCOPES)`
- `button host-leak OK (113 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 678 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)`. Its 20-record boundary breaks down as: 10× focus-visible disabled; 6× hover zero-sized box; 2× hover no hit point; 2× focus-visible no box (display:none ancestor).
- `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons: …)`
  - `not openable in the harness (3, no <button> of their own beyond the swept kit footers): CompendiumSearchModal, LegacyCompendiumModal, CompendiumMigrationModal`
  - 6-record boundary (6× focus-visible disabled).
- `text scale OK (1626 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal, on 5 chrome surfaces (search modal rows + empty-index hint, settings preview caption, sidebar header + empty message) and in both print surfaces; a knob scales its own tokens exactly and moves no other knob's; control text does not move on paper; the "Untitled encounter" prompt stays on the label size)`
- `text scale once OK (107256 comparisons over 214 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 87s)`
- `pressed toggle parity OK (toggled vs rendered, both directions: 96 comparisons across 8 sites x dark/light x rest/hover/focus-visible on the computed cascade, 9 paint properties each)`
- `pipette selected look OK (a custom colour fills the pipette, hides its glyph and draws the check; the kit ring shows on keyboard focus: idle/picked/focused x dark/light on the computed cascade)`
- `chrome host-leak OK (18 family/scheme combos: chrome buttons carry no host box-shadow, the panel's box is unchanged by Obsidian's `button` rule, and the card's top border is continuous under the panel AND around the top-right arc beside it)`
- Drift line, a WARNING (rc 0): `OBSIDIAN APP.CSS PIN DRIFT — installed Obsidian is 1.15.0 (app.css sha256 dabc7a75001af0cf898501d570e110d86f269496789942fbb3370bba47a3db07) but the harness gate runs against the pinned 1.13.7 (app.css sha256 f612f1e8f36486fa57f3b8bd45f0c848409d5b168002e757a13c6d286a7b4c41). Expected until the pin is deliberately bumped — …`
- Freeze: `freeze OK (280/280 frozen print PNGs byte-identical — steel-print twin + steel-realprint since SC-170)`, rc 0.

## 5. Addendum checks
- **Base A/B soundness.** The `base/` tree was compared with `git archive d152ea4` using `diff -rq`. It is identical apart from generated `node_modules`(symlink)/`visual-harness/dist`/`shots`, so the gallery is the same. The fake HOME held only a symlink to `obsidian-1.14.4.asar`. This was necessary: base `PINNED_OBSIDIAN` is 1.14.0, and under the real HOME base would hit HOST COPY DRIFTED against 1.15.0 and exit before the sweep. Head ran under the real HOME. That asymmetry does not matter for the sweep, because kind counts depend only on the gallery DOM and the in-repo model, and HOME feeds only the host-copy comparison and the drift line. After normalizing paths, the base and head logs differ in exactly 4 places (`shots-base-vs-head.diff`): harness.js 3.0mb vs 2.7mb (INFO-3), the drift line's installed version, the host-copy line (1.14.4/20 excluded vs 1.15.0/18), and an npm notice. The 113/678/20-record lines and the modal 38/228/6 lines are identical. The gallery drift therefore predates this change.
- **app.css PIN DRIFT is pre-existing.** The base log line 15 reads `OBSIDIAN APP.CSS PIN DRIFT — installed Obsidian is 1.14.4 (app.css sha256 866e50ac…) but … pinned 1.13.7`. That sha matches my independent 1.14.4 extraction. `checkDriftAgainstInstalled` (`fetch-obsidian-app-css.mjs:372-386`) is a `console.log`, documented "Never throws", and has no exit path. The only new part is the installed version in the message.

## Findings

### LOW-1: the light-island procedure comment now contradicts how this pin was bumped
- **Where:** `visual-harness/obsidian-light-island.mjs:62-66`. The comment reads: "bump PINNED_OBSIDIAN in obsidian-host-pin.mjs and the pin in obsidian-app-css.pin.mjs … — never bump one without the other."
- **Failure scenario:** A future agent reads this, sees `PINNED_OBSIDIAN=1.15.0` next to `OBSIDIAN_APP_CSS_PIN=1.13.7`, and either "fixes" the mismatch by bumping the app.css pin without SC-202's sanctioned rebaseline, or treats SC-497 as a procedural violation. SC-202 had already split the two pins (1.14.0 vs 1.13.7), so the comment was stale before this change. SC-497 is the second bump to contradict it.
- **Prescribed fix:** reword it to say that the two pins are independent (SC-205 host-model floor vs SC-202 real-sheet content pin). The light island regenerates only when `OBSIDIAN_APP_CSS_PIN` moves, and that move carries its own sanctioned rebaseline. This is in scope under the owner's comment-truth ruling. Otherwise, file it as a follow-up. It does not block landing.

### LOW-2: wrong 1.14.4 app.css byte count in the provenance comment
- **Where:** `visual-harness/shoot.mjs:1354`, which says "598,237 bytes, down from 668,206 in 1.14.4". The implementer's report gives the same figure.
- **Measured:** 1.14.4 app.css is 668,223 bytes (668,205 characters). 1.15.0's 598,237 is correct (it is ASCII-only).
- **Failure scenario:** someone checking the provenance against the asar gets a mismatch and suspects a different file.
- **Prescribed fix:** change the number to `668,223`. It does not block landing.

### INFO-1: the token block keeps its old spelling
The token values in `OBSIDIAN_HOST_BUTTON_CSS` keep the pre-minifier spelling (`0.5px`, `0.09`) while 1.15.0 uses `.5px`. This is correct: the token comparison is by resolved, normalized value, and the comment only claims verbatim re-spelling for the rules. No action needed.

### INFO-2: updates for dse-verify SKILL.md (owner-side, workspace doc)
- The host-copy floor text says "(currently 1.13.7)". It should now read 1.15.0.
- "21 further rules" should be 18 (1.15.0).
- The gallery figures should be 113 kinds / 678 comparisons with a 20-record boundary (10 focus-visible disabled, 6 hover zero-sized, 2 hover no-hit, 2 focus-visible no-box), replacing 112/672/10.
- Modal stays 38/228/6.
- All of this matches the implementer's follow-up list.

### INFO-3: base and head bundle sizes differ
The base A/B bundle `harness.js` was 3.0mb vs head 2.7mb. This is probably esbuild resolving through the `node_modules` symlink in the exported base tree and bundling duplicate package copies. The gate lines are identical, so the A/B conclusion holds. It is worth knowing if that A/B technique is reused.

## Hygiene
`git status --porcelain --ignored` was identical before and after for the plugin worktree, and `git status --porcelain` for its superproject. The head stayed `6576fd4`. I wrote nothing under `~/.config/obsidian` (fake HOMEs use symlinks inside my scratch) and nothing under the workspace except this report. The probes regenerated `visual-harness/shots/` and `dist/` (both ignored) inside the SC-497 worktree.

## Evidence (all under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-review-283543/`)
`probe-fidelity.mjs`, `probe-fidelity.log`, `probe-floor.mjs`, `probe-floor.log`, `probe-floor-both.log`, `app-1.15.0.css`, `app-1.14.4.css`, `model-head.css`, `shots.log`, `shots.rc`, `shots.pngcount`, `shots.head`, `freeze.log`, `freeze.rc`, `jest.log`, `jest.rc`, `shots-base-vs-head.diff`, `base-check/` (git archive d152ea4), `status-{before,after}-{plugin,super}.txt`.

## r2 scoped re-review — delta `6576fd4..45dd1d1` (2026-10-23)

### Summary
- Verdict: **APPROVE_WITH_NITS**. The fixes for LOW-1 and LOW-2 are correct. One residual LOW-3 remains: the same stale procedure text sits in `styles-source.css`, which I missed in r1. It does not block landing.
- Head is `45dd1d142f734c2565ab8667d1e9fd372afc233a`: one commit on top of `6576fd4`, 2 files, +9/-5. `git status --porcelain --ignored` matches the r1 baseline exactly.
- Comment-only: every changed line in `git diff -U0` starts with `//`, and no code line changed. `node --check` passes on both `visual-harness/obsidian-light-island.mjs` and `visual-harness/shoot.mjs` (rc 0).

### Checks
1. **LOW-1 rewording is accurate** (`visual-harness/obsidian-light-island.mjs:62-70`).
   - The generator's `main()` (line 262-) reads only `ensurePinnedObsidianAppCss()` and `readVerifiedSheet()`, both defaulting to `OBSIDIAN_APP_CSS_PIN`.
   - From `obsidian-host-pin.mjs` it imports only `iterRules` and never reads `PINNED_OBSIDIAN`.
   - So "regenerates only when THAT pin moves" and "PINNED_OBSIDIAN … INDEPENDENT … does not require a regeneration here" are true.
   - `visual-harness/README.md:221-232` (step 5) agrees with the new wording, since it speaks only of "this pin's sheet".
2. **LOW-2 number is correct** (`visual-harness/shoot.mjs:1354`): "668,223 bytes / 668,205 characters" matches my extraction (`wc -c` 668223, `wc -m` 668205).
3. Comment-only: confirmed above.
4. Head 45dd1d1, tree clean: confirmed above.

### Finding
**LOW-3: `styles-source.css:15988-15990` still has the procedure LOW-1 retired.**
- **What it says:** "Pin-bump procedure: bump the pin in obsidian-host-pin.mjs AND obsidian-app-css.pin.mjs, `npm run host-css` to refetch, THEN `npm run gen-light-island`, commit both together."
- **Why it matters:** this is the "styles-source.css's own comment" that the new light-island header points to as its source ("The pin-bump procedure (README.md, styles-source.css's own comment): …"). The header now cites a comment that says the opposite.
- **Failure scenario:** the same as LOW-1, reached through the CSS comment instead.
- **Prescribed fix:** reword the sentence to match. For example: "Pin-bump procedure: this block derives from OBSIDIAN_APP_CSS_PIN only — bump that pin, `npm run host-css`, THEN `npm run gen-light-island`, commit both together; PINNED_OBSIDIAN (obsidian-host-pin.mjs) is independent and needs no regeneration."
- **Risk of the fix:** it edits a comment inside a CSS comment, so no rule, PNG or frozen byte can move. Doing it now or filing it as a follow-up is the owner's call; it does not block landing.

### Evidence
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-review-283543/r2check.sh`
- `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc497-r1-review-283543/r2-check.log`

## r3 scoped re-review — delta `45dd1d1..907f55c` (2026-10-23)

### Summary
- Verdict: **APPROVE**. LOW-3 is fixed, and no new finding.
- Head is `907f55c52b114c13c981c520821f14a75b441efa`: one commit on top of `45dd1d1`, touching only `styles-source.css` (+6/-3).
- The tree is clean: `git status --porcelain --ignored` is identical to the r1 baseline.

### Checks
1. **The new wording is accurate.** It now says the block derives from `OBSIDIAN_APP_CSS_PIN` only, regenerates only when that pin moves, and that `PINNED_OBSIDIAN` is independent and needs no regeneration (`styles-source.css:15988-15993`). This matches the generator's actual inputs, which r2 verified.
2. **It is consistent with the other two procedure texts.**
   - The light-island header (`visual-harness/obsidian-light-island.mjs:62-70`) says the same: the procedure is bump, then host-css, then gen-light-island, with the pin and the block committed together, and `PINNED_OBSIDIAN` independent.
   - `visual-harness/README.md:221-232` (step 5) refers only to "this pin's sheet", meaning the app.css pin, and agrees.
   - All three procedure texts now agree.
3. **The change sits wholly inside one CSS comment.** The enclosing comment opens at line 15969 and closes at 16012, and there is no `/*` or `*/` between lines 15985 and 15993.
4. **Built output does not move.** The implementer's logs in `…/sc497-r1-impl-k4w9zq/r3/` show `build-no-check` with rc 0 both before and after, and identical sha256 values in both runs: `styles.css` `c0a364349fe826b6e1dcbfa08848c95d8a069a73a53351c8e73da7da5bee3b04`, `main.js` `d558816f…dbb9`.
   - The current `styles.css` in the worktree hashes to the same `c0a36434…3b04`.
   - The built `styles.css` contains 0 occurrences of "Pin-bump" or "PINNED_OBSIDIAN", so the build strips this comment. No styles.css, PNG or frozen byte can move.
   - That makes the logs convincing, so I did not re-run the build.
