# SC-525 round 1 - implementer report

## Executive summary
- Status: DONE. Branch `sc525-ref-nesting-retype` (plugin `draw-steel-elements`), base `develop` @ `4deb8cf` (fetched: `origin/develop` still `4deb8cf`, no rebase).
- Commits: `4bbe5bb` (RED tests), `daf715f` (fix), `af09bf2` (type the map as `ElementView<unknown>`: lint forbids explicit `any`).
- Fix = SC-510 candidate C3 exactly: `IN_FLIGHT_REFS` is a `Map<guardKey, owning view>`; refuse only if the owner is a different view with `!owner.isUnloaded()`; `finally` deletes only if this view is still the owner; public `ElementView.isUnloaded()` reads `unloaded` (not `_loaded`). Diff: 4 files, +272/-4 (src 2 files, +26/-4).
- 13 new tests (7 form-preview: feature x3, statblock x3, ds-scc x1; 6 guard). 9 red on base (7 form + 2 guard), all green on head. Mutation: each half of the fix, reverted, turns new tests red.
- Real Obsidian probe: base shows "Reference nesting too deep" and keeps it after release; head shows the Ref Strike card. Screenshots saved.
- Gates (all on head `af09bf2`): tsc and lint clean; jest 6166 passed / 1 skipped / 248 of 249 suites (fresh: 6165 / 2); lifecycle 20/20 + 21/21; e2e 124/124; shots 592, 0 FAIL; freeze 280/280; parity 0 / 0 / 24 DECLARED.

## Reproduction (RED), saved: `sc525-r1-red-jest.log`, `sc525-r1-red-jest-guards.log`
Base `4deb8cf`: `formModalStalePreview.test.ts` 7 failed / 21 passed; `refUnwrapView.test.ts` 2 failed / 20 passed.
- Form (in `test/dom/authoring/formModalStalePreview.test.ts`, new `describe`s "SC-525"), failing on base with the preview text "Feature: failed to render (render) Reference nesting too deep — `@Ref.md` is already resolving in this block":
  - `retyping the same @Ref.md in the {feature,statblock} edit form while its lookup is pending` x3 each: trailing space, first lookup released last; superseded lookup released first; four keys leaving the reference unchanged, released in typing order.
  - `retyping the same ds-scc code ... while its entity read is pending`: trailing space.
  - Each asserts no nesting text / no `.dse-error-card` while held, that the current preview starts its own lookup (held count), and the card (`expectOnlyRef`) after release in both orders.
- Guard (in `test/dom/elements/refUnwrapView.test.ts`, describe "in-flight depth guard (SC-525)"), red on base: `an unloaded view's pending lookup does not block a new view of the same reference, and it renders once released`; `a superseded owner's late finally leaves the new owner's entry in place: a third live view is still refused`.
- Guard, green on base AND head (pin behaviour that must not change): cycle A -> B -> A refused at the second A (one nesting card, the innermost root); A -> A refused; two live views, same block, same ref, concurrently: the later one is refused with the nesting error, the earlier one renders (same as before the fix); a settled resolution can be repeated.
- `displayCardHybrid` (d) depth guard: unchanged, green on head.

## Mutation check: `sc525-r1-mutants.log` (script `sc525-r1-mutants.sh.txt`; 3 suites, 55 tests)
- M1 owner-unloaded check removed (`owner !== this`): 9 red = both red-on-base guard tests + all 7 form tests.
- M2 unconditional `delete` in `finally`: 1 red = `a superseded owner's late finally leaves the new owner's entry in place`.
- M3 `owner._loaded` instead of `isUnloaded()`: `displayCardHybrid (d) depth guard` red (the SC-510 finding reproduced); working tree restored after each (0 changed files).

## Real-Obsidian probe (evidence, not a gate)
Scratch copy of the lifecycle harness (untracked, deleted by literal path) with a kit adapted from SC-510 r2. A lookup is held at a hook on `services.refs.resolve` (no timers); real key events type `@Ref.md`, then a real Space; lookups released oldest-first, then in a second run newest-first. Bundles: `bundle-base` = head tree with the two source files from `4deb8cf`; `bundle-head` = `af09bf2`-equivalent.
- Base (`sc525-r1-obsidian-probe-base.log`): at the Space and after release, both orders: "Feature: failed to render (render) Reference nesting too deep — `@Ref.md` ..."; 7 lookups held (the Space is refused before it looks up); page errors 0. Shot: `sc525-r1-shot-base-form-preview.png`.
- Head (`sc525-r1-obsidian-probe-head.log`): at the Space the preview is empty (no error); after release in both orders the Ref Strike card, no error card; 8 lookups held; page errors 0. Shot: `sc525-r1-shot-head-form-preview.png`.
- Scripts: `sc525-r1-obsidian-probe-kit.js.txt`, `sc525-r1-obsidian-probe-scenarios.js.txt`, `sc525-r1-obsidian-probe-assemble.py.txt`, `sc525-r1-obsidian-probe-run.sh.txt`, `sc525-r1-obsidian-probe-bundles.sh.txt`.
- A real-Obsidian genuine cycle is not constructible with `@path` (a referenced file's block starting with `@` is not YAML, see SC-510 INFO-3), so cycle behaviour is covered in jsdom only.

## Gates (head `af09bf2`, devbox, one foreground call each)
- tsc incl. `tsc -p e2e`: clean (`sc525-r1-tsc.log`, npm rc=0). lint incl. `e2e/`: clean, only the existing `.eslintignore` warning (`sc525-r1-lint.log`, rc=0). The first lint run flagged `ElementView<any>`; fixed in `af09bf2`.
- jest fresh worktree (`sc525-r1-jest-full1.log`): `Tests: 2 skipped, 6165 passed, 6167 total`, `248 passed, 1 skipped of 249` suites. Base fresh = 6152 / 2, so delta +13 exactly. After shots (`sc525-r1-jest-full2.log`): `1 skipped, 6166 passed`, 248 of 249 suites; base 6153, delta +13.
- lifecycle (port 9297, two `--only` halves): `sc525-r1-lifecycle-a.log` `done: 20/20 ok, 0 failed`; `sc525-r1-lifecycle-b.log` `done: 21/21 ok, 0 failed` = 41/41.
- e2e (`sc525-r1-e2e.log`): `OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`.
- shots (`sc525-r1-shots.log`, rc 0; the call went past the 600 s tool limit and ran to completion in the background, its log is complete): 592 PNGs, 0 FAIL; host-copy pin OK (Obsidian 1.15.0); button host-leak 157 kinds / 942 with the 34-record boundary; modal 10 scenarios / 38 kinds / 228; input 15 / 176; checkbox 7 / 116; prose 106 bare `<p>` [212] + 9 `<img>` [18].
- freeze (`sc525-r1-freeze.log`): `freeze OK (280/280 frozen print PNGs byte-identical ...)`, rc 0. No rebaseline, baseline untouched.
- parity (`sc525-r1-parity.log`): `0 gap(s), 0 undeclared warning(s), 24 declared deferral(s)`, rc 0.
- `git status` clean in the plugin; no pointer bump; no tags.

## Behaviour notes
- Two live views, same block, same reference at the same time: unchanged, the later view is refused with the nesting error.
- Owner-is-this: a view re-entering `resolveAndMount` while its own earlier resolution is still in flight (an `onUpdate` during a pending lookup) is no longer refused, per the ledger wording "refuse only when the owner is a different view". Not covered by a test; the form never does this (it makes a new view per keystroke).
- The ds-scc ladder shares the guard, so it is fixed too (jsdom test above).

Drive-by fixes: none.

Follow-ups: none new. (SC-510 INFO-2 / FU-2 was already folded in SC-510 r3.)

## Artifacts (all under `/home/scott/code/steelCompendium/workspace/.superpowers/sdd/sc525-ref-nesting-retype/`)
Report `sc525-r1-impl-report.md`; red logs `sc525-r1-red-jest.log`, `sc525-r1-red-jest-guards.log`; targeted green `sc525-r1-green-jest-targeted.log` (from `daf715f`); mutants `sc525-r1-mutants.log`, `sc525-r1-mutants.sh.txt`; probe logs/shots/scripts as listed above; gate logs `sc525-r1-{tsc,lint,jest-full1,jest-full2,lifecycle-a,lifecycle-b,e2e,shots,freeze,parity}.log`.
