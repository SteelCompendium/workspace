# SC-509 r3: independent adversarial review (reviewer C)

## Executive summary
- **Verdict: LAND-READY** (on a426882; the landing must rebase onto dse develop 38f94f4 and superproject main 2bb85df, see INFO-5).
- Findings: 0 HIGH, 0 MEDIUM, 2 LOW, 8 INFO. Neither LOW blocks landing.
- Red/green re-measured. The new jest tests on 7046eb0 source: 5 fail, the control passes. G-S40 against a **7046eb0** bundle FAILs (`montage: the card still reads "…The Heist…", not "Other Job"`) and passes on HEAD.
- Mutants: 9 of 9 killed (drop the flag, Reading host always tickets, sidebar always keeps lastWritten, inverted caller/hosts, `=== false` / `!== false` variants).
- Real Obsidian 1.15.0, HEAD vs 7046eb0 bundle (same probe): Reading montage, counter and stamina, twins, `collapsed:`+`prefs:` block, the sidebar panel and **hero "Edit definition"** are all stale on base and redraw on HEAD with claims +0 and a fresh root. Live Preview is fine on both. In-card clicks still adopt the same root (claims +1, tickets 0).
- Battery on a426882: tsc/lint rc 0 · jest **6032 passed / 1 skipped / 244 of 245** (first run: 1 load timeout at loadavg 23 in an unrelated suite; that suite re-ran green and the full re-run was green) · lifecycle **37/37** · e2e **114/114 ok, 0 failed, 0 known-bug, 79/79 pairs** · shots **592, 0 FAIL** (113/678, 10/9/38/228) · freeze **280/280** · parity **0/0/24**.
- LOW-1: after a form Save, keyboard focus falls to `<body>` (on base it returned to the pencil). LOW-2: G-S40 never checks the note text outside the block (my probe did: byte-exact).

## 0. Tree, method, cleanup
- Review worktree `/home/scott/code/steelCompendium/worktrees/sc509-form-save-refresh` (dse a426882 = dac643f red, 731f3e1 fix, a426882 G-S40, on 7046eb0; superproject d93f8d3 on f007a2a). `git status --porcelain` (dse, plus `--ignored`) and the superproject status were identical before and after (superproject ` M draw-steel-elements` both times: the pointer is not bumped, as expected).
- All probing ran in two scratch worktrees under `…/scratchpad/sc509-r3-review-C/`: `base` (7046eb0) and `head` (a426882). Both are now removed with `git worktree remove`; `worktree list` shows only the review worktree. Nothing was edited in the review worktree. Gates were run there, which rewrote only ignored build outputs.
- Real-Obsidian probe: a scenario `ZZ-R3C` (`sc509-r3-real-probe-scenario.mjs.txt`) loaded by a scratch copy of HEAD's lifecycle harness. It runs real hover and real click on the pencil and on Save, with a JS click fallback where the hover reveal is flaky (Live Preview, the tall note). It ran once with the HEAD bundle and once with `DSE_LIFECYCLE_BUNDLE` = the 7046eb0 build (port 9353).

## 1. Red/green (re-run, not trusted)
| Check | 7046eb0 | a426882 |
|---|---|---|
| jest `formSaveRedraw` + `sidebarBlockHost` | **5 failed** (montage, counter and stamina redraw; the sidebar panel; the sidebar host unit test), 59 passed; the in-card adoption control passes | all pass |
| lifecycle `--only=G-S40` (HEAD harness) | `G-S40 FAIL: montage: the card still reads "Montage TestThe Heist0 heroes …", not "Other Job"` (rc 1, shot saved) | `G-S40 ok` (in the full 37/37 run) |

## 2. Mutation probes (run in the scratch worktree; tests: formSaveRedraw, sidebarBlockHost, element-view, pipeline, view-registry, view-adoption, dseSidebarView, sidebarChrome; control 185/185)
| Mutant | Result |
|---|---|
| M1 `flushPersist` drops `{ fromView: true }` | 16 failed (SC-509 control, SC-340 adoption suite, element-view/pipeline call-shape) |
| M2 ReadingModeBlockHost always tickets | 3 failed (montage/counter/stamina redraw) |
| M3 SidebarBlockHost always keeps `lastWritten` | 2 failed (host unit + panel test) |
| M4a caller passes `fromView: false` | 16 failed |
| M4b both hosts inverted | 26 failed |
| M4c Reading host inverted | 17 failed |
| M4d Sidebar host inverted | 9 failed |
| M5 sidebar clears only on `=== false` | 2 failed |
| M6 Reading tickets unless `=== false` | 3 failed |

## 3. Adoption contract and integrity probes
Jest (`sc509-r3-jest-probe.test.ts.txt`, real processor + real FormModal; HEAD vs 7046eb0):
- P1: content above and below survives a form save byte for byte (HEAD and base).
- P2: two different counters in one note. Save A; B keeps its root and text; Increase on B writes only B and adopts (claims 1). Base: A stays stale.
- P2b/P2c: identical-body twins. Saving the first or the second changes only that block.
- P3: a hand edit after a form save renders fresh ("Third Thing", claims 0). Base: fails (stale).
- P4: form save, rebuild, then 3 rapid Increases on the new card give **2 vault writes in total** (form + one coalesced). The rebuild adopts the same root, claims 1, tickets 0 after.
- P5b: Increase flushes and adopts, then the form opens with the current body (`current_value: 4`) and Saves; both land, the card is fresh, tickets 0.
- P6: a Save after the block was deleted by hand writes nothing, leaves no ticket, and the form stays open.
- P7: SC-494 interplay. A block with `prefs:` + `collapsed: true` keeps both keys and the order `prefs:` → `collapsed:` → body. The fresh card shows the new title and is still collapsed (`data-dse-collapsed="on"`), claims 0. Base: stale.
- P8: collapse and expand write nothing to the note (0 `vault.process`). See INFO-3.

Real Obsidian (`sc509-r3-real-probe-{head,base}.json`):
| Case | HEAD | 7046eb0 |
|---|---|---|
| Reading montage / counter / stamina | new content, old root gone, claims +0, tickets 0, note byte-exact (ABOVE/BELOW intact) | old content after 6 s, same root, claims +1 |
| Counter: form Save, then Increase on the card | Save kept (`name: Wounds`), click `current_value: 4`, **same root, claims +1**, tickets 0 | **the click overwrote the Save** (`formKept:false`); the card still reads "Health" |
| Twins (save A, then click B) | A "Gamma" (fresh), B same root, click adopts (+1), note integrity ok | A still "Alpha" |
| Hand edit after Save | redraws ("Third Thing") | redraws |
| `prefs:` + `collapsed: true` block (expand first: a collapsed card has no reachable pencil) | new content, keys kept, claims +0 | stale |
| Collapse, then expand | 0 modify events, same root, note unchanged | same |
| Reading scroll (tall note, card parked mid-view) | scrollTop 1956 / card top 602, identical before the Save, after the Save and after the in-card click | identical |
| Live Preview Save | redraws, claims +0 | redraws (unaffected, as r1 found) |
| Live Preview scroll (tall note) | scrollTop 2490 / card top 549 held across the Save | held |
| Outside write in the same tick as Save | one "not saved — the block changed on disk first" Notice, tickets 0, the outside text wins | same |
| **Hero "Edit definition"** (`hero/view.ts:257`) | **redraws** ("Brakka Ironhide"), old root gone, claims +0, `state:` kept | **stale** ("Torin Stonefist"), claims +1 |
| Sidebar: Save from the panel's pencil, then Increase in the panel | panel redraws in place (same root, the `update()` fast path), note card fresh, anchor kept; the click lands, same panel root, 1 modify, the Save kept | panel stays "Health"; the click **overwrote the Save** |
| Notices / page errors | none (except the deliberate dropped-write case) | — |

## 4. Callers and type check (brief item 6)
- `replaceSource` callers in `src`: `view.ts:325` (passes `{ fromView: true }`) and `FormModal.ts:464` (no options: correct). Implementers: Reading (`:541`), Sidebar (`:302`), Live Preview (`:59`, signature only). Inline `BlockHost` literals (`FormModal.ts:441` preview host, `SettingsPreview.ts:266`, `visual-harness/entry.ts:2142`) take fewer parameters, so they stay assignable. `tsc` (src + e2e) is clean. No other code writes through a host (`encounter/view.ts:458` and `sidebar/registration.ts:257` call `vault.process` directly and never had tickets).

## Findings

### LOW-1: keyboard focus falls to `<body>` after a form Save (was: back on the pencil)
- Where: `src/framework/host/ReadingModeBlockHost.ts:578-579`. By design, the form write now earns no ticket, so the section is rebuilt fresh. Obsidian's modal close restores focus to the element that opened it, which is the pencil in the old root. That root is now detached (`FormModal.ts:464-465` closes after the write).
- Scenario, measured in real Obsidian: focus the pencil, open the form, Save. HEAD: `document.activeElement` is `BODY` (`insideCard:false`). 7046eb0: the pencil `Edit Montage Test tracker` (`insideCard:true`). A keyboard user's next Tab starts again at the top of the note.
- Note: base kept focus only because it kept the stale card. A fresh redraw after an outside edit behaves the same way. Experimental feature.
- Prescribed fix (follow-up ticket, not in SC-509): after a non-view write's rebuild, put focus back on the re-mounted card. For example, FormModal records the block key and its opener before closing, and the pipeline's mount focuses that key's root or pencil once if a pending restore hint matches. Alternatively accept and document it.

### LOW-2: G-S40 never checks the note outside the block
- Where: `visual-harness/obsidian-lifecycle.mjs:2497-2518` (Reading loop) and the sidebar phase. The fixtures carry `ABOVE`/`BELOW`, but the scenario only checks `includes(newValue)` on disk.
- Scenario: a regression that splices the form body at the wrong line, or eats a neighbour line, would pass G-S40. The ticket names this risk ("this writes into user files").
- Measured: on HEAD, `diskExact:true` for every case in my probe, so the product is fine. This finding is a gate gap only.
- Prescribed fix: per note, `t.expect(t.read(rel) === FIXTURES[rel].replace(old, new), …)` (stamina: `current_stamina: 15` → `7`), or `t.integrity(rel).ok`.

### INFO-1 (pre-existing, also on base): a form opened during the 400 ms debounce starts from a stale body
- Where: `pipeline.ts:577-578` (`currentBody = host.lastKnownBody ?? source`) ignores the view's unflushed model.
- Scenario (jest P5c, human pace): Increase, then open the pencil within 400 ms. The form shows `current_value: 3`. The debounce writes 4 while the form is open. Save writes `current_value: 3` and silently reverts the click. Identical on 7046eb0; HEAD at least shows the truth on the card.
- Fix (follow-up ticket): `openFormEditor` flushes the owner view's pending persist (or seeds from `serialize(view.model)`) before reading the body.

### INFO-2 (pre-existing, not human-reachable): a view write pending across a form Save overwrites it
- Scenario (jest P4b/P5): a click on the old card in the milliseconds before Obsidian's rebuild, or a click still inside its debounce when Save lands (the flush-on-unload of the released view). The view's stale model overwrites the Save, on base and on HEAD alike. The modal covers the card and the rebuild comes about 5 ms after `modify`, so no person can hit this. No action.

### INFO-3: the brief's premise that "collapse/expand is a view write" is false
- `mountChrome.ts:260` stores collapse state in the session store only. Real Obsidian: 0 modify events, same root, note unchanged; jest: 0 `vault.process`. There is nothing to adopt, and nothing changed.

### INFO-4: a collapsed card has no reachable pencil
- While a card is collapsed its panel is suppressed (SC-169 ruling 4): `pencilLaidOut:false` with `collapsed: true`. After the user expands it (session state) and Saves, the fresh card stays expanded and the note keeps `collapsed: true`. That is the same as base and is session-over-authored by design.

### INFO-5: the base has moved
- dse `origin/develop` is now **38f94f4** (SC-500: 31c1778, 4f7aba6, 38f94f4; files are disjoint from SC-509). `git apply --check` of `7046eb0..a426882` on a 38f94f4 tree is clean. Focused jest (formSaveRedraw, sidebarBlockHost, element-view, pipeline, view-registry, view-adoption, e2eCensus): 166/166.
- Superproject `origin/main` is **2bb85df** (the CHANGELOG commit d93f8d3 sits on f007a2a).
- The landing rebases both and re-runs the battery. e2e coverage should read 82/82 after SC-500.

### INFO-6: dse-verify SKILL.md still reads 36/36 and has no G-S40 entry
- Dispatcher bookkeeping at landing (FU2).

### INFO-7: G-S40 waits on fixed sleeps
- G-S40 uses fixed sleeps (`:2512` 500 ms, `:2531` 1000 ms, `:2561` 1000 ms) as windows for negative checks, such as "a late adoption would have put the old root back". These do not race Obsidian to make a pass, so the SC-478 r4 rule is not broken in spirit. A base bundle still fails fast through the 8 s `waitText` deadline.

### INFO-8: hero "Edit definition" (FU1) works in real Obsidian, but no test drives it
- Measured: fixed on HEAD, stale on base (table above). No ticket is needed under the owner's FU1 ruling. Optional: add a hero case to G-S40 (the fixture in `sc509-r3-real-probe-scenario.mjs.txt` renders with no compendium).

## Gate numbers (a426882, review worktree)
- tsc rc 0 (`tsc --noEmit && tsc --noEmit -p e2e`, no output). lint rc 0 (`eslint src main.ts e2e`, only the known `.eslintignore` warning).
- jest run 1 (loadavg 23): `Tests: 1 failed, 1 skipped, 6031 passed, 6033 total`. The failure was `initiative-default-keys.test.ts:459`, "Exceeded timeout of 5000 ms" (load). That suite alone: `25 passed`.
- jest run 2 (after shots): `Test Suites: 1 skipped, 244 passed, 244 of 245 total` · `Tests: 1 skipped, 6032 passed, 6033 total` (rc 0).
- lifecycle (port 9352): `OBSIDIAN-LIFECYCLE done: 37/37 ok, 0 failed` (534 s).
- e2e: `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 79/79 pairs` (rc 0).
- shots rc 0 (804 s; it outran the 600 s foreground limit and the harness moved it to the background; I read its own exit): 592 PNGs, no FAIL. Lines read: `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (10 … 9 … 38 … 228 …)`, `host-copy pin OK`, and the expected `OBSIDIAN APP.CSS PIN DRIFT` warning.
- freeze: `freeze OK (280/280 frozen print PNGs byte-identical …)`; the baseline was not touched.
- parity rc 0: `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Artifacts (all in /home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc509-form-save-refresh/)
- Report: `sc509-r3-review-report.md`
- Gate logs: `sc509-r3-{tsc,lint,jest,jest-initdk-rerun,jest2,lifecycle,e2e,shots,freeze,parity}.log`
- Red/green: `sc509-r3-red-base-jest.log`, `sc509-r3-gs40-base7046eb0.log`, `sc509-r3-gs40-base7046eb0-FAIL.png`
- Mutants: `sc509-r3-mutants-summary.txt`, `sc509-r3-mutants.sh.txt` (per-mutant logs in scratch `…/sc509-r3-review-C/logs/r3c-mut-*.log`)
- Jest probes: `sc509-r3-jest-probe.test.ts.txt`, `sc509-r3-probe-head.log`, `sc509-r3-probe-base.log`, `sc509-r3-probe2-head.log`, `sc509-r3-probe2-base.log`
- Rebase check: `sc509-r3-tip38-focused.log`
- Real Obsidian: `sc509-r3-real-probe-scenario.mjs.txt`, `sc509-r3-real-probe-head.json`, `sc509-r3-real-probe-base.json`, screenshots `sc509-r3-head-*.png` and `sc509-r3-base-*.png` (14 each: reading-montage, reading-counter, reading-stamina, twins, hand-edit-after-save, reserved-collapsed-before, reserved-keys, reading-scroll, moved-before-save, hero-edit-definition, live-preview, lp-scroll, sidebar-after-save, sidebar-after-click)
