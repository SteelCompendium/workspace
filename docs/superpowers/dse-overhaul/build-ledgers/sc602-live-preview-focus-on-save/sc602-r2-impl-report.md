# SC-602 r2 implementation report (implementer I1)

**Executive summary**
- STATUS: DONE. dse branch `sc602-live-preview-focus-on-save` HEAD `2848e7eb`, rebased onto origin/develop `93e8e48c` (clean). Commits: `19a50c78` feat, `67b7a558` jest, `12a9ab17` e2e, `2848e7eb` docs. (Pre-rebase shas: dfdf3674, 06cb1436, a1b239ea, a89aba8d.)
- Superproject `6b0f9a7e` on workspace origin/main `eccfe90e` (CHANGELOG only; one CHANGELOG conflict with SC-580's entry, resolved by keeping both). dse pointer bump left UNSTAGED.
- Gates at 93e8e48c base: tsc (incl. e2e) and lint clean; jest 10771 passed / 2 skipped (10746 + 25 new; one run, no timeouts); lifecycle 60/60 (21+16+9+4+7+3); e2e `299/302 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`; styles.css sha256 `5e5ff4884e05fb2a34b0acb84325483a240e67f0aab11f4869e4ccad1dfc2b27`, no CSS source differs from origin/develop, so shots/freeze/parity carry (skipped).
- Vacuity (run at 622b0904, product files identical after the rebase): e2e with the five product files reverted `4/14 ok, 10 failed` (INIT-L01..L05, L07, CTR-L01/L03/L05, CALL-L04 red; INIT-L06, L08, CTR-L02, L04 green). jest: 10 single-line mutations each turn the matching tests red (table below); guards stay green.
- LP embed probe: base and branch identical. Focus stays on the embedded counter's `+` (`counter.inc@embed/LP+ring`) the whole time, no focus loss at all; the write landed (`current_value: 2`).
- Deviations from the design: none in the product code. Additions: CALL-L04 (the design's "optional, recommended" callout case), driver helper `dse.focusByScript`. The five implementer adjustments are all in.
- No SC-607 / SC-580 / SC-583 file touched (`ReadingModeBlockHost.ts`, `hoverLinks.ts`, `lineMap.ts`, `obsidian-lifecycle.mjs`, `ConditionsModal.ts`). No CSS. No lifecycle scenario.

## 1. Product (commit 19a50c78)
Prototype diff applied as is, plus the five adjustments:
1. Nested-element line dropped from `carryOwnSaveFocus`.
2. Disabled successor falls back to the root (`found.matches(':disabled')` in the `find` branch of `claimChromeFocus`).
3. `item: ''` is the named constant `NO_CHROME_ITEM` in `focusHandoff.ts`.
4. `blockKey()` format pinned in jest (below).
5. Funky-logic comment at the top of `livePreviewFocusCarry.ts` (release happens inside Obsidian's StateField before the DOM update; cross-references `focusHandoff.ts` / SC-518), plus a table row and a paragraph in `.repo-docs/architecture.md`.
Also: the ViewPlugin handler is exported as `onEditorUpdate(u, registry)` so jest can call it (design §6).

## 2. jest (commit 67b7a558): +25 tests
- NEW `test/dom/framework/livePreviewFocusCarry.test.ts`, 19 tests: J1 successor (2nd of 3) + ring options; no-ring press restored without forcing a ring; Reading/sidebar roots never armed; mouse/no-focus/other-root arms nothing; no ticket and stale ticket; one write arms once; twin keyed by `lastWriteLineStart` (`::13` does not take focus, `::4` does); null `lastWriteLineStart` keyed by live key; one-shot; focusin elsewhere cancels; scope (other pane); focus not free; successor gone -> root `tabindex=-1`; successor `:disabled` -> root and request spent; detached root claimed once connected; `ViewRegistry.release` hook integration (focus still on the old control, throwing hook does not stop release); editor update arms the twin case; editor update guards (selection-only, focus outside, released entry, no focus); `blockKey()` format `/::\d+$/` and `Note.md::ds-counter::6`.
- `view-registry.test.ts` +1 (`beforeRelease`: once, before `released` flips and the view unloads, `(entry, reason)`, throwing hook tolerated, not called again).
- `controlFocus.test.ts` +2 (`controlSuccessor`: nth / last / root / family map / null family; pure, never focuses, no tabindex).
- `register-framework-elements.test.ts` +1 (extension registered with the plugin, built on the returned registry; `registry.beforeRelease` set).
- `chromeFocusHandoff.test.ts` +2 (`armSuccessorFocus`: claims through `find` and is spent; root with a detached root waits for connection).

Mutation results (5 touched test files, 85 tests; each mutation reverted afterwards, `git status` clean):

| Mutation | Red |
|---|---|
| M1 `carryOwnSaveFocus` returns false at once | 12 (guards green) |
| M2 key by live `blockKey()` | 2 (twin tests) |
| M3 one-shot -> `SETTLE_MS` extension | 3 |
| M4 `release()` skips `beforeRelease` | 2 |
| M5 disabled successor not replaced by root | 1 |
| M6 tickets never marked used | 1 |
| M7 `.cm-content` check dropped | 1 |
| M8 registration lines removed | 1 |
| M9 ticket freshness dropped | 1 |
| M10 editor update ignores `docChanged` | 1 |

Full revert of the five product files: 5 individual tests red plus the new file and `register-framework-elements` suites fail to load (cannot import the missing module); 54 passed.
Logs: `mutations.txt`, `jest-vac-revert.log`.

## 3. e2e (commit 12a9ab17): 14 new tests
- `e2e/specs/initiative/focus-live-preview.e2e.ts`: INIT-L01..L08.
- `e2e/specs/counter/counter-focus-live-preview.e2e.ts`: CTR-L01..L05.
- `e2e/specs/callout/callout-writes.e2e.ts`: CALL-L04.
- `e2e/manifest/counter.ts`: `counter.inc` `press:Enter` + `click` (adds 2 pairs, 172 -> 174).
- Fixture `e2e/vaults/shipped/Counter/twins.md` and `e2e/README.md` row.
- Driver helper `dse.focusByScript(el)` (records no coverage; `press` still requires real focus).
- All 14 green on the branch (14/14, run on 622b0904 and the full run on 93e8e48c). 10 red on base.

## 4. Gates at 93e8e48c (all in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc602-r2-implementer/`)
- tsc/lint: `tsc.log`, `lint.log` (rc 0, 0 errors).
- jest: `jest-full.log`: Suites 267 passed + 1 skipped; Tests 10771 passed, 2 skipped (59.8 s).
- e2e: `e2e-full.log`: `299/302 ok, 0 failed, 3 known-bug, coverage: 174/174 pairs`, rc 0, 140 s.
- lifecycle: `life1.log` 21/21 185 s; `life2.log` 16/16 326 s; `life3.log` 9/9 406 s; `life4.log` 4/4 299 s; `life5.log` 7/7 391 s; `life6.log` 3/3 230 s. (A first part-1 run started at the old base was stopped by task id when the rebase request arrived; no process left in the worktree.)
- styles.css: sha256 above. The diff vs origin/develop contains no `.css` file and `styles-source.css` is untouched (a separate clean build of 93e8e48c was not done; source identity used instead).

## 5. LP embed probe (report-only)
Probe: `![[Counter/counter]]` in a note open in Live Preview, `counter.inc` of the embed focused by script, real Enter. Sampler every 5 ms, 2.5 s of settle.
- Base (622b0904 product): `counter.inc@embed/LP+ring` at start, one sample only, same at the end; embedded note `current_value: 2`.
- Branch: identical.
- Meaning: the embed's own save does not discard its focused control, so nothing needs fixing and the carry does not interfere. Probe files were scratch and removed (`probe-base.jsonl`, `probe-branch.jsonl`, `probe/` in the scratch folder).

## 6. Docs
- dse `CHANGELOG.md`: [FIX] bullet at the top of 7.0.0 (SC-602 wording, names SC-605 and SC-384 as not covered).
- dse `.repo-docs/architecture.md`: host-table row + paragraph "Keyboard focus across an own save in Live Preview (SC-602)".
- Superproject `CHANGELOG.md` (in the worktree): Unreleased entry, same wording. Conflicted with SC-580's entry on rebase; both kept, SC-602 first.

Drive-by fixes: none.

Follow-ups:
- The SC-609 CHANGELOG entries (dse and workspace) still say "In Live Preview focus is still lost when the note saves a moment later (SC-602)". Now stale once this lands; the owner may want a one-word edit at landing.
- `e2e/README.md` fixture table has no row for `Counter/counter.md` (pre-existing); only `Counter/twins.md` was added.
