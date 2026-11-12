# SC-610 r4 scoped re-review (reviewer a80d391b699382dff)

## Executive summary
- Verdict: **LAND**. Reviewed dse `3ad68185` on `c6077860` and superproject wt `f18fad5a`, against the r2-reviewed `3a0f3079`.
- Counts: CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0 · INFO 3. None of the INFOs needs a change.
- Rebase: `git range-diff` shows `7bd2ea25 = 474ab25f` and `3a0f3079 = 4eff6128` (identical). develop `7866426e..c6077860` touches neither `src/elements/montage/`, the two montage tests, nor `package.json`.
- All four folds are closed. LOW-1 (non-list kept, add-hero wraps), LOW-2 (all-null dropped, no `null` written, `0` / `false` / `" "` kept), INFO-1 (`.name` / `[0]` / `.length` on the raw value fail tsc) and INFO-3 (the CHANGELOG bullet is byte-identical to the owner text in the r3 brief).
- New tests: the head test files on `3a0f3079` give **11 failed / 238 passed**. The 11 failures are exactly the new LOW-1 and LOW-2 cases. The 12th new test, the non-null guard, passes on both, as the author stated. Green on head.
- My probe (r2's 25 cases updated for LOW-2, plus 26 r4 cases): head **51/51**; `3a0f3079` 13 failed / 38 passed, all of them LOW-1 or LOW-2 cases.
- Gates on head: jest **10677 passed / 1 skipped** (265 of 266 suites; the shots cache is present, so fresh = 10676 / 2 = 10624 + 52). e2e **`278/282 ok, 0 failed, 4 known-bug, coverage: 171/171 pairs`**. Lifecycle part 5 **7/7 ok, 0 failed**, part 6 (`--only=G-S92,G-S96`) **2/2 ok, 0 failed**. Main-project `tsc --noEmit` rc 0.
- Plugin `git status --porcelain` is empty, and the scratch worktree of `3a0f3079` has been removed.

## Evidence
Dir `/tmp/claude-1000/-home-scott-code-steelCompendium-workspace/be71a0a9-199f-4e14-967b-191935312b05/scratchpad/sc610-r4-a80d391b699382dff/`:
- `zzsc610r2probe.test.ts.txt` (probe source) and `probe-run.sh` (it copies the probe into `test/dom/elements/`, runs it, and deletes it)
- `probe-head.{log,json,rc}` and `probe-r2head.{log,json,rc}`
- `red-r2head.{sh,log,rc}` (the head test files run on `3a0f3079`)
- `tscprobe/{probe.ts,tsconfig.json,run.sh,tsc-probe.log,tsc-probe.rc,tsc-tree.log,tsc-tree.rc}`
- `jest-full.{sh,log,rc}`, `e2e.{sh,log,rc}`, `lc5.{sh,log,rc}`, `lc6.{sh,log,rc}`
- `cl-owner.txt` (the owner text, diffed against the bullet)

## Folds, as measured
- **LOW-1.** I rendered each of `participants: Kira`, a mapping `{name: Kira, skills_used: [Climb]}`, `7`, `false` and `{nmae: Kira}`. Each draws "No heroes yet", warns once, and raises no page error.
  - Add a round and Reset write the value back as typed, with §B.5 key order kept.
  - Add a hero (through the modal) writes `[raw, {name: Zed, skills_used: []}]`. The rows become `Kira, Zed` for the mapping with a name, and `Zed` for the others.
- **LOW-2.** These are dropped and leave no `null` in the output: `- name:`, `- name: ~`, `- {name: }`, `- skills_used:`, `- [~]`, `- [~, ~]` and `- {name: , skills_used: }`.
  - Also dropped: `- `, `- {}`, `- []` and `- ''`.
  - Kept: `0`, `false`, `" "`, `{nmae: 0}`, `[~, 1]`, `name: ""`, `{name: {}}`, `{name: []}` and `[[]]`.
  - A `participants` value that carries nothing (`participants:`, `~`, `''`, `[]`, `{}`, a mapping of only nulls, `[~, ~]`, `[- , {}]`) writes no `participants` key.
- **INFO-1.** A scratch file compiled under the tree's tsconfig gets TS18046 on `m.participants.name`, TS7053 on `m.participants![0].name` and TS2339 on `m.participants?.length`. `montageRoster(m)[0].name` compiles, and so does an explicit `as any[]` cast (any type allows that escape).
  - Type users: the only files that use `MontageModel` / `MontageParticipant` are montage src plus three montage test files. The r3 diff touches only `model.ts` and `montage-tally.test.ts`.
  - **`unknown` vs `unknown[]` is sound.** Once a non-list value is kept raw, `unknown[]` would be a false type for `participants: Kira`. `unknown` is the honest type, and every structural read already goes through `Array.isArray` (`montageRoster`, `addMontageHero`, `serialize`). The `?:` with `unknown` is redundant but harmless.
- **INFO-3.** The bullet in `CHANGELOG.md` diffs empty against the r3 brief's text (`diff` printed IDENTICAL).

## Regression re-check (O1, O3 (a)-(f), §B.5, SC-606)
All r2 probe cases pass on head. They cover:
- 9 shapes × (render; keyboard opener → Log; End round; Reset; Add a hero; Add a round)
- interleaving with no cross-talk; a hand fix gives a hero; orphan entries; duplicate names; the empty-drop boundary
- the SC-606 rule that unrelated writes add no `skills_used` key
- §B.5 key order on every write

Expectations changed only where LOW-2 ruled: `- name:` is now dropped.

## INFO (no change needed)
- **INFO-A** `model.ts` `sanitizeParticipants` (`if (raw === undefined || isEmptyItem(raw)) return undefined;`): an all-null list such as `participants: [~, ~]` is now dropped before the skipped-item warn, so it gives no console warn. `[- , {}]` still warns. Nothing is lost; the inconsistency is cosmetic.
- **INFO-B** An item that mixes nulls with content still writes `null` (`- [~, 1]` gives `- - null\n    - 1`; `- name:\n  skills_used: [Climb]` gives `name: null`). This is what the ruling says ("nothing with a non-null value is ever dropped"), and it is pinned by the author's guard test.
- **INFO-C** For `participants: Kira` the board's empty state reads "No heroes yet — add one from the montage menu." Only the console says why. Adding "Kira" from the menu gives `[Kira, {name: Kira}]`: it works, and the bare item stays skipped. This is the design the owner ruled for; noted only.
