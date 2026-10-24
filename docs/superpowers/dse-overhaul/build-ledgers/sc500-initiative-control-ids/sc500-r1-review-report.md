# SC-500 r1 independent review (R1)

**Verdict: LAND-READY.** No HIGH, no MEDIUM. 1 LOW (comment wording), 3 INFO.
- Reviewed dse `7046eb0..4f7aba6` (31c1778, 4f7aba6). `origin/develop` still `7046eb0` after fetch.
- No behaviour change: jsdom DOM serialization at base and tip differs in exactly 3 lines, each only the added `data-dse-control` attribute. No other chrome item gains an attribute, and there are 0 empty `data-dse-control=""`.
- Ids follow `<surface>.<control>[.<part>]` and collide with nothing. The manifest row shape matches its neighbours.
- E01/E03/E04 assert exactly as before (`toEqual` / whole-note `toBe`) and press the same elements.
- Coverage-gate mutant (drop the `init.reset-encounter.confirm` manifest row) made the full e2e fail with rc 1: `1 driven pair(s) are in no manifest`. Reverted.
- E04 hover: pre-existing. Base `7046eb0` E04 run alone fails the same way. The panel is `opacity:0; pointer-events:none` until `:hover`/`:focus-within`, so the hover is a real user precondition, not a mask. `dse.hover` duplicates nothing.
- Gates: tsc/lint rc 0; jest 6027/1/243 of 244; lifecycle 36/36; e2e 114/114 coverage 82/82 (second run; first run had 1 unrelated RECOV-R07 flake, Follow-up F1); shots 592/0 FAIL (host-leak counts unchanged); freeze 280/280; parity 0/0/24.

## Findings

### LOW-1 — the manifest comment says hover is optional, but the panel can't be clicked without it
`e2e/manifest/initiative.ts:11` says: "A chrome-panel item (the panel is also reachable by hover, but the item is always in the DOM)."
- In practice the panel is hidden (`styles-source.css:16812-16813` `opacity: 0; pointer-events: none`). It only shows on `[data-dse-chrome]:hover` / `:focus-within` (`:16840-16843`).
- Without the hover, `dse.click` times out: "still not displayed after 8000ms" (probe P2 below).
- **Failure scenario:** the next author reads "always in the DOM", writes a chrome-item scenario with no hover, and gets an order-dependent test: it passes in the full suite and fails alone. That is exactly the bug E04 had.
- **Fix:** reword it to say the item is always in the DOM, but the panel is hidden until the pointer is over the tracker or focus is inside it, so a scenario must `dse.hover(root.root)` (or Tab in) first.

### INFO-1 — `dse.click` can fall back to a CDP click; the old `press()` could not
`e2e/driver/dse.ts:309-329`: on a "not interactable / out of bounds" error, `dse.click` falls back to a CDP mouse press at the element's centre. Intercepted clicks are still rethrown.
- It is still a real hit-tested pointer event at the control's coordinates, so it cannot press a sibling silently. Every other pilot spec uses the same path.
- No action needed.

### INFO-2 — the real-Obsidian census does not scan the new controls
`e2e/specs/_census.e2e.ts:16` adds `initiativeManifest` ids to `ALL_IDS`. But CENSUS-04 only scopes `.dse-init__health`, `.dse-init__bar` and `.dse-init__cell`, and the chrome is excluded by design. So the turn overlay and ResetEncounterModal are pinned only by the new jsdom test (`test/dom/e2eCensus.test.ts:216-232`). This is within scope (ids + coverage only); see Follow-up F2.

### INFO-3 — `dse.hover` records no coverage
`dse.hover` (`e2e/driver/dse.ts:345-350`) records nothing. That is correct: a pointer move is not a manifest kind (`surface.ts` header lists click | click-disabled | dblclick | type | blur | press:<Key>). Nothing else in `e2e/driver` or `e2e/specs` does a pointer move except `cdpClick`'s internal `mouseMoved`, so it duplicates no helper.

## Checks against the brief

1. **No behaviour change.**
   - Kit path: `ChromeMenuItem.control` → `mountChrome.ts:230` → `iconButton()` → `stampControl()` (`kit/controlId.ts:14-16`, `if (id) el.setAttribute(...)`). `opts.control` is read only at `iconButton.ts:98`. There are no listeners, tabindex, classes, aria or text.
   - The portrait overlay and the modal footer (`managedModal.ts:88-92`) take the same `iconButton` path.
   - DOM probe P3 (jsdom, the real pipeline, TRACKER fixture plus an opened ResetEncounterModal): `diff dom-base.html dom-tip.html` shows exactly 3 changed lines, each only the added attribute (`init.hero.turn` on `.dse-init__portrait-toggle`, `init.reset-encounter` on the Reset encounter chrome item, `init.reset-encounter.confirm` on "Yes, Reset").
   - The other 4 chrome items (`expand`, `initiative-reset-turns`, `pin`, `collapse`) are unchanged. There are 0 `data-dse-control=""` (addendum 9).
   - The shots host-leak `tagButtons` key (`visual-harness/shoot.mjs:2306-2322`) uses classes, pressed/selected/disabled and the chrome surface. It never reads `data-dse-control`, so its counts cannot move from this change. No CSS selects on `data-dse-control`.
2. **Ids.**
   - They follow `controlId.ts:7` (`<surface>.<control>[.<part>]`) and sit beside `init.hero.stamina`, `init.cond.add` and `sedit.free-heal.confirm` (a confirm modal's button carries its owner's surface prefix).
   - A repo-wide grep finds each id only at its stamp site, the manifest, the spec, the driver `MODAL_KINDS` and the census test: no collision.
   - Ids are registered in `e2e/manifest/*.ts`, which `run.mjs:405-415` loads by readdir. There is no separate uniqueness test.
3. **Manifest rows.**
   - `surface('initiative', { controls: { id: c(['click'], ['SC-485','SC-500']) } })` has the same shape as `counter.ts` and `conditions-modal.ts`.
   - The surface name `initiative` matches conditions-modal's `reach.host: 'initiative'`.
   - Kinds equal what the spec drives (coverage.json: `init.hero.turn` click ← E01,E03; `init.reset-encounter` click ← E04; `init.reset-encounter.confirm` click ← E04).
4. **Assertions unchanged.**
   - E01 and E04 keep `expectNoteBlock(...).toEqual(...)` and E03 keeps `expect(after).toBe(before.replace(...))`, with `w.count` toBe 1 throughout.
   - Same elements, by DOM probe: old `HERO_TURN` = `.dse-init__group--heroes .dse-init__portrait-toggle`, which carries `init.hero.turn` (the only overlay; creature rows build none). Old `[data-dse-chrome-item="initiative-reset-encounter"]` is now the same node plus `init.reset-encounter`. Old `.modal-container button[aria-label="Yes, Reset"]` is now the same button inside `.dse-modal:has([data-dse-control="init.reset-encounter.confirm"])`, and `dse.modal()` asserts exactly one such modal.
   - The new path is stricter: `block()` scoping, plus exactly-one-modal.
5. **Coverage gate counts them.** Mutant M1 dropped the `'init.reset-encounter.confirm'` row from `e2e/manifest/initiative.ts`, then ran a full `npm run e2e`. Result: `114/114 ok, 0 failed, coverage: 81/81 pairs` followed by `coverage gate FAILED: 1 driven pair(s) are in no manifest: init.reset-encounter.confirm x click (INIT-DEF-E04)`, rc=1. Reverted with `git checkout --`. (I1 had already mutated ids → 0/3; this mutant covers the manifest-row arm.)
6. **Other controls left out.** No spec presses anything raw: no `$(`, and every `{ css: }` ref in `e2e/specs` is a read-only assertion target. The only unidentified siblings in the initiative chrome are "Reset turns (this round)" and ResetEncounterModal Cancel. Both are SC-516 and out of scope, so not reported again. The framework items (expand/pin/collapse) are framework chrome, excluded by design.
7. **Gates:** see below.
8. **E04 hover (addendum).** See the summary and probes P1/P2/B1. The base spec at `7046eb0`, run alone with `--only=INIT-DEF-E04`, FAILS with `element (".markdown-reading-view [data-dse-element="initiative"] [data-dse-chrome-item="initiative-reset-encounter"]") still not displayed after 8000ms`. So the order dependence predates SC-500 (it came from SC-485's raw `press()`, which did `waitForDisplayed` on a hidden panel and in the full suite relied on the pointer left over the tracker by E03). The hover fixes a latent test defect and masks nothing.
9. **Kit change for other consumers:** see check 1 (0 empty attributes; the other 4 chrome items are byte-identical).

## Gates (R1-measured, tip `4f7aba6`, rc from script files)

| Gate | Result | rc |
|---|---|---|
| tsc (incl. `-p e2e`) | clean | 0 |
| lint (incl. e2e/) | clean | 0 |
| jest | `Tests: 1 skipped, 6027 passed, 6028 total`; `Test Suites: 1 skipped, 243 passed, 243 of 244 total` (load 3→25) | 0 |
| lifecycle (port 9287) | `OBSIDIAN-LIFECYCLE done: 36/36 ok, 0 failed` | 0 |
| e2e full #1 (run 20261024-041405-b7b4) | `113/114 ok, 1 failed, 0 known-bug, coverage: 82/82 pairs`: RECOV-R07 `w.count` 2≠1 (load ~15), unrelated, F1 | 1 |
| e2e full #2 (run 20261024-041552-10f1) | `OBSIDIAN-E2E done: 114/114 ok, 0 failed, 0 known-bug, coverage: 82/82 pairs` | 0 |
| e2e full mutant M1 | `114/114 ok … coverage: 81/81` + gate FAILED (unmanifested) | 1 (expected) |
| shots | 592 PNGs, 0 FAIL lines. Same counts as CURRENT: `button host-leak OK (113 … 678 …)`, `modal button host-leak OK (10 … 9 … 38 … 228 …)`, input `164`, checkbox `60`, expected `OBSIDIAN APP.CSS PIN DRIFT`. The sweeps key on classes and state, not on `data-dse-control`, so these counts could not move | 0 |
| freeze | `freeze OK (280/280 frozen print PNGs byte-identical …)` | 0 |
| parity | `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)` | 0 |

## Probes (all reverted; dse tree clean after each)

- **M1:** removed the `init.reset-encounter.confirm` manifest row, ran full e2e (above). Reverted: `git checkout -- e2e/manifest/initiative.ts`.
- **P1:** tip, `--only=INIT-DEF-E04`: `1/1 ok`, rc 0.
- **P2:** tip with the `dse.hover(root.root)` line deleted, `--only=INIT-DEF-E04`: FAIL `element ("[data-dse-control="init.reset-encounter"]") still not displayed after 8000ms`, rc 1. Reverted: `git checkout -- e2e/specs/initiative/default-keys.e2e.ts`.
- **B1:** scratch `git worktree add --detach <scratch>/base-wt 7046eb0` (node_modules symlinked), `--only=INIT-DEF-E04`: FAIL (same not-displayed on the chrome item), rc 1. Worktree removed with `git worktree remove --force` + prune; the real node_modules was verified intact (700 entries).
- **P3:** DOM serialization probe (temporary `test/dom/sc500ReviewProbe.test.ts`, run singly at base (scratch worktree base-wt2) and at tip, then deleted). Diff = 3 attribute-only lines. base-wt2 was removed the same way.

## Follow-ups (owner's call to file)

- **F1 — RECOV-R07 flake under load** (`e2e/specs/stamina-bar/stamina-recoveries.e2e.ts:344-357`). Seen once in 3 full runs (load ~15): `expect(w.count).toBe(1)` received 2. The bundle's `events.json` shows notices n=49-51 (pop dec/inc/inc) and n=52 (Catch breath), then two `modify` events, n=53 and 54, both after the catch-breath mark. So the popover steps' debounced write flushed inside the catch-breath `waitForWrite` window. This is either a test race (no `waitWriteIdle` before the mark) or the product writes twice. Untouched by SC-500 (no stamina code in the diff). Bundle: `<scratch>/e2e-full-RECOV-R07-bundle/`.
- **F2 — the real-Obsidian census does not cover the initiative turn overlay or ResetEncounterModal** (INFO-2). Consider a CENSUS scope for `.dse-init__portrait` and the open reset modal, if/when initiative becomes a full pilot surface.

## Working-tree state

- Before: superproject ` M draw-steel-elements` (pointer unstaged, as the ledger records); dse clean at `4f7aba6`.
- After: identical (`git status --porcelain` re-checked). Untracked/ignored build artifacts (`main.js`/`styles.css`) were removed by the jest protocol `rm -f` and rebuilt by later gates.
