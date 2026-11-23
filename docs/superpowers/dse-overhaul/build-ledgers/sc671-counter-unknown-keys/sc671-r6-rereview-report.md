# SC-671 r6: scoped re-review of the r5 fix round

## Executive summary

- **Verdict: LAND-READY.** Plugin `d582e7ff` on `fefd9029`; after a fetch, origin/develop is still `fefd9029`. Superproject `06e1f3e4` on `358b7fb0` on `7b5eddbd`, on top of origin/main `334058e2`.
- **r4 findings closed:** LOW-1, LOW-2, LOW-3 and INFO-3.
- **New findings:** 0 CRITICAL, 0 HIGH, 0 MEDIUM, 0 LOW, 1 INFO (CHANGELOG wording).
- **range-diff** `bdf0255e..16cbd05f fefd9029..f11459e9` prints four `=`. Between `bdf0255e` and `fefd9029`, nothing changed in `src/elements/counter`, `src/model/Counter.ts`, `src/elements/shared`, `src/framework/host`, `collapsedKey.ts` or `prefOverrides.ts`.
- **Scoped gates** in the worktree:

  | Gate | Result |
  |---|---|
  | tsc | exit 0 |
  | jest, 4 suites | `Tests: 123 passed, 123 total` |
  | e2e `--element=counter` | `12/12 ok, 0 failed, 0 known-bug` |
  | styles.css | `18730938…f1f9` |

- **r5 logs** exist and match its report: jest `2 skipped, 13936 passed, 13938 total`; e2e `668/673 ok, 0 failed, 5 known-bug, coverage: 418/418 pairs`; lifecycle 21+16+9+4+7+4+3 = 64/64.
- **SC-644 probe** (live settings pushed into an open counter that has unknown keys, then a press): 60/60 green. The settings change never writes. Every step is byte-identical to the same sequence with no settings change. A DOM check proves the change actually reached the block.

## Findings

### INFO-1: the CHANGELOG clause is accurate; two small wording points

Where: worktree `CHANGELOG.md:14`.

- "moves to the top" means above the counter's own keys. Reserved `prefs:` / `collapsed:` lines still come first.
- The added clause makes one source line about 150 characters long, where the rest of the bullet wraps at about 140.

Optional fix: "moves above the counter's own keys". No action is needed to land.

## Item results

### Item 1: LOW-2 fix (`src/elements/counter/model.ts:87-89`)

**Correct and inert today.**

- **No unknown keys:** a block with none still takes the early return at `:85`, which the delta does not touch. The counter-relevant files are identical between `bdf0255e` and `fefd9029`, so r4's 52-case byte-identity result against base still holds.
- **Hostile keys:** `hasOwnProperty.call(counterInstance, k)` is false for `__proto__`, `constructor`, `toString`, `hasOwnProperty`, `toJSON`, `valueOf`, `isPrototypeOf` and `__defineGetter__`. Each of these keys is still carried and written exactly once, and nothing is polluted (`r6-filter.test.ts`).
- **Every extra filtered out:** with an empty carried list, the two-argument `stringifyOmittingUntouched(model, Object.fromEntries(Object.entries(model)))` writes the same bytes as the one-argument form. I checked 8 sources: `{}`, falsy values, wrong types, the anchor, `hello`, a list, each before and after a change (`r6-filter.test.ts`, 8/8).
- **The `KNOWN_KEYS` export:** it is used only by `test/unit/model/counter-serialize.test.ts`. No `src` file and no `main.ts` re-export uses it, so the bundle gains no public surface.
- **The KNOWN_KEYS test is sound.** The `Counter` constructor assigns all seven fields unconditionally: `max_value` and `_dse_anchor` are assigned `undefined` when absent and are still own keys, which `r6-filter.test.ts` asserts. A future field that is assigned only when present would slip past this test, but the filter still covers it. When such a field is absent there is nothing to carry. When it is present, the model owns it and the filter drops the carried copy.

**Mutants** (run against the 4 suites plus the r6 probe):

| Mutant | Result |
|---|---|
| M3: `current_value` dropped from `KNOWN_KEYS` | Only "KNOWN_KEYS is exactly the keys of a parsed Counter" goes red (1/17). The filter now makes M3 harmless in behaviour. |
| M8: filter removed | Only "an extra whose key the model owns is never written over…" goes red (1/17). |
| M9: M3 and M8 together | unit 5/17, own-keys 13/14, wrapperDefaultKeys 6/59 red. |
| M10: filter drops everything | unit 13/17, own-keys 13/14, wrapperDefaultKeys 3/59 (the new `title: Deaths` cases), r6 probe 48/60 red. |

Each of the two new guards is caught by exactly one test, as designed.

### Item 2: LOW-1 fix (`test/dom/elements/wrapperDefaultKeys.test.ts:410-423, 486-510`)

- All three `title: Deaths` cases are back, with the new expected bodies (`current_value: 1\ntitle: Deaths` -> `title: Deaths`).
- The `{}` and `PREFS` cases are kept; the diff only adds lines.
- Nothing that pinned SC-482 or SC-652 was weakened or removed.
- The third site is the right call. The original third test, "neither prefs nor a collapse key", with `title: Deaths` would just repeat the first site. The `collapsed: false` + `title: Deaths` case is new: it covers the collapse-key wrapper together with the extras, and matches the sibling montage test `collapsed: false`.
- Minor: that case does not re-mount the block afterwards, unlike its siblings. Not a finding.

### Item 3: INFO-3 fix (`test/dom/elements/counter-own-keys.test.ts:60-62`)

The reconciliation is that none of the 14 tests races an outside edit against the debounce.

- O12 makes an outside edit, then redraws, then presses. No press is pending when the edit lands, and the redraw now seeds the new body.
- O18 is the sidebar test and does not use this harness.

So seeding cannot change any expected outcome. All 14 pass, and they pass for the right reason: every press asserts the written values, so a write the host refused would fail the test. The race outcome in production (the write is refused with a Notice and the outside edit stays) is pinned by r4's R4C probe, not by this suite. That is still a gap if the owner wants a permanent test for it, but it is not required by r4's INFO-3.

### Item 4: LOW-3 fix

- `git diff origin/main HEAD -- CHANGELOG.md` shows 6 added lines and 0 removed.
- The SC-671 bullet is the first entry under `## Unreleased`.
- The clause "except a key that is a number, like `2024:`, which moves to the top and comes back in quotes" is accurate and in plain words (see INFO-1).

### Item 5: SC-644 interaction

Probe: `test/dom/probe/r6-livePrefs.test.ts`, 60 cases, all green.

- **Harness:** the real pipeline, a real `ReadingModeBlockHost` seeded with `setMountedBody`, and a fake vault. The setting is changed with `prefs.set` on the same preference store, which is `chromeLivePrefs.test.ts`'s trigger.
- **Sources** (5):
  - unknown keys only
  - `prefs` map + `collapsed: true` + unknown
  - `collapsible: false` + `collapse_default: true` + list + `_dse_anchor`
  - SC-652 scalar `prefs: compact` + `collapsed: yes`
  - no unknown keys
- **Settings changes** (6): Collapsible by default off; off then on; Start collapsed; Show edit button; on then off; all three.
- **Orders** (2): change then +; +, then change, then −.
- **Checks:**
  - The settings change itself writes nothing.
  - Every note state is byte-identical to the same sequence with no settings change, with the same Notices.
  - Each source key appears exactly once with its value, and reserved keys stay in place.
  - Exactly one `.dse-counter`.
  - The text around the block is intact.
  - The change really reached the block: the pencil goes from absent to present on "edit button", and Collapse goes from present to absent on "collapsible off".
- No e2e probe was needed: the jsdom path reaches the live-settings push.

### Item 6: anything else

Nothing.

## Logs and artifacts

All under `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/e255a3cd-5cdb-4dc4-83be-b58e80eb1057/scratchpad/sc671-r6-rereview/`:

- **Gates:** `r6-tsc.log`, `r6-jest.log`, `r6-e2e-counter.log`, `r6-styles.sha`, `r6-gates.load`. Load was 8.2-9.0 during the run.
- **Probes:** `r6-probe1.log` (live prefs, 60/60), `r6-filter.log` (10/10).
- **Mutants:** `r6-mutants.log`, `r6-mutant-*.json`, `r6-mutant-*.txt`, `mutants/*.ts`.
- **Probe worktree** at `d582e7ff`, left registered: `…/sc671-r6-rereview/dse-probe`. Probe files: `test/dom/probe/r6-livePrefs.test.ts`, `test/unit/probe/r6-filter.test.ts`.
- **r5 logs spot-checked:** `…/scratchpad/sc671-r5-fix/r5-jest.log`, `r5-e2e.log`, `r5-lc1..7.log`.
- **Worktree state after the run:** plugin and superproject `git status --porcelain` are empty; HEADs are unchanged (`d582e7ff`, `06e1f3e4`).
