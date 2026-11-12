# SC-610 r2 independent review (reviewer a80d391b699382dff)

## Executive summary
- Verdict: **LAND** (no blocking finding). Reviewed dse `3a0f3079` on base `7866426e`, superproject wt `2bd2a2f6`.
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 2 · INFO 3. Both LOWs are owner calls, and neither is a regression from base.
- O1: every read site goes through `montageRoster`. I found no unguarded reader in or outside `src/elements/montage/`. A 25-case probe drives the real pipeline and DOM (render, keyboard opener, Log, End round, Reset, Add a hero via its modal, Add a round) for 9 shapes, the 6 O1 shapes plus `- name:`, `- name:` with skills and `{}`. Head: 25/25 pass. Base: 13 fail.
- O3 (a)-(f) hold for every content-bearing item: kept intact and in place, no cross-talk, a hand fix gives a normal hero, orphan entries behave as on base, duplicates behave. The empty-item drop never drops content. Only `- `, `~`, `''`, `[]` and `{}` are dropped. `0`, `false` and `" "` are kept.
- §B.5 key order holds on every write. SC-606 still holds: unrelated writes add no `skills_used` key.
- Gates I measured: jest **7748 passed / 1 skipped** (264/265 suites; post-shots cache present, which matches 7707+40, +1/-1). e2e **`278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`**. Lifecycle part 5 **7/7 ok, 0 failed**.
- The author's tests are red on base: the two changed test files at `3a0f3079`, run on a `7866426e` export, give **34 failed / 203 passed**. They are green on head (in the full run).
- Plugin `git status --porcelain` was empty before and after. Superproject wt shows only ` M draw-steel-elements` (the pointer bump the land step does, unchanged).

## Method / evidence
All in `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc610-r2-a80d391b699382dff/`:
- `zzsc610r2probe.test.ts.txt`: the probe source. `probe-run.sh` copies it into `test/dom/elements/` for one run and then deletes that literal path.
- `probe-head.{log,json,rc}` (25/25 pass) and `probe-base.{log,json,rc}` (13 failed / 12 passed, run on a scratch `git worktree` of `7866426e`, since removed).
- `base-author-tests.{sh,log,json,rc}`: the author's tests on base (34 failed / 203 passed).
- `jest-full.{sh,log,rc}`, `e2e.{sh,log,rc}`, `lc5b.{sh,log,rc}` (part 5, 7/7).
- `lc5.log` is an aborted first attempt. I used `--only` with spaces, so it ran all scenarios. I killed my own pid at 22/58 ok, 0 failed. It is not a gate result.

Base observations from the probe (jsdom): with `- ` the card fails to render. With the other shapes the board draws a blank row (`name: 7` shows `7`) and the head reads "3 heroes". With `- name:\n  skills_used: [Climb]`, base's Reset rewrote that item's list to `[]`. Head: rows `Kira, Vex`, "2 heroes", the Log button is enabled, one warn per parse, and no page error for any shape.

## Findings

### LOW-1: a non-list `participants` value is silently deleted by the first write (challenge of r1 Follow-up 1)
- Where: `src/elements/montage/model.ts:211-215` (`sanitizeParticipants`, the `!Array.isArray(raw)` branch returns `undefined`).
- Scenario: block text `rounds: 2\nparticipants: Kira\n` (a one-hero roster typed as a scalar) -> any board write (Add a round, Add a hero, Set limits) -> the note has no `Kira` at all. With Add a hero it reads `participants:\n  - name: Zed\n    skills_used: []`. The same happens to `participants:\n  name: Kira` (the dash forgotten) and `participants: 7`. Probe `nonlist` in `probe-head.json`.
- Base: the scalar string crashed the render, so no board write could reach the note. The mapping and the number were already dropped silently on base. So the fix turns a crash into silent loss for the string case, and leaves the mapping case as it was. It is outside O1's item list, which is why this is LOW. It is against the spirit of O3 ("a write must not delete ... content", the L-2 "shape a typo takes" precedent).
- Fix (cheap): keep the raw non-list value on the model and write it back verbatim. `montageRoster` already returns `[]` for it if it filters only arrays (guard `Array.isArray`). Only `addMontageHero` needs a rule. Suggested: wrap the existing value as the first list item (`[raw, {name, skills_used: []}]`). A typo'd mapping `{name: Kira}` then becomes a real hero, and a scalar `Kira` becomes a kept, skipped `- Kira`. Otherwise the owner keeps the DROP ruling and states it in the CHANGELOG.

### LOW-2: `- name:` (a key with no value) is written back as `- name: null`
- Where: `src/elements/montage/model.ts:59-63` (`isEmptyItem` counts only `{}` as an empty mapping) with `serialize` at `:268`.
- Scenario: `participants:\n  - name: Kira\n  - name:\n  - name: Vex` -> log an action for Vex -> the note reads `  - name: null` between Kira and Vex. `- name: ~`, `- {name: }` and `- skills_used:` likewise become `null`, and `- [~]` becomes `- - null`. Probe `f` and `nameNull.writes` in `probe-head.json`.
- Why it matters: `- name:` is probably the most natural hand-typed form of the ticket's "an entry with no `name`". §B.5 says never emit `null`, and the author's own guard test ("an item with nothing in it is not written back as `null`") covers only `- `. Nothing is lost (it parses back as the same value), and base wrote the same `null` (not a regression).
- Fix (owner's call): (a) treat a mapping whose every value is `null` as empty in `isEmptyItem`, so it is dropped like `{}` (the O3 "truly empty MAY be dropped" licence). A mapping with any real value, such as `- name:\n  skills_used: [Climb]`, is still kept and still writes `name: null`, which is acceptable. Or (b) accept it and add one CHANGELOG clause. Add one model test either way.

### INFO-1: the type of `model.participants` hides the non-hero items
- `src/elements/montage/model.ts:137` (`participants?: MontageParticipant[]`) and `:223-224` (`kept as MontageParticipant[]`). The doc comments say "read it through `montageRoster`", but the compiler accepts a future `m.participants!.map(p => p.name)`, which would bring the crash back.
- Suggestion: a follow-up, not this ticket. Type the raw list as `ReadonlyArray<unknown>` (tests that index it would cast), or add a grep or lint test that fails on `.participants` reads outside `model.ts`.

### INFO-2: Reset now leaves a non-hero item's `skills_used` as typed
- `resetMontageProgress` (`model.ts:545-553`) iterates the roster only. With `- name:\n  skills_used: [Climb]` or `- skills_used: [Climb]`, base reset the item's list to `[]`; head leaves it as typed (probe `nameNullSkills`). This is correct under O3. The side effect: if the user later adds a name, that hero starts with Climb already used, even though the montage was reset. Noted only.

### INFO-3: CHANGELOG wording (superproject `CHANGELOG.md:11-15`)
The entry is accurate and in plain words. Small nits:
- "drew a blank "undefined" row": in real Obsidian it showed `undefined`, in jsdom it is blank. Say "an empty or "undefined" row" or just "a nameless row".
- "left the Log an action button with no hero to open for" is true only when such an item came before every hero yet to act. "could leave" is more accurate.
- "dropped the next time the note is saved" more exactly means the next time the board writes the block (any change made on the board).
If LOW-2 is accepted rather than fixed, add "a `name:` with nothing after it is written back as `name: null`".

## Checked and clean (no finding)
- Read sites: `findParticipant` (log / correct / remove / undo / reuse warning), `nextHeroToAct` (bar pre-fill, which also guards LogActionModal), `resetMontageProgress`, BoardView rows, cells and the keyboard opener (rows come from the roster only), HeadView count, OutcomeBandView party, slots and notes order. `addMontageHero` appends to the raw list. No reader in `view.ts`, `LogActionModal`, `StripView`, `GuideView`, `ConfigModals` or the chrome summary. Outside the montage dir (party, pipeline, FormModal, SidebarBlockHost, undeclaredDefaults) only comments mention montage.
- (b) `[7, Kira, nmae: Kira, 'Kira', Vex[Climb], skills_used[Climb], name:'']` with log, log and correct gives Kira `[Nature]`, Vex `[Climb, Lore]`, and every bad item unchanged in place. The reuse warning for Vex/Climb is true and for Kira/Climb is false (the bad `skills_used: [Climb]` item does not count).
- (c) adding `name: Ash` to a `nmae: Ash` item by hand gives row Ash. Logging writes `{name: Ash, nmae: Ash, skills_used: [Climb]}`.
- (d) entries for `hero: Ash` (bare `- Ash`) and `hero: "7"` (`name: 7`) draw no row and no cells. The Ash note lists as an orphan, and removing an entry decrements the tally without touching any item.
- (e) `[Ash, nmae: Ash, name: Ash, name: Kira, name: Kira]`: the skill lands on the real Ash only. A duplicate Kira gets the first match, as on base.
- `stringifyOmittingUntouched` / `recordingDefaults` are keyed on top-level model keys and are unaffected by the filtered copy.
