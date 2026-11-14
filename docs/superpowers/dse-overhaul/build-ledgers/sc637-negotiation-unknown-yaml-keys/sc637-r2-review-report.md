# SC-637 r2: independent adversarial review report

**Executive summary**
- Verdict: **LAND-READY.** Reviewed dse `4e30dcfb` (5 r1 commits + r1b `4e30dcfb`) on `develop` `7b9e82cf`; superproject CHANGELOG `31a49921` on workspace `66b04168`. `git fetch`: dse `origin/develop` has **not moved** (`7b9e82cf`). Workspace `origin/main` is at `c588bbaa` (docs only, already in the ledger), so the superproject still needs its planned rebase.
- Findings: HIGH 0, MEDIUM 0, LOW 1, INFO 5. Nothing blocks the landing.
- Gates, measured by me in the r1 worktree: tsc rc 0, lint rc 0, jest fresh **12720 passed / 2 skipped** (285 suites + 1 skipped), lifecycle **64/64** over seven `--only=` parts (21+16+9+4+7+4+3, all rc 0, no re-runs), e2e **`OBSIDIAN-E2E done: 491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs`** (pointer parked, NEGO-X06..X13 all ok).
- `styles.css` sha256 `18730938512d88df8b5d7ae25bc5da0b4ace16ccaaee89e9107a5ed6f7a7f1f9` is the same for a clean `7b9e82cf` build and for the head build after e2e. So shots, freeze and parity carry over.
- Base check (src at `7b9e82cf`, tests at head): **38 of 41** new SC-637 tests fail. The 3 that pass are no-mutation guards, as r1 and r1b report. No `knownBug('SC-637')` or `test.failing` marker for SC-637 is left. No bracketed ticket id in a title. No duplicate `NEGO-*` id.
- Every write path checked: Patience and Interest seals, appeal and pitfall chips, the three modifiers, Spent, Complete Argument, Reset and the sidebar host. All of them mutate the one parsed instance, and nothing clones or rebuilds a `NegotiationData`, `Motivation`, `Pitfall` or `CurrentArgument`. Hostile keys at all four levels did not pollute a prototype, shadow a member or crash anything, and no data was lost (probe P1/P2).
- Scope is clean: only `src/model/NegotiationData.ts` and `src/elements/negotiation/model.ts` changed. No montage or framework code, no `yaml` Document API, nothing that decides SC-599 or SC-652.

## Findings

### HIGH
None.

### MEDIUM
None.

### LOW

**L-1: the CHANGELOG bullet leaves out two layout changes a user will see.**
The bullet is at `/home/scott/code/steelCompendium/worktrees/sc637-negotiation-unknown-yaml-keys/CHANGELOG.md:20-27` (commit `31a49921`).
- It says "your extra keys follow the negotiation's own keys". A key that looks like an integer (`2024:`, `"2":`) is the exception: it is written **first**, quoted, at every level. Probe P10 shows `"0": zero` and `"1": one` ahead of `name:`, and `- "2": two` ahead of a motivation's `name:`. The source comment documents this and a unit test pins it, but the bullet does not mention it.
- Quote style is also lost. The fixture's `name: "The Duke"` comes back as `name: The Duke` (SC-599). The brief names quote style next to comments, but the bullet lists only comments and flow lists.
- Failure scenario: a Director keys notes by year and finds them at the top of the block after one click. They read the bullet as saying that should not happen.
- Prescribed fix (optional; this is the SC-625 bullet wording the owner already accepted): add "a key that is a number, such as `2024:`, is written first" and "quotes around a value may be dropped" to the parenthesis. Alternatively, accept the bullet as it is, in line with SC-625.

### INFO

**I-1: "Known" = "read" holds, with no duplicate and no stale alias.** I checked every read in `NegotiationData.ts` and the views:
- Top level (15 keys): the names in `TOP_KNOWN_KEYS` (`NegotiationData.ts:22-25`).
- Motivation: `name`, `reason`, `hasBeenAppealedTo`. Pitfall: `name`, `reason`. Argument: the five keys in `ARGUMENT_KNOWN_KEYS` (`:28`).
- There are no aliases. Keys declared with null or empty values (probe P5: every known key at `null` or `~`) are carried 0 times and each written once.
- The framework keys `prefs:`, `collapsed:`, `collapsible:` and `collapse_default:` are removed from `rawData` before `def.parse` (`pipeline.ts:338-353`; negotiation has chrome, so `claimsLegacyCollapseKeys` is true). They can never be carried twice. `_dse_anchor` is in the known set.

**I-2: a stale view cannot bring back an unknown key.**
- jsdom probe J1: write, then a hand edit with no re-render (`note_to_self` deleted, `gm_note` changed), then a click on the old view. The host drops the write ("the block was not found by its last known body") and the hand edit stays.
- Real Obsidian builds the card fresh after an outside edit: e2e NEGO-X12/X13 pass.
- Extras live per instance and are recorded only in the constructors, so a fresh parse always carries fresh extras. The sidebar remounts from the fresh body on any modify that is not its own echo (`SidebarBlockHost.ts:443`).
- Coverage note: NEGO-X12/X13 make the hand edit before the card has written anything. A variant that writes first (so the view is adopted), then edits by hand, then clicks would test the adopted-writer path in real Obsidian. jsdom J1 covers it, so this is optional.

**I-3: the unknown values are shared by reference with the raw parse.** Two models parsed from the same raw object share their nested unknown values (probe P6). The pipeline parses each source fresh and nothing mutates these values, so nothing leaks today. YAML anchors and aliases among unknown values come back as `&a1` / `*a1` (P3): the value is kept and the formatting comes from `stringifyYaml`.

**I-4: three things that were lost before SC-637 and are still lost (not r1's scope; I confirmed each on `7b9e82cf` src).** Candidates for SC-638 if it does not already list them:
- A motivation or pitfall item that is not a mapping (`- just a string`, `- [a, b]`, `- 42`) is written back as `- {}`, so its value is lost.
- `pitfalls: {a: 1}` (a map where a list is expected) throws `TypeError: _g.map is not a function` in the constructor.
- `currentArgument: hello` or `currentArgument: [a, b]` is replaced by a default argument on the first write.

**I-5: housekeeping.**
- The comment at `src/elements/negotiation/model.ts:99-100` says "at the top level and inside each motivation and pitfall" and leaves out `currentArgument`. Line 104 covers the argument, so this is cosmetic.
- Some of the unit "guards" also fail on base, but only because `unknownKeysOf` does not exist there (the import is undefined). That is not a behavioural failure. It is expected and needs no action.
- The e2e `[NEGO-X..]` bracketed ids are scenario ids, which is the convention. The jsdom describe titles name `SC-637` in parentheses or as a prefix, with no brackets (the SC-625 precedent).

## Probe list (what I ran, result)

All probes ran in a private plugin worktree `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r2-review/dse-probe` (detached at `4e30dcfb`, `node_modules` symlinked). The r1 worktree was never edited.
- **P1:** all four levels carry every `NegotiationData` / `CurrentArgument` method and field name plus every `Object.prototype` name: `setMotivationUsed`, `argumentReusesMotivation`, `ending`, `clampStanding`, `advanceStanding`, `offerFor`, `resetData`, `default_patience`, `default_interest`, `usesMotivation`, `usesPitfall`, `constructor`, `__proto__`, `toString`, `hasOwnProperty`, `toJSON`, `valueOf`, `isPrototypeOf`, `propertyIsEnumerable`, `toLocaleString`, `__defineGetter__`, `__lookupGetter__`, `prototype`, `contains`.
  - Prototypes are intact, `Object.prototype` gains no key, and `ending()` and `usesMotivation()` still work.
  - Every value comes back on the write. A second pass gives the same bytes. Reset keeps the three outer levels and ends the argument's keys. **PASS.**
- **P2:** `__proto__:` with a MAP value at the top, in a motivation and in the argument. No pollution, `hasBeenAppealedTo` and `motivationsUsed` are not hijacked, and it is written back as a plain `__proto__:` key. **PASS.**
- **P3:** unknown values that are null, `~`, empty, `""`, a `|` block, a nested map, a list with a map inside, a date-like value, and an anchor with its alias. All come back with the same values, and the second pass is stable. **PASS.**
- **P4:** motivation, pitfall and argument items that are not mappings. No crash from SC-637 and no indices carried. The losses are pre-existing (I-4).
- **P5:** every known key with a null or empty value: no key carried, no duplicate line. **PASS.**
- **P6:** two parses of one raw object: per-instance extras, and `resetData` on one model leaves the other alone. The nested values are shared (I-3).
- **P7 / J2:** Complete Argument (or `currentArgument.resetData()`), then a new chip. The old argument's keys are gone, and the outer levels keep theirs. **PASS.**
- **P8:** an undeclared, untouched argument is still left out (SC-482). A declared argument with only an unknown key writes the known five plus that key. **PASS.**
- **P9:** a block with no unknown key is unchanged in shape. **P10:** integer-like and odd keys (`""`, `" "`, `"name "`): values kept, integer keys first (L-1). **P11:** `toJSON:` with a map value is plain data. **PASS.**
- **J1 (jsdom, real pipeline + ReadingModeBlockHost):** hand delete or edit while the view is stale, then a click. The write is dropped and the hand edit is kept (I-2). **J3:** printed the order at all four levels after a modifier write: known keys in the fixed order, then unknown keys in their original order. **PASS.**
- **Base check:** `git checkout 7b9e82cf -- src` in the probe worktree, then the 4 changed test files. Result: 38 failed / 438 passed of 476; restored afterwards.
- **Clean base build:** `node esbuild.config.mjs production` at `7b9e82cf` gives `styles.css` `18730938…f1f9`.
- **Write-path enumeration by grep** found every `persist()` caller in `src/drawSteelAdmonition/negotiation/` (PatienceInterestView:107,148; ArgumentView:220,229,282,461; MotivationsPitfallsView:90) plus `view.ts:166` (Reset).
  - No assignment to `.motivations`, `.pitfalls` or `.currentArgument`, no `Object.assign`, and no `new NegotiationData` outside `model.ts:74`.
  - FormModal is in raw mode for negotiation (no schema), so it writes the text verbatim. Negotiation has no undo.
- **Fresh-worktree tests:** the "fresh worktree" figure counts `visual-harness/dist` as absent, and jest ran after the literal `rm -f main.js styles.css`.

## Gate logs

All logs are in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc637-r2-review/`:

| Gate | Result | Log files |
|---|---|---|
| tsc / lint | rc 0 / rc 0 | `g1-tsc.log`, `g1-lint.log`, `g1.rc` |
| jest | `Tests: 2 skipped, 12720 passed, 12722 total` | `g2-jest.log`, `g2.rc` |
| e2e | `491/509 ok, 0 failed, 18 known-bug, coverage: 287/287 pairs`, rc 0 | `g3-e2e.log`, `g3.rc` (includes the `styles.css` sha) |
| lifecycle | 21/21, 16/16, 9/9, 4/4, 7/7, 4/4, 3/3, every part rc 0 | `lc1.log` … `lc7.log`, `lc1.rc` … `lc7.rc` |
| probes | as listed above | `p1-probe.log`, `p2-probe.log`, `p4-probe.log` |
| base check | 38 failed / 438 passed | `p3-base.log`, `p6-base-P4.log` |
| clean base build | `styles.css` sha | `p5-basebuild.log` |

Tree state:
- dse worktree: `git status --porcelain` empty before and after, HEAD `4e30dcfb`.
- Superproject worktree: ` M draw-steel-elements` before and after (r1's unstaged pointer, as reported), HEAD `31a49921`.
- The probe worktree is still registered in the plugin repo (`git worktree list`). `git -C <plugin> worktree remove --force <probe path>` drops it, if the owner wants that.
