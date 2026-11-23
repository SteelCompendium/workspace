# SC-683 r2 independent review — Card size slider minimum 80% -> 30%

## Executive summary
- VERDICT (r4, current): **LAND-READY** at plugin `aee83dc1` and superproject `c7f195e6`. MED-1 is closed. There are 0 open findings and 1 cosmetic INFO. See "r4 scoped re-review" at the end.
- Verdict at r2 (superseded): FIX-REQUIRED (docs only; no code finding). Plugin `594cbd5c` on base `9be108c9`; superproject `691aad74`.
- Findings: 0 CRITICAL / 0 HIGH / 1 MED / 0 LOW / 6 INFO. MED-1: the unreleased 7.0.0 notes in the plugin CHANGELOG still say Card size is 80%–120% and that it uses "the same ranges ... as steelcompendium.io" (CHANGELOG.md:1360-1363), in the same unreleased section as the new 30% bullet. The implementer called this line an "old release entry". It is not one.
- Gates re-run at 594cbd5c: tsc (incl. e2e) rc 0, lint rc 0, jest **14439 passed / 1 skipped** (311/312 suites), the implementer's number (baseline 14438 + 1 new test). e2e full `794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs` (SET-Z02 ok). Freeze not re-run: the diff touches no CSS. A harness.css built at head is byte-identical to one built at base.
- Mutations: CARD_SCALE.min put back to 0.8 makes 10 tests in 6 suites fail; set to 0.25, 9 tests in 6 suites fail. The tests are honest.
- snap(): over 2,501 inputs from -0.5 to 2.0 in 0.001 steps, there are exactly 19 distinct outputs, all two-decimal literals (0.3..1.2), with no float drift. Legacy values 0.8–1.2 round-trip. Junk input gives 1, and strings are parsed.
- Render (head harness, real `prefs=cardScale:` path): zoom is 0.3 / 0.5 on statblock, feature, featureblock and the by-SCC condition card. Each card has one zoomed element. There is no horizontal overflow, no NaN text, no harness errors and no hit or focus regression. At 30% the card's outer box stays 760 px wide in a 900 px viewport, its content lays out across 2533 css px, and the card gets shorter, not narrower. The same is true at 80% on base 9be108c9 (760 px box, 950 css px layout, PNG byte-identical to head at 80%), so this behaviour comes from the existing zoom rule and was not introduced by this change.
- Print: with `print=1` at 0.3, the root has `data-dse-print="on"` and the card zoom is 1, under both screen and print media. Box and height are identical to print at 100% (760 x 2102.34).

## Findings

### MED-1 — 7.0.0 release notes contradict themselves about the Card size range
- Where: `draw-steel-elements/CHANGELOG.md:1360-1363`, inside `## 7.0.0 (unreleased; previously numbered 6.0.0)` (header at line 20; that section runs to line 1548).
  The text: "**Two size sliders** — Text size (60%–140%) and Card size (80%–120%), in 5% steps: the same ranges, steps, and snap behavior as steelcompendium.io's own site settings."
- Failure scenario: 7.0.0 ships, and a user reading the release notes sees "Card size (80%–120%) ... the same ranges ... as steelcompendium.io" and also, at line 25, "Card size can now go down to 30%". Both statements describe the same unreleased version. The first is false about what ships, and its site-parity claim is now false for Card size (ledger O3: the site keeps CARD_MIN 0.8).
  The implementer's report lists this as "the 7.0.0-history changelog line ('Card size (80%–120%)', old release entry) ... left alone". That is wrong: no released version ever had the Typography sliders.
- Precedent for editing an earlier bullet in the unreleased section: lines 86, 117, 124 and 146 append "Since SC-60x this holds ..." to older unreleased bullets.
- Fix: amend line 1360-1362 to the shipped truth. For example: "Text size (60%–140%) and Card size (30%–120% since SC-683), in 5% steps: Text size uses the same range, step and snap as steelcompendium.io's site settings; Card size goes lower than the site's 80%." Optionally fold the line-25 bullet into it, or keep both (owner's call). No code or test change.

### INFO-1 — "card gets shorter, not narrower" is pre-existing zoom-rule behaviour (owner's extra probe)
These are measured facts. The harness runs at 900 px viewport, steel/dark, and the card fills the 760 px `#mount`. "Layout" is the card's `offsetWidth` in its own zoomed coordinate space.

| tree | Card size | stamped var | computed zoom | outer box w (px) | layout w (css px) | box h (px) |
|---|---|---|---|---|---|---|
| head 594cbd5c | 100% | (none) | 1 | 760 | 760 | 3739.7 |
| head | 80% | 0.8 | 0.8 | 760 | 950 | 2919.42 |
| head | 50% | 0.5 | 0.5 | 760 | 1520 | 1793.78 |
| head | 30% | 0.3 | 0.3 | 760 | 2533 | 1092.94 |
| base 9be108c9 | 100% | (none) | 1 | 760 | 760 | 3739.7 |
| base | 80% | 0.8 | 0.8 | 760 | 950 | 2919.42 |
| base | asked 50% / 30% | 0.8 (clamped) | 0.8 | 760 | 950 | 2919.42 |
| head | 30%, 360 px mount | 0.3 | 0.3 | 360 | 1200 | 1125.5 |
| base | asked 30%, 360 px mount | 0.8 | 0.8 | 360 | 450 | 3563.95 |

- The implementer's figures (760 / 2533, h 1092.9) are confirmed.
- The 80% PNG from head is byte-identical (md5 7305923...) to the 80% PNG from base, and to base's clamped 30% request. So at any value both trees can show, the render is unchanged. The only new thing is that values below 0.8 are now reachable.
- Feature card: 760 px box at every scale, layout 2533 at 30%, height 1214.13 -> 384.02. Featureblock: 915.77 -> 242.64. By-SCC condition card: 352.5 -> 75.16.
- Settings preview at 30%: the `.dse-sb` box is 734 px wide, layout 2447, zoom 0.3. On base, at the 0.8 clamp, it is 734 px wide with layout 918.

### INFO-2 — Nested and modal arms: each card is zoomed exactly once
- Corpus: all 83 harness element:fixture pairs at head 0.3, head 1 and base 0.8. Zoomed mounts 38 / 0 / 38. Elements with a zoomed ancestor: 0. Document or mount horizontal overflow: 0. NaN: 0. Harness errors: 0. Page errors: 0.
  No harness fixture nests a `[data-dse-element]` root inside another (0 of 83), so the nested reset (styles-source.css:8446-8452) cannot be reached through any fixture. I checked it by injection instead.
- Injection into a zoomed statblock: a nested statblock `.dse-sb`, a nested feature root and a nested featureblock `.dse-card` each show own zoom 1 and an ancestor-chain zoom of exactly 0.3, 0.5 and 0.8 at those scales. None shows 0.09.
- A `.dse-modal > .dse-modal__body > .dse-sb` with the var stamped on the modal root renders at zoom 0.3, so a 400 px box becomes 120 px. The descendant arm at styles-source.css:8433-8439 works.
- No shipped DseModal mounts a card: grep of `src/views/*Modal*.ts`, `src/elements/montage/*Modal*.ts` and `src/authoring` found no `.dse-sb`/`.dse-card`. In the harness search-modal surface, `--dse-card-scale: 0.3` is stamped on `.modal.prompt.dse-fs-root` with zero cards in it. The modal arm therefore stays inert on real content, which matches the CSS comment at styles-source.css:8415-8424.

### INFO-3 — Controls stay hit-testable and focusable at 30%, but get very small
- Statblock, feature, featureblock and condition cards at 30%: every visible control (button, summary, [role=button], [tabindex], input) passes `elementFromPoint` at its centre and `focus()`, except one per feature/featureblock/condition-at-100%. That one exception occurs at every scale and on base too, so it is pre-existing and not related to scale.
- Smallest control box (rendered px): 25.5x24.16 at 100%, 20.39x19.3 at 80%, 12.75x12.06 at 50%, 7.64x7.23 at 30%. The implementer measured the smallest text at 3.84 px at 30%. Both follow from what Scott asked for, so they are not findings. Reported because the owner may want to mention them to Scott.

### INFO-4 — Completeness of the range change
- `CARD_SCALE` (`src/prefs/scale.ts:31`) is the only place the range is defined. `catalog.ts:299-303` reads min, max and step from it. Grep of `src/` found no other 0.8 card clamp: `prefOverrides`, `tokens`, `textScaleRoot`, `SettingsPreview` and the slider builder all use the descriptor.
- `TEXT_SCALE` {0.6, 1.4, 0.05, 1} and `TYPE_SCALE` {0.8, 1.2, 0.05, 1} were bundled from the real source and are unchanged. The three type-role help strings still say (80%–120%) (`catalog.ts:349/361/373`). `docs/settings.md:42` still says "all 80%–120%" for those three.
- The Card size help string at `catalog.ts:304` is hand-written ("30%–120%"), not derived from `CARD_SCALE`. This is the same pattern as before the change. Noted only.
- Real Obsidian: SET-Z02 presses Home on the native range input and asserts `data.json` `prefs.cardScale` toBe 0.3 on disk (`e2e/driver/settingsDrive.ts:42-46`, `diskData().prefs`). It also asserts that the shown value is 0.3 and that `--dse-card-scale` is '0.3' on the open stamina bar.

### INFO-5 — Comments and docs (outside MED-1)
These now give the current range truthfully: the `scale.ts` header and the CARD_SCALE and TYPE_SCALE docs, `catalog.ts` help, `docs/settings.md:40`, `docs/styling-statblocks.md:58`, `.repo-docs/architecture.md:383,397-399`, the plugin CHANGELOG line 25 bullet, and the superproject CHANGELOG line 11 bullet.
- `styles-source.css:15497` ("stayed <=0.01px off at 0.8x/1.2x") is an accurate historical probe note. I did not re-probe the crest nudge at 0.3, but zoom scales the whole subtree uniformly, as that comment explains.
- The superproject CHANGELOG line 2177 ("Settings sliders line up", the 2026-07-12 site entry) is about the website, and the website did not change (O3).

### INFO-6 — Evidence audit
- The implementer's A-series PNGs match mine in pixel size at every scale: 1520x7480, 5840, 3588 and 2186. Bytes differ by 168 px out of 3.32 M at 30% (1102 px out of 11.4 M at 100%; max channel diff about 155; same order at every scale, including 100%). That is environmental noise, not a scale difference.
- I viewed the contact sheet: the labels match the visible scale.
- My 30% statblock PNG shows the same thing: full-width card, long single-line rows, short stat tiles, no overlap or clipping.

## Gates (reviewer-run, at 594cbd5c)
- `npm run tsc` rc=0 (clean). `npm run lint` rc=0 (only the known `.eslintignore` deprecation warning).
- `npx jest`: `Test Suites: 1 skipped, 311 passed, 311 of 312 total` / `Tests: 1 skipped, 14439 passed, 14440 total` (84.1 s).
- Mutation jest (git-archive copies, shots cache absent, so 3 skipped): min=0.8 gives `6 failed, 1 skipped, 305 passed` suites and `10 failed, 3 skipped, 14427 passed` tests. min=0.25 gives `6 failed` suites and `9 failed, 3 skipped, 14428 passed` tests. Failing suites in both: scale.test, catalog.test, settings-tab, settings-matrix, settings-integrity, fontPrefs.smoke.
- e2e full: `OBSIDIAN-E2E done: 794/805 ok, 0 failed, 11 known-bug, coverage: 476/476 pairs` (rc 0, 14:39:13-14:45:03, pointer parked; SET-Z01..Z06 all ok, SET-Z02 932 ms) - matches CURRENT and the implementer.
- Freeze not re-run (no CSS in the diff; harness.css at head is byte-identical to base). The implementer's `freeze OK (280/280 ...)` log line was read and confirmed.

## Artifacts (reviewer scratch)
All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc683-review-r2/`:
- Gate logs: r2-tsc.log, r2-lint.log, r2-jest.log, r2-gate-rc.txt, r2-jest-mut08.log, r2-jest-mut025.log, r2-mut-rc.txt, r2-e2e-run1-1432.log, r2-e2e-run1-1432.rc
- Probes: r2-snap-probe-tree-head.json, r2-snap-probe.log, r2-render-head.json, r2-render-base.json, r2-render-summary.txt, r2-corpus-head-0.3.json, r2-corpus-head-1.json, r2-corpus-base-0.8.json, r2-inject-head.json
- PNGs: png-head/ (statblock 100/80/50/30, feature/featureblock/condition at 30, print1 at 30, settings-preview at 30, search-modal at 30), png-base/ (same set; the base value is clamped to 0.8)
- Scripts: r2-*.sh, r2-*.mjs, r2-pixdiff.py. Trees tree-{head,base,mut08,mut025}/ are git-archive exports with node_modules symlinked to the worktree's.

## r4 scoped re-review (fix-round delta only)

Scope: plugin `594cbd5c..aee83dc1` and superproject `691aad74..c7f195e6`. This is not a fresh pass.

**Verdict: LAND-READY** at plugin `aee83dc1` and superproject `c7f195e6`. MED-1 is closed. There are 0 open findings.

1. **The diffs touch only the expected files and sections.**
   - Plugin: one commit (`aee83dc1`), `CHANGELOG.md` only, +6/-4. It changes lines 1360-1365, inside `## 7.0.0 (unreleased ...)` (header at line 20, next release header at line 1551).
   - Superproject: one commit (`c7f195e6`), `CHANGELOG.md` only, +2/-2. It changes lines 1564-1565, inside `## Unreleased` (header at line 9, first dated header at line 1675).
   - Each commit's parent is the r2 head, so `aee83dc1` is a descendant of base `9be108c9`.
2. **Each amended sentence is true at head.**
   - "Card size (30%–120%), in 5% steps" matches `CARD_SCALE` {0.3, 1.2, 0.05}.
   - "Text size has the same range, steps, and snap behavior as steelcompendium.io's" holds: `v2/docs/javascripts/settings-core.js:22` has `SCALE_MIN = 0.6, SCALE_MAX = 1.4, SCALE_STEP = 0.05`, the same as `TEXT_SCALE`.
   - "Card size goes lower than the site's 80%" holds: `settings-core.js:23` has `CARD_MIN = 0.8`.
   - The superproject wording ("Card 30%–120% since SC-683 (it was 80%–120%) ... Text size is the site's exact slider range and snap semantics; Card size now goes lower than the site's 80%") is true for the same reasons.
   - Neither edit mentions the three type-role sliders.
3. **MED-1 is closed, and no other stale statement remains.**
   - Plugin unreleased section (lines 20-1548): every hit for "Card size", "80%–120%", "80% to 120%", "same range" and "site's exact" is either the new line-25/26 bullet, the amended line-1360 bullet, or a non-range mention (lines 496, 674, 1388).
   - Superproject `## Unreleased` (lines 9-1674): the only range statements are the SC-683 bullet (lines 11-13) and the amended line 1564-1565. Lines 1251, 1397 and 983 mention sliders or card scale but state no range.
   - The "80% to 120%" text left in both SC-683 bullets is in past tense ("A Card size you set before (80% to 120%) is unchanged"), which is correct.
4. **The r2 gate numbers still stand.** No test, e2e spec, harness or build script reads either CHANGELOG.md. The only hit is a code comment at `test/dom/authoring/schemaSuggest.test.ts:244` ("guards the example the CHANGELOG gives"), which reads no file. Between `594cbd5c` and `aee83dc1` only CHANGELOG.md changed, so the code is byte-identical to what r2 gated (jest 14439/1, e2e 794/805 with 0 failed and 476/476 pairs, tsc and lint clean).
5. **Commit messages carry no attribution.** `aee83dc1` and `c7f195e6` each have a subject line only, no body and no trailers; no Co-Authored-By and no AI attribution. Author: Scott Tomaszewski.

**INFO-r4-1 (cosmetic, does not block):** `CHANGELOG.md:1565` in the superproject is 158 characters long. The bullet around it is hard-wrapped at about 85 columns. Rewrap lines 1564-1565 if the owner wants to; Markdown renders it the same either way.

Tree state: the plugin worktree is clean at `aee83dc1`. The superproject shows ` M draw-steel-elements`, the same uncommitted pointer as in r2. Nothing was edited or committed.
