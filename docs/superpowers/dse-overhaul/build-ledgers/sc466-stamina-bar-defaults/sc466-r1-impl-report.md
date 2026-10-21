# SC-466 r1 implementer report

## Executive summary
- STATUS: DONE. Verdict implemented per ledger: a key absent from the parsed source AND still equal to the parser-filled default is omitted from the write; declared keys written in unchanged class order.
- Plugin (draw-steel-elements, branch sc466-stamina-bar-defaults, base 0ce76dd = origin/develop, no rebase): 2028881 (red test), 06d60d8 (fix + fixtures), e0e2fdc (e2e + comments/docs). Superproject: 52a22fa (CHANGELOG only; the `draw-steel-elements` pointer bump is left for wt-finish).
- tsc (incl. e2e) clean; lint (incl. e2e) clean.
- jest 5423 passed / 1 skipped / 232 of 233 suites (after shots; before shots 5422 / 2 skipped). Baseline 5408 -> +15 tests (14 in new staminaBarDefaults.test.ts, +1 in stamina-bar.test.ts).
- lifecycle 29/29 ok, 0 failed (port 9293).
- e2e `OBSIDIAN-E2E done: 89/93 ok, 0 failed, 4 known-bug, coverage: 64/64 pairs` (run 20261021-094833-f457; +1 test STAM-W11, no new coverage pairs). STAM-W11 verified RED on the pre-fix model.ts (run 20261021-094926-7b7d), green with the fix.
- shots 572 PNGs, 0 FAIL; freeze `OK (276/276 ...)`, no delta; parity 0 gaps / 0 undeclared / 24 declared.

## Root cause
`src/elements/stamina-bar/model.ts` `serialize()` was `stringifyYaml(model).trim()` over the StaminaBar instance; `StaminaBar.parse` (src/model/StaminaBar.ts) fills collapsible true / collapse_default false (ComponentWrapper ctor), current_stamina 0, temp_stamina 0, height 1, style "default" into own properties, so the first write materialised them.

## Fix (src/elements/stamina-bar/model.ts)
- `parse()` records, per returned instance, the defaulted keys the source did not declare, in a module-private `WeakMap<StaminaBar, ReadonlySet<string>>` (`undeclaredDefaults`). Not an own property (verified by the real `yaml` package via the jest mock `stringifyYaml`: the integrity tests assert exact bytes), per-instance (two-block test), not copied by spread/clone (a never-parsed instance has no entry and serializes whole, as before).
- `serialize()`: no entry/empty set -> old whole-instance path. Otherwise `Object.entries(model)` (same class order) filtered to drop a key iff it is in the absent set and `value === default`.
- The BYTE-COMPAT header comment in model.ts now states the SC-466 contract; also updated: stamina-bar/view.ts header, ComponentWrapper.ts header comment, `.repo-docs/architecture.md` Stamina Bar row.

## Writers traced (all mutate the SAME parsed instance in place -> the WeakMap entry survives)
1. StaminaEditModal Apply (view.ts openEditModal passes `this.model`; modal sets `staminaBar.current_stamina/temp_stamina/recoveries` at StaminaEditModal.ts:618-623), then updateCallback -> `persist()`.
2. Catch Breath (view.ts catchBreath) and its undo toast closure.
3. Recoveries strip marker click (`setRecoveries`) and its undo toast closure.
4. Recoveries popover (same `onSetRemaining` -> `setRecoveries`).
5. `ElementView.persist()` -> injected `def.serialize` (wrapped by withCollapseKeys / withPrefOverrides, which only prepend popped keys; stamina owns collapse keys so none popped).
6. Re-parse paths (SidebarPanel external change, pipeline echo rebuild, FormModal Save via def.parse): presence is recomputed from the new source/data, so it tracks the file.
7. Not writers of this block / not changed: hero/view.ts bridge `new StaminaBar(...)` and initiative `StaminaBar.fromHero/fromCreature` (never serialized into a user's stamina-bar block; they feed the modal only). Blocks the plugin constructs itself keep the old output (pinned by one test). No finding of those flowing into user files with this defect.

## Fixtures changed (before -> after)
- test/dom/elements/stamina-bar.test.ts ~:450 Full Heal: 7-line body -> `max_stamina: 20 / current_stamina: 20 / temp_stamina: 0`.
- ~:478 stepper edit: 7 lines -> `max 20 / current 16 / temp 5`.
- ~:574 persisted ReadingModeBlockHost Kill: 7 lines -> `max 20 / current -10 / temp 0`.
- ~:592-660 byte-compat describe: "documented example" now expects framework output = legacy minus the 4 undeclared lines (legacy leak still asserted for the record); "explicitly set" test expects legacy minus current/temp_stamina (never declared); "in-place edit" expects legacy minus the 4 undeclared defaults; NEW test "a block that declares every key is byte-identical to the legacy writer". File header comment notes SC-466.
- test/dom/elements/staminaRecoveries.test.ts ~:189 Catch Breath: 9-line body -> `max 48 / current 47 / temp 0 / recoveries 5 / recoveries_max 10`.
- test/dom/framework/pref-overrides.test.ts ~:355 (prefs: write): `toContain collapsible/collapse_default` -> `not.toContain collapsible/collapse_default/height/style:`; ~:425 AMENDMENT undeclared: 7-line -> `max/current/temp` 3 lines; ~:455 AMENDMENT declared `collapse_default: false`: 7-line -> `collapse_default: false` + 3 stamina lines (declared key kept, equal to default).
- Fully-authored fixtures: none needed change. No assertion weakened beyond absent-key omission.

## New tests
- test/dom/elements/staminaBarDefaults.test.ts (14): REPRO minimal Damage; fully-authored byte-identical; collapse_default:true survives + chrome collapse starts on/toggles without write; temp absent stays absent / gain written; current absent -> Damage writes it; recoveries/_dse_anchor Catch Breath; two blocks in one note no cross-talk; `ds-stamina` and `ds-stamina-bar` alias (test.each, 2); content above/below untouched; never-parsed StaminaBar serializes whole; Recoveries marker; undo toast; Recoveries popover.
- e2e/specs/stamina-bar/stamina-modal.e2e.ts `[STAM-W11]` + fixture e2e/vaults/shipped/Stamina/legacy-minimal.md (legacy `ds-stamina` fence), README fixture table row. No new manifest rows (same `stamina.bar`/`sedit.*` pairs).

## Drive-by fixes
None.

## Follow-ups
- Other persisted elements with the same ComponentWrapper pattern (skills `collapse_default`, any `stringifyYaml(model)` serializer over a parser-defaulted instance) likely leak defaults the same way; not touched (e.g. ds-skills). Worth a sweep ticket.
- Class order is kept, so a block authored with `collapse_default` after the stamina keys is reordered on first write (pre-existing, unchanged).

## Evidence artifacts (scratch dir /tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc466-r1-impl-a1/)
jest-new-pre.log (red), jest-new-post.log, jest-full-1.log (3 suites red pre-fixture-update), jest-full-2.log (5422/2 skipped), jest-full-3.log (5423/1 skipped, after shots), tsc.log, lint.log, lifecycle.log, e2e.log, e2e-prefix.log (STAM-W11 red on pre-fix model), shots.log, freeze.log, parity.log, npm-ci.log. e2e bundles: plugin e2e/.out/20261021-094833-f457 (full), e2e/.out/20261021-094926-7b7d (red-proof).
