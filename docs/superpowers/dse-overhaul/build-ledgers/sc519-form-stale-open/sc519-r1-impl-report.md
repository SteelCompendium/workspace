# SC-519 r1 implementer report

## Executive summary
- STATUS: DONE (one extra finding, see "Sidebar" below; Live Preview not exercised in real Obsidian, see per-opener table).
- dse branch `sc519-form-stale-open`: red `3b760b8` -> fix `82aa704` -> G-S45 `1e97599` (on origin/develop c2758a2, unchanged). Superproject `9797d3c` (CHANGELOG only, dse pointer NOT bumped).
- Red->green: jest P5c repro failed at c2758a2 (`Expected substring: "current_value: 4"`, form body `current_value: 3`); green after fix. G-S45 FAILs on a c2758a2 bundle, ok on the fix.
- Gates on 1e97599: tsc + lint clean; jest 6074 passed / 1 skipped / 245 of 246 suites (after shots; 6073/2 before); lifecycle 38/38; e2e 123/123 ok, 0 failed, 0 known-bug, coverage 87/87; shots 592 PNGs, 0 FAIL; freeze OK (280/280); parity 0 gaps / 0 undeclared / 24 declared.
- Beyond the ticket: the SIDEBAR form was stale even with no pending write (it read the body the panel was first built from). Fixed in the same function; flagged for your ruling.

## Design
`ElementView.openAfterPendingWrite(open)` (src/framework/view.ts): if `!hasPendingWrite()` -> `open()` synchronously (no write, no delay). Otherwise `settlePendingWrite()` = `flushPersist()` (the view's own write, still `{ fromView: true }`, debounce timer cleared) + await every write in flight (new `writesInFlight` set of promises), then `open()`. The pipeline pencil (both the chrome-panel item and the standalone pencil) and ds-hero "Edit definition" call it; `currentBody()` is read inside `open`, after the write (ReadingModeBlockHost sets `knownBody` synchronously inside the vault.process callback, so it is already the new body).
Why flush-and-wait rather than seed from the view model: the form's Save goes through `serialize` of the parsed body, and the note/host body is what the form was always seeded from; flushing keeps that single source of truth and no new serializer path. The hero already seeded from its model (`serializeStateSplice()`), so it was not stale, but it now flushes too, so the form and the pending write cannot cross (closes the SC-509 INFO-2 window for it as well).
Sidebar: `currentBody()` in pipeline.ts now asks `SidebarBlockHost.currentBody()` (cached note content, follows the host's own writes) instead of falling back to the pipeline's captured `source`.

## Per-opener table
| Opener | Host / code path | Stale before? | Fixed? |
|---|---|---|---|
| Pencil, Reading view (pipeline) | ReadingModeBlockHost -> `lastKnownBody` | Yes, only inside the ~400 ms debounce | Yes. jest + G-S45 Reading phase |
| Pencil, Live Preview (pipeline) | `LivePreviewBlockHost` is a throwing stub; real LP renders through the post-processor with ReadingModeBlockHost (`lpCalloutSeen` path), same `currentBody()` and same `view.openAfterPendingWrite` | Same as Reading by code path | Yes by construction; NOT exercised in a real-Obsidian LP scenario (G-S45 is Reading + sidebar as briefed) |
| Pencil, sidebar panel | SidebarBlockHost; `currentBody()` previously fell to `source` | YES, always (even after the write landed), jest sidebar test 2 red at c2758a2 | Yes: flush + host `currentBody()`. G-S45 Sidebar phase; a bundle with only the flush (no host body) FAILs the Sidebar phase |
| ds-hero "Edit definition" (any host) | `HeroSheetView.editDefinition` -> `openAfterPendingWrite` -> `openFormEditor(model.serializeStateSplice())` | No for content (reads the live model); pending-write ordering only | Yes (flush first). jest heroSheet test |

## Flush-failure behavior
If the flushed write resolves false or rejects, the host has already reported it (ReadingModeBlockHost/Sidebar dropped-write Notice; `ElementView` console.error on reject). `openAfterPendingWrite` still calls `open()`, which reads whatever body the host still holds (the pre-click body, since `knownBody` is only advanced on a landed write). So the form opens from the old body after a Notice. No new UI. Alternative for you to rule on: skip opening on failure. Pinned by a view-level jest test ("a failed write still opens"). If the view unloads while waiting, nothing opens (`unloaded` flag), since an unloaded owner would never close the modal.

## Double click
A second pencil request while a flush is in flight is dropped (`formOpenWaiting`): one form. Covered by jest (view level and through the real pencil). Note (pre-existing, unchanged): two clicks with NOTHING pending still open two forms (the "two pencil clicks" jest test failed at c2758a2 for that reason); not touched.

## Evidence
- Red FAIL (jest, c2758a2 + tests only, commit 3b760b8): `formSaveRedraw.test.ts` "Increase, pencil inside the debounce, Save unchanged: the note keeps the increment": `Expected substring: "current_value: 4"  Received string: "name: Health\ncurrent_value: 3\nmax_value: 20\nmin_value: 0"` (7 of 14 failed; the 7 passes are controls incl. two-counters). Log: `.../scratchpad/sc519-r1-impl-a1/red3.log`.
- Integrity probes (jest, all in formSaveRedraw.test.ts): text above/below preserved; two counters (A pending, form on B opens at once and does not flush A; A lands on its own timer; B untouched); hand edit elsewhere in the note while pending survives; no-pending -> opens synchronously with zero `vault.process` calls; flush keeps `fromView` (1 ticket/claim, card adopted) and a later form Save still redraws (claims stay 1).
- G-S45 vs c2758a2 bundle: `OBSIDIAN-LIFECYCLE G-S45 FAIL: Reading view (the click was lost: the form started from "name: Health\ncurrent_value: 3\nmax_value: 20\nmin_value: 0"): the note never got "current_value: 4": "...current_value: 3..." [shot /tmp/dse-obsidian-lifecycle-UWaF1N/shots/G-S45-FAIL.png]` (log `gs45-base.log`).
- G-S45 vs fix with the sidebar host-body change removed: `G-S45 FAIL: Sidebar (the click was lost: the form started from "...current_value: 3...\n_dse_anchor: d5b05a")` (log `gs45-var.log`).
- G-S45 vs fix: `G-S45 ok (...Reading view: Increase, pencil inside the debounce, Save unchanged -> 4 kept; Sidebar: ... 4 kept; the note outside the block untouched; no Notice, no page error)`.
- G-S45 method: no timed race. The plugin's own 400 ms debounce timer is HELD at a hook (window.setTimeout wrapper capturing delay-400 timers whose stack names draw-steel-elements; clearTimeout wrapper removes held ids). Asserts: exactly 1 timer held after the real click on Increase; the note file still equals the fixture (old value) when the pencil is clicked (anti-vacuity); at form-open the held count is 0 (the open flushed it); after Save unchanged: note has `current_value: 4`, no `3`, outside-block text byte-identical (and the sidebar anchor survives); Reading phase claims +1 and same card root (the flush was the view's own adopted write; the unchanged Save writes identical bytes, which Obsidian skips, so no rebuild). The only fixed wait is a 1000 ms settle after the sidebar pin (copied from G-S40; not a race window). Held timers are dropped, never fired, at cleanup. Real mouse: hover + CDP click on Increase, pencil and Save.
- G-S45 refactor: the form driver in G-S40 (hoverTo, waitText/waitDisk, FORM/SAVE, sidebar pin) moved into a shared module-level `formKit(t)`; G-S40 uses it (G-S40 still ok in the 38/38 run).

## Gate numbers (all on 1e97599, logs in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc519-r1-impl-a1/`)
tsc `g-tsc.log` clean; lint `g-lint.log` rc 0; jest `g-jest1.log` (before shots: 6073 passed / 2 skipped) and `g-jest2.log` (after shots: 6074 passed / 1 skipped / 245 of 246 suites; +16 tests vs 6058); lifecycle `g-lifecycle.log` rc 0 `38/38 ok, 0 failed`; e2e `g-e2e.log` rc 0 `123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`; shots `g-shots.log` rc 0, 592 PNGs, 0 FAIL (this run exceeded 600 s and was auto-backgrounded by the harness; it completed rc 0); freeze `g-freeze.log` `freeze OK (280/280 ...)`; parity `g-parity.log` rc 0 `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`.

## Diff stat (c2758a2..HEAD, dse)
7 files, +566 / -72: view.ts +49, pipeline.ts +17, hero/view.ts +8; tests: formSaveRedraw.test.ts +191, element-view.test.ts +95, heroSheet.test.ts +21; obsidian-lifecycle.mjs +257/-63 (G-S45, formKit refactor, 2 fixtures, header). FormModal.ts untouched. Superproject: CHANGELOG.md +7.

Drive-by fixes: none (the sidebar `currentBody` change is part of the requested behavior, not a drive-by).

Follow-ups:
1. Two pencil clicks with nothing pending open two forms (pre-existing; only the in-flight case is guarded).
2. dse-verify SKILL.md still says 37/37 and lists scenarios up to G-S40; owner/dispatcher to add G-S45 and 38/38 (I did not touch workspace skills).
3. No real-Obsidian Live Preview scenario for this fix (code path identical to Reading view via ReadingModeBlockHost).
4. Decide the flush-failure policy (open from old body after the Notice vs skip opening).
5. Scratch left for cleanup: `scratchpad/sc519-r1-impl-a1/{base-c2758a2,var-nosidebar}` (build dirs, node_modules symlink), `/tmp/dse-obsidian-lifecycle-*` kept FAIL dirs (UWaF1N, VOZM1l, jfAV0T, xRXzGA).
