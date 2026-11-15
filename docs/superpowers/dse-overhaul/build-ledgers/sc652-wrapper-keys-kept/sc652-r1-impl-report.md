# SC-652 r1 implementer report

## Executive summary
- Verdict: DONE. Nothing pushed; superproject untouched.
- dse branch `sc652-wrapper-keys-kept` head `be843ebd`, rebased onto origin/develop `fcc7278e` (SC-651); no conflicts, package.json unchanged (no second `npm ci`).
- Commits: `26314886` fix, `89d81249` jest tests, `5a4b4f77` architecture doc note, `be843ebd` e2e.
- Every gate re-run at the rebased head: tsc (incl. e2e) clean, lint clean, jest 13525 passed / 2 skipped (expected 13406 + mine = +119), lifecycle 64/64 (21+16+9+4+7+4+3), e2e `618/627 ok, 0 failed, 9 known-bug, coverage: 417/417 pairs` (expected 613/622 + 5 new), shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147, freeze 280/280, parity 0 / 0 / 24. All actually run (none carried). No flake re-runs at the final head.
- Shared files with SC-644: `src/framework/pipeline.ts` (3 lines: passthrough init and condition at ~337-339, doc comment on PreparedModel). `resolveCollapseState` and settings delivery untouched.
- SC-514: no element writes `prefs:` twice after this change; the guard added to `withPrefOverrides` also fixes the existing ds-hero double write (see below).

## What changed (src, `draw-steel-elements`)
- `src/framework/prefOverrides.ts`: `PrefPassthrough` is now `{present, value}` = the author's whole `prefs:` value, by reference (new `emptyPrefPassthrough()`); `extractPrefOverrides` fills it for any block with a `prefs:` key (map of any keys, non-map, null, empty map). SC-406 gated-key special case and its "typo keys still dropped" comment removed/reversed. `withPrefOverrides` re-emits that value; skips a body that already declares a top-level `prefs:` (same guard `withCollapseKeys` has). Reading unchanged: same warnings, same applied set.
- `src/framework/chrome/collapsedKey.ts`: `extractCollapseKeys` records every removed key in `popped` whatever its value (`collapsed: yes`/`1`/`"true"`, claimed `collapsible:`/`collapse_default:`), still warns, still returns undefined for it; `popped`/`withCollapseKeys`/`withReservedKeys` types widened to `Record<string, unknown>`.
- `src/framework/pipeline.ts`: builds the passthrough with `emptyPrefPassthrough()`, installs it when `present`.
- `src/authoring/FormModal.ts`: Save now passes the passthrough too (it used to drop gated keys and everything else).
- `src/framework/sidebar/SidebarPanel.ts`: the in-place refresh after an outside edit (the only in-place refresh path) kept the serializer wired at mount; it now rebuilds `withReservedKeys(...)` from the fresh `prepareModel` result so the next write keeps what the note says now (and does not resurrect lines the author deleted).
- `.repo-docs/architecture.md`: the prefs round-trip paragraph updated.

## Callers of the extract functions and coverage
- `extractPrefOverrides`: pipeline `prepareModel` (render, persisted writes; jest wrapperKeysKept x4 elements, e2e), FormModal.onOpen (formModalCollapseKeys SC-652 block), experimentalGate.test (direct).
- `extractCollapseKeys`: pipeline `prepareModel`, FormModal.onOpen, direct unit tests.
- `prepareModel` second caller: SidebarPanel.handleExternalChange (sidebarInitiative: 2 tests, both fail on the old src).
- `peelLeadingCollapseKeys` / `withPeeledKeys`: only boolean lines are ever peeled; a non-boolean `collapsed:`/`collapsible:`/`collapse_default:` line is never removed from the source, so the rescue path cannot drop one (unit tests pin it). Nothing to put back.
- `withReservedKeys`: pipeline, FormModal.

## Tests (all fail against `ad21dc87` src, checked by checking out the old src)
- New `test/unit/framework/reservedKeysKept.test.ts` (25): extract/wrap functions, order, warnings, collapse state unchanged, peel.
- New `test/dom/elements/wrapperKeysKept.test.ts` (69): counter, montage, ds-stamina-bar (model owns the legacy pair), ds-hero through the real pipeline + ReadingModeBlockHost + FakeVault: each ruling key kept by value and once, author key order, warning still emitted, on-screen HTML identical to the block without the key (region counter id normalised), overrides still applied/unknown not, placement, plus integrity probes (text above/below/between, two same-kind blocks no cross-talk, hand edit then write keeps new value, second write / redraw no duplicate lines) and ds-hero single `prefs:` line. Mutation check: 46 of 69 fail on old src.
- `test/dom/authoring/formModalCollapseKeys.test.ts` (+ SC-652 block): Save keeps every case for ds-stamina-bar and ds-skills (serialize / stringify paths), after an edit and after a hand edit; 21 fail on old src.
- `test/dom/framework/sidebarInitiative.test.ts`: the finding-#1 test rewritten (prefs now written back once) and one new outside-edit test (add / hand-edit / delete, kept accordingly).
- Existing tests updated to the new rule: experimentalGate (typo key now kept), unit prefOverrides (passthrough shape), formModalCollapseKeys (non-boolean now kept on Save).
- e2e (`e2e/specs/montage/kept-keys.e2e.ts`, fixtures `Montage/kept-prefs.md`, `Montage/kept-collapsed.md`, `Counter/kept-keys.md`, README rows): `MONT-X15` (prefs unknown map, real click), `MONT-X16` (`collapsed: yes`), `MONT-X17` (hand edit then write), `MONT-X18` (Live Preview), `CTR-K01` (counter, `prefs: compact` + `collapsed: yes`). 5/5 pass; 5/5 fail on old src. No new coverage pairs.
- No lifecycle id added (no lifecycle-only path found).

## SC-514 (ds-hero writes prefs twice)
- ds-hero splices its raw definition text, so its body already contains the `prefs:` line; the old wrapper prepended a second one whenever an override was applied (existing bug). Installing the wrapper in more cases (unknown-only, scalar) would have extended that. The guard in `withPrefOverrides` skips a body that already declares `prefs:`; hero is therefore now single-line in all cases (tests: applied override, unknown-only, scalar). Side effect: SC-514 is effectively fixed. Owner may want to close or re-scope it. No other element writes a `prefs:` line itself.

## Drive-by fixes
- None.

## Follow-ups
- `peelLeadingCollapseKeys` keeps the first of a repeated boolean key and drops later duplicates silently (non-mapping bodies only; duplicate keys are an authoring error); not a non-boolean so outside the ruling.
- The sidebar in-place refresh updates the serializer now, but still does not re-apply per-block pref overrides or collapse state to the open card on an outside edit (display only; pre-existing; left alone per the SC-644 boundary).
- `prefs: {}` (empty map) is now kept as `prefs: {}` and `prefs:` with no value is re-emitted as `prefs: null` (value kept, formatting follows stringifyYaml; SC-599 territory).
- Jest total is +119 vs the 13406 baseline you gave (my count of new/changed tests is 25 + 69 + form block + sidebar +1); I did not reconcile the last 2 against a base-side count.

## Flakes / re-runs
- None at the final head. A pre-rebase lifecycle run (parts 1-6 passed, part 7 killed on the rebase request) was discarded; all numbers above are from the rebased head.
- Part 3-7 lifecycle and e2e ran as one detached chain script (parts in sequence, each its own log).

## Evidence artifacts
Scratch dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc652-r1-impl/`
- Rebased gates: `r-tsc.log`, `r-lint.log`, `r-jest.log`, `rb/lifecycle-p1.log` ... `rb/lifecycle-p7.log`, `rb/e2e.log`, `rb/shots.log`, `rb/freeze.log`, `rb/parity.log`.
- New-case e2e: `e2e-new.log`; old-src mutation: `e2e-mut.log`; jest mutation: `jest-wk-mut.log`, `jest-form-mut.log`, `jest-sb-mut.log`.
- Pre-rebase (superseded): `lifecycle-p1.log` ... `lifecycle-p7.log`, `gate-jest.log` (13520 passed).
