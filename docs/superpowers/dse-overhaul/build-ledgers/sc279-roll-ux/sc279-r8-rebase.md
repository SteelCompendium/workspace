# SC-279 r8 — rebase onto develop 54f8f88, docs reconcile, rebaseline, full battery

## Executive summary
- STATUS: DONE. Every gate below ran on ONE base: DSE `f3a4476` on `origin/develop` `54f8f88` (final). Superproject `c139a7d` on `origin/main` `46ae296`.
- DSE: 9 commits on 54f8f88 (8 original, a0d3fa6 roll.png refresh dropped per SC-407, + 1 new harness fix `f3a4476`). Not pushed.
- Superproject: 4 DESIGN.md commits + pointer bump `c139a7d` (draw-steel-elements -> f3a4476). Other 7 submodule pins equal origin/main's. Not pushed.
- Battery: tsc/lint clean · jest 5627 passed / 1 skipped / 234 of 235 suites (develop 5601 -> +26) · lifecycle 31/31 · e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 pairs · shots 592, 0 FAIL, both text-scale lines OK · freeze exactly the 2 roll print mismatches of 280 · parity 0 gaps / 0 undeclared / 24 declared.
- Rebaseline: two full shots runs, all 592 PNGs byte-identical run1 vs run2. The two roll print hashes are UNCHANGED vs the pre-r8 file (84eaaf74…, 16d5edbd…), so `sc279-rebaseline.txt` is byte-identical to `sc279-rebaseline.pre-r8.txt`. Baseline copy with those 2 lines substituted: 280/280 OK.
- Evidence: all 10 r8 evidence PNGs are byte-identical to the r4 counterparts.
- One new non-roll-UI change: `visual-harness/shoot.mjs` text-scale-once gate fix (see Drive-by / (a) below).

## Base history (why so many rebases)
Owner retargeted bc4a0c5 -> 772c3cd -> 8d075db -> 95981f1 -> 8d890f9 -> 54f8f88 mid-task. Every gate from earlier bases is void and was deleted or renamed `sc279-r8-void-*`. The recorded logs (`sc279-r8-{tsc,lint,jest1,jest2,lifecycle,e2e,shots1,shots2,freeze1,freeze2,parity}`) were all produced after the f3a4476 commit (20:08 local; first log 20:09) on base 54f8f88. origin/develop was re-fetched after the last gate: still 54f8f88.

## Conflicts and resolutions
1. CHANGELOG.md (commit "docs(roll): the roll strip…"): develop's 7.0.0 section kept whole; our [FIX] bullet reworded to the ability-card roller only (ds-roll references removed; Reset-to-authored-defaults and `mode: flat` sentences dropped as ds-roll-only), plus a new short [FIX] bullet for the statblock/featureblock per-ability roll-settings fix (no bullet existed). Both sit under `## 7.0.0 (unreleased…)` after the SC-372 bullet. Later rebases auto-merged cleanly (re-checked at 54f8f88).
2. docs/Roll.md: deleted by develop (SC-407) -> resolved as deleted (our edits dropped).
3. docs/Media/roll.png: deleted by develop -> our refresh commit a0d3fa6 skipped (it only touched that file).
4. docs/settings.md: kept develop's `## Rolling` section; our wording kept only for the ability-card roller (dice icon rolls at once, opens the strip, Modifiers section, Reset modifiers). Removed the dead `Roll.md#the-roll-strip` link and the "standalone Roll element always rolls" sentence (Roll.md gone; ds-roll deferred to SC-402). SC-407 docs guard (`test/unit/build/docsDeferredGuard.test.ts`) passes inside the full jest run.
5. styles-source.css, visual-harness/entry.ts, visual-harness/shoot.mjs, statblock/view.ts: auto-merged on every rebase (including SC-422's chrome text-scale gates and SC-366's `.dse-ref-notice` edit); no manual resolution.
6. Superproject: old pointer-bump commit conflicted against main's pin each time; dropped it and made a fresh bump after each rebase. Earlier 2nd DESIGN.md commit had also carried a pointer change; stripped (final series is DESIGN.md-only + the bump).

## Step 4: text scale (SC-372)
Our strip captions use `--dse-fs-caption`; no CSS change needed. Exact lines (shots2, identical in shots1):
- `text scale OK (1626 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal, on 5 chrome surfaces (search modal rows + empty-index hint, settings preview caption, sidebar header + empty message) and in both print surfaces; …)`
- `text scale once OK (107256 comparisons over 214 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 103s)` (113 s / 115 s on other runs). Develop prints 104184 / 208 loads at 8d075db-era; ours +3072 comparisons, +6 loads (our 6 added interaction-shot pages).

## (a) Why f3a4476 changes the text-scale-once harness (needed, not a weakening)
`assertTextScaleOnce` (SC-372) builds its page list from `manifest.interactionShots` using only `{element, fixture}` and `click`. Our roll shots (`feature-rolled*`) need `prefs: rollingEnabled:true` (the roller only exists with rolling on) and some need `width: 300` and a chain of `thenClicks`. Without prefs the page has no `.dse-roll-btn`, so the gate's `page.locator('.dse-roll-btn >> nth=0').click()` timed out after 30 s and threw `FAIL sweep (exception)` (seen on the first post-rebase shots run, log `sc279-r8-void-shots1-failed-onceprefs.log`; all 592 captures before it were fine). The fix loads interaction-shot pages the way `snap()` loads them (the same prefs/width routing already used for `prefShots` in the same function) and replays `thenClicks`. The gate's measurement (`sweepKnobs`, the 1.2 scale, the exactly-1-or-1.2 rule, `mustNotMove`) is unchanged; it now covers MORE (the expanded Modifiers panel and the narrow card strip), 6 extra loads, 3072 extra comparisons, 0 violations. Existing interaction shots without prefs/width/thenClicks load exactly as before.

## Gates (all on DSE f3a4476 / base 54f8f88)
| gate | result | expected |
|---|---|---|
| tsc (incl `tsc -p e2e`) | exit 0, no output | clean |
| lint | exit 0, 0 errors | clean |
| jest (pre-shots) | 5627 passed / 1 skipped / 234 of 235 suites (5628 total) | develop 5601 + ours |
| jest (post-shots) | identical: 5627 / 1 skipped / 234 of 235 | same |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` | 31/31 |
| e2e | `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` | same |
| shots x2 | 592 `ok`, 0 FAIL each; host-copy pin OK; button host-leak OK (113 kinds, 678 comparisons); text-scale lines OK | 592 |
| freeze (both runs) | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`: roll--steel-print.png, roll--steel-realprint.png only | exactly those 2 of 280 |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 | same |

Test arithmetic: jest 5627 - develop 5601 = +26. Static `it/test(` counts in the 3 changed test files: feature-roll +5, roll +5, rollBar +15 = 25; steelMaterial 0 (assertion edit only). The +1 gap is not explained by static counting (likely a parameterised or loop-built test); I did not chase it.

Note on e2e: one early e2e run (while other worktrees ran their own e2e concurrently, load ~15) failed with wdio driver timeouts, 50/93, `sc279-r8-void-e2e-run1-env-timeouts.log`; void and rerun on a quieter host, green on every later base.

## Rebaseline (step 7)
- `sc279-rebaseline.pre-r8.txt` = copy of the old file. New `sc279-rebaseline.txt` regenerated from the post-rebase shots: byte-identical to the old (`cmp` clean). Hashes did NOT change:
  - `84eaaf74619e81094660de1896743d315ac9db817168affbe0d7552f97fcefd3  roll--steel-print.png`
  - `16d5edbd61b330c9ac69cd52917dee575928905ab0363280a8fe6d3fc6b709c5  roll--steel-realprint.png`
- Determinism: all 592 PNG hashes identical run1 vs run2 (diff of full `sha256sum *.png` empty).
- Substitution proof on a COPY (scratch, `freeze-baseline.sha256` untouched, mtime still Oct 21 13:26): baseline copy with those 2 lines replaced = 280 lines, `sha256sum -c` = 280 OK, 0 non-OK (`sc279-r8-freeze-substituted.log`: lines "0" then "280").
- Hashes unchanged, so no before/after crops were needed (the r4 set `print-before-roll--*` / `print-after-roll--*` still describes the change).

## Evidence (step 8): `sc279-r8-evidence/`, each compared to `sc279-r4-evidence/` by `cmp`
a-ds-roll-collapsed-dark, b-ds-roll-expanded-dark, c-card-after-first-click-strip-collapsed-dark (crop y=1000 of feature-rolled--steel-dark), d-card-strip-expanded-1edge-skill-checked-dark (crop y=1000 of feature-rolled-modified--steel-dark), e-ds-roll-expanded-narrow300-dark, f-ds-roll-expanded-light, g-card-narrow300-strip-expanded-full-dark and h-card-narrow300-strip-collapsed-dark (re-run of the r4 element-level probe), print-after-roll--steel-print/realprint: ALL 10 IDENTICAL bytes to r4. r4 evidence stands.

## Drive-by fixes
- None unrelated. The `shoot.mjs` text-scale-once change is required for our shots to pass the gate (see (a)); it is in our branch's commit `f3a4476`.

## Follow-ups
- Commit message of `f9f896b` ("docs(roll): the roll strip in Roll.md and settings.md…") now over-states: Roll.md is not in the tree after SC-407. History-only; not rewritten.
- Idea only (not added): lifecycle scenario `G-S22` — with rolling on, open the Modifiers disclosure on an ability card, let a block write/re-render happen (as G-S3/G-S8 do), assert the strip's open state and the chosen edge/skill survive and that focus lands on the Modifiers header after Reset. jest covers these in jsdom; a real-Obsidian one would cover adoption across a re-render.
- Landing: superproject pointer must be re-bumped to the landed DSE sha (land-stack); no tags/pushes made by me.

## Artifacts (all under /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/)
- This report: `sc279-r8-rebase.md`
- Logs (+ `.exit`): `sc279-r8-tsc.log`, `sc279-r8-lint.log`, `sc279-r8-jest1.log`, `sc279-r8-jest2.log`, `sc279-r8-lifecycle.log`, `sc279-r8-e2e.log`, `sc279-r8-shots1.log`, `sc279-r8-shots2.log`, `sc279-r8-freeze1.log`, `sc279-r8-freeze2.log`, `sc279-r8-freeze-substituted.log`, `sc279-r8-parity.log`
- Void (earlier-base / env) logs: `sc279-r8-void-shots1-failed-onceprefs.log`, `sc279-r8-void-e2e-run1-env-timeouts.log`
- Rebaseline: `sc279-rebaseline.txt`, `sc279-rebaseline.pre-r8.txt`
- Evidence: `sc279-r8-evidence/` (10 PNGs)
- Scratch (private): `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r8-impl/` (`r8-allhash-run1.txt`, `r8-allhash-run2.txt`, `r8-baseline-copy.sha256`, probe output)
- Worktree: DSE `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux/draw-steel-elements` @ f3a4476; superproject `/home/scott/code/steelCompendium/worktrees/sc279-roll-ux` @ c139a7d

---

# r8b round (2026-10-22): rebase onto ea56712, feature-roll.gif refresh (MEDIUM-1), DESIGN.md link (LOW-1)

## Executive summary
- STATUS: DONE. One base for every gate: DSE `edb90d2` on `origin/develop` `ea567123845712b2b021edf0b24617487f10af22` (re-fetched after the last gate: still ea56712). Superproject `fd59a61` on `origin/main` `e5f329ace52a9dcf2e8b4630d9f72753652c1e61`. Not pushed.
- DSE rebase onto ea56712 (SC-356) was clean: shoot.mjs, styles-source.css overlaps auto-merged, no conflict. `assertModalRegistry` passes (the shots run exits 0 with no modal-registry failure; SC-279 adds no modal).
- MEDIUM-1 fixed: `docs/Media/feature-roll.gif` regenerated (commit `edb90d2`). `--check-stable` read `stable` (3 frames, sha256 ac9e24a8142a); a plain write run produced the same sha. Mid-animation frame saved.
- LOW-1 fixed: DESIGN.md roll-strip row now points at `draw-steel-elements/docs/settings.md` (Rolling). Superproject: 4 DESIGN.md commits + this fix + pointer bump; other 7 pins equal origin/main's.
- Battery: tsc/lint clean · jest 5633 passed / 1 skipped / 234 of 235 (develop 5607 + 26) · lifecycle 31/31 · e2e 95/98 ok, 0 failed, 3 known-bug, 66/66 · shots x2 592 ok, 0 FAIL, text-scale lines OK, new modal line OK · freeze exactly the 2 roll print mismatches of 280 · parity 0/0/24.
- Rebaseline: hashes UNCHANGED (84eaaf74…, 16d5edbd…); `sc279-rebaseline.txt` untouched, no pre-r8b backup needed. Substituted-baseline copy: 280/280 OK. All 592 PNGs identical run1 vs run2.

## GIF command and frame
- Command (devbox script file, run from the worktree): `npm run docs-shots -- --only=feature-roll.gif --check-stable --browser-only` (check only; "nothing written to docs/Media"), then `npm run docs-shots -- --only=feature-roll.gif --browser-only` to write (the check mode never writes). Logs `sc279-r8b-docsgif.log`, `sc279-r8b-docsgif-write.log`. GIF: 378371 bytes (old 383635), 3 frames at 1500/1800/1800 ms, 1632x2968.
- The manifest entry needed no edit: its `button.dse-roll-btn` clicks still match the card's dice icon (first click rolls and reveals the collapsed strip; second click rolls again). `docs/Features.md` text ("the dice button … rolls too: the result appears under the tiers") is still accurate and unchanged.
- Evidence frame: `sc279-r8b-evidence/feature-roll-frame.png` = GIF frame 1 (after the first roll), cropped (0,1100)-(1632,2000) and halved to 816x450 so it lines up with the reviewer's `sc279-r9-logs/f-01-mid.png` (power-roll header at the top, crit row at y~236). It shows the "Roll" button + collapsed "Modifiers  Might 0" row where the old crop showed the unlabelled stepper row.

## Gates (DSE edb90d2, base ea56712)
| gate | result |
|---|---|
| tsc (incl `-p e2e`) | exit 0, clean |
| lint | exit 0, 0 errors |
| jest (pre-shots / post-shots) | 5633 passed / 1 skipped / 234 of 235 suites (5634 total), both times |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 95/98 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` |
| shots run 1 / run 2 | 592 ok, 0 FAIL each; exit 0 |
| freeze (both runs) | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`: roll--steel-print.png, roll--steel-realprint.png only (of 280) |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |

New in-run line (both runs): `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons: every sampled property is identical with and without Obsidian's `button` rules; user-select and -webkit-app-region are excluded by design)`.
Other in-run lines: `host-copy pin OK (6 button-reaching rules + 14 tokens …)`; `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)`; `text scale OK (1626 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal, on 5 chrome surfaces (…) and in both print surfaces; …)`; `text scale once OK (107256 comparisons over 214 loads: … 5 chrome surfaces included; 100s)` in run 1 and `107259 comparisons over 214 loads` in run 2 (count differs by 3 between runs on the unchanged tree; 0 violations both times; looks like a timing-dependent visibility count in the gate, not a pixel difference).

## Rebaseline
- Two shots runs: all 592 PNG hashes identical. Roll print hashes `84eaaf74619e81094660de1896743d315ac9db817168affbe0d7552f97fcefd3` (print) and `16d5edbd61b330c9ac69cd52917dee575928905ab0363280a8fe6d3fc6b709c5` (realprint) are byte-identical to `sc279-rebaseline.txt` (`cmp` clean). Unchanged, so no `sc279-rebaseline.pre-r8b.txt` was made. `freeze-baseline.sha256` untouched.
- Substituted-baseline copy (scratch): `sha256sum -c` 280 OK, exit 0 (`sc279-r8b-freeze-substituted.log`).
- vs the r8 round: all roll shots byte-identical; the only two PNGs that moved are `montage-sheet-log--steel-dark.png` and `--steel-light.png` (not frozen; develop's SC-356 change, not ours). The r8 evidence set (`sc279-r8-evidence/`, all identical to r4) stands; the probe-based g/h crops were not re-run, but every roll shot they are built beside is unchanged.

## Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/`)
`sc279-r8b-{docsgif,docsgif-write,tsc,lint,jest1,jest2,lifecycle,e2e,shots1,shots2,freeze1,freeze2,freeze-substituted,parity}.log` (+ `.exit` for the gate logs); `sc279-r8b-evidence/feature-roll-frame.png`; the GIF itself `draw-steel-elements/docs/Media/feature-roll.gif` in the worktree (commit edb90d2). Scratch: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r8-impl/` (`r8b-allhash-run{1,2}.txt`, `r8b-frame1-full.png`).

---

# r8c round (2026-10-22): once-gate dice pin (LOW-1), rebase onto 424f47b, full battery

## Executive summary
- STATUS: DONE. One base for every gate: DSE `4636cc876483fb134142e5f5f3e0310845b7afe8` on `origin/develop` `424f47b9e8a4c2d162620c41cd6a8e96d44ae45c` (SC-361; re-fetched after the last gate, unchanged). Superproject `29274c5` on `origin/main` `89bd3454e161c258241936c3b8f4f49c27ec4518`. Not pushed.
- LOW-1 fixed in `a76fd1e` (rebased to the head above): the once-gate page entry for interaction shots now carries `fixedDice: n.fixedDice`, and after `loads += 1` it pins `Math.random = () => 0.5` only when the entry has `fixedDice`, the way `snap()` does. Measurement code untouched.
- The once-gate count is now IDENTICAL across the two shots runs (107256 comparisons over 214 loads both; r8b drifted 107256 vs 107259).
- Rebases: DSE clean (SC-361's styles-source.css / shoot.mjs overlaps auto-merged); superproject clean. Pointer bump re-made; the other 7 pins equal origin/main's. (develop moved 3973b56 -> 424f47b before the battery started; origin/main moved once more after the gates, only superproject-side, DSE pin still 424f47b, so the superproject was re-rebased and re-bumped with no DSE change.)
- Battery: tsc/lint clean · jest 5729 passed / 1 skipped / 238 of 239 (develop 5703 + 26) · lifecycle 31/31 · e2e 96/99 ok, 0 failed, 3 known-bug, 66/66 · shots x2 592 ok, 0 FAIL · freeze exactly the 2 roll print mismatches of 280 · parity 0/0/24.
- Rebaseline hashes UNCHANGED (84eaaf74…, 16d5edbd…), `sc279-rebaseline.txt` untouched; substituted-baseline copy 280/280 OK; all 592 PNGs identical run1 vs run2.

## Gates
| gate | result |
|---|---|
| tsc (incl `-p e2e`) / lint | exit 0 / exit 0, 0 errors |
| jest (pre- and post-shots) | 5729 passed / 1 skipped / 238 of 239 suites (5730 total), both times |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 96/99 ok, 0 failed, 3 known-bug, coverage: 66/66 pairs` (run under host load ~21; no timeouts) |
| shots 1 and 2 | 592 ok, 0 FAIL each; no ALLOWLISTED line |
| freeze (both runs) | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`: roll--steel-print.png, roll--steel-realprint.png only (of 280) |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |

In-run lines, shots run 1 (run 2 identical apart from the elapsed seconds): `host-copy pin OK (6 button-reaching rules + 14 tokens …)`; `button host-leak OK (113 button kinds × 3 states … = 678 comparisons …)`; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds × 3 states (rest/hover/focus-visible) × dark/light = 228 comparisons …)`; `text scale OK (1626 comparisons: small/large/control at 80% and 120% on an element root, in a real DseModal, on 5 chrome surfaces (…) and in both print surfaces; …)`.
Once-gate lines (the part before the elapsed time is byte-identical):
- run 1: `text scale once OK (107256 comparisons over 214 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 108s)`
- run 2: `text scale once OK (107256 comparisons over 214 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 75s)`

## Rebaseline
Roll prints `84eaaf74619e81094660de1896743d315ac9db817168affbe0d7552f97fcefd3` (print) and `16d5edbd61b330c9ac69cd52917dee575928905ab0363280a8fe6d3fc6b709c5` (realprint): `cmp` clean against `sc279-rebaseline.txt`, so no `.pre-r8c` backup. `freeze-baseline.sha256` untouched (mtime still Oct 21 13:26). `sc279-r8c-freeze-substituted.log`: 280 OK, `sha256sum -c exit 0`.

## Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/`)
`sc279-r8c-{tsc,lint,jest1,jest2,lifecycle,e2e,shots1,shots2,parity}.log` (+ `.exit`), `sc279-r8c-freeze1.log`, `sc279-r8c-freeze2.log`, `sc279-r8c-freeze-substituted.log`. Scratch hashes: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r8-impl/r8c-allhash-run{1,2}.txt`.

---

# r8d round (2026-10-22): rebase onto e4c5cf6 (SC-433), full battery

## Executive summary
- STATUS: DONE. One base for every gate: DSE `c0e761b4f96d435c505c5ec3bc211d91bd72ceb0` on `origin/develop` `e4c5cf6a69174f105a4de38907d772057eb71e7d` (re-fetched after the last gate: unchanged). Superproject `42116f9` on `origin/main` `acaa6f4f473f6ff093d8d32728237a48be196d95`. Not pushed.
- Rebases clean (no conflicts). Range-diff `424f47b..4636cc8` vs `e4c5cf6..c0e761b`: all 11 commits `=` (identical patches): `sc279-r8d-range-diff.txt`.
- Superproject re-rebased after origin/main moved again to acaa6f4 (DSE pin on it still e4c5cf6); pointer bump re-made to c0e761b; the other 7 pins equal origin/main's.
- Battery: tsc/lint clean · jest 5737 passed / 1 skipped / 238 of 239 (develop 5711 + 26) · lifecycle 31/31 · e2e 101/101 ok, 0 failed, 0 known-bug, 66/66 · shots x2 592 ok, 0 FAIL, no ALLOWLISTED · freeze exactly the 2 roll print mismatches of 280 · parity 0/0/24.
- Once-gate identical in both runs: `107256 comparisons over 214 loads`. Rebaseline hashes UNCHANGED (84eaaf74…, 16d5edbd…); substituted baseline 280/280 OK; all 592 PNGs identical run1 vs run2.
- A session-limit 429 interrupted the round after e2e; tsc/lint/jest1/lifecycle/e2e logs were verified from disk (exit 0, expected lines) and kept; everything from shots1 on ran afterwards on the same tree (clean, head c0e761b).

## Gates
| gate | result |
|---|---|
| tsc (incl `-p e2e`) / lint | exit 0 / exit 0, 0 errors |
| jest (pre- and post-shots) | 5737 passed / 1 skipped / 238 of 239 suites (5738 total), both times |
| lifecycle | `OBSIDIAN-LIFECYCLE done: 31/31 ok, 0 failed` |
| e2e | `OBSIDIAN-E2E done: 101/101 ok, 0 failed, 0 known-bug, coverage: 66/66 pairs` |
| shots 1 and 2 | 592 ok, 0 FAIL each; no ALLOWLISTED line; `modal button host-leak OK (10 modal scenarios over 9 modal classes, 38 button kinds … = 228 comparisons …)`; `button host-leak OK (113 button kinds … = 678 comparisons)`; `text scale OK (1626 comparisons …)` |
| freeze (both runs) | `FREEZE VIOLATED (2 checksum mismatches, 0 missing)`: roll--steel-print.png, roll--steel-realprint.png only (of 280) |
| parity (last) | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, exit 0 |

Once-gate: run 1 `text scale once OK (107256 comparisons over 214 loads: every visible element in every stamped root scales by exactly 1 or exactly 1.2 per knob, on screen and the print twin, control never on paper, 5 chrome surfaces included; 77s)`; run 2 identical but `80s`.

## Rebaseline
Roll prints `84eaaf74619e81094660de1896743d315ac9db817168affbe0d7552f97fcefd3` (print) and `16d5edbd61b330c9ac69cd52917dee575928905ab0363280a8fe6d3fc6b709c5` (realprint): `cmp` clean against `sc279-rebaseline.txt`; no `.pre-r8d` backup. `freeze-baseline.sha256` untouched (mtime Oct 21 13:26). `sc279-r8d-freeze-substituted.log`: 280 OK, `sha256sum -c exit 0`.

## Artifacts (ledger dir `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc279-roll-ux/`)
`sc279-r8d-{tsc,lint,jest1,jest2,lifecycle,e2e,shots1,shots2,parity}.log` (+ `.exit`), `sc279-r8d-freeze1.log`, `sc279-r8d-freeze2.log`, `sc279-r8d-freeze-substituted.log`, `sc279-r8d-range-diff.txt`. Scratch hashes: `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc279-r8-impl/r8d-allhash-run{1,2}.txt`.
