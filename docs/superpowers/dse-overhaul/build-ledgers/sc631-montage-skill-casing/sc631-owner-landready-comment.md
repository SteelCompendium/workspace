The Montage reuse warning now catches a skill typed in other casing or with extra spaces. The fix is ready to land; I'm not asking you anything.

In the Log an action window, Kira has already used "Nature". Typing "nature", "NATURE" or " nature " now shows "Kira already used Nature in this montage — reuse is not allowed". The warning names the skill the way the board already has it, not the way you typed it.

It is still only a reminder. Log stays enabled, and the skill is saved exactly as typed.

Editing an entry never warns about that entry's own skill, whatever its casing. If a hero really used the skill twice, the warning still shows, and it names the other use.

One call you can overrule: matching ignores capital letters and spaces at either end. That is the same rule Add a hero uses for names (SC-627).

+++ Agent notes

- dse `2777484c` on `develop` `e1be1775`; superproject `47b35b4b` on workspace main `f770cc3b` (one CHANGELOG bullet, one pointer bump).
- `src/elements/montage/model.ts`: new `reusedSkillSpelling` (it returns the stored spelling), `wouldReuseSkill` as its boolean wrapper, and one shared `matchKey` (trimmed, lower-case) now also used by SC-627's `montageHeroNamed`. `LogActionModal.ts` prints the stored spelling.
- Tests: unit tests in `montage-tally.test.ts`; the SC-438 jsdom marker K04 is now a plain test; new e2e MONT-L12.
- Gates on the rebased head: tsc and lint clean · jest 13334 passed / 2 skipped fresh (13335 / 1 with the shots cache) · lifecycle 64/64 · e2e `597/612 ok, 0 failed, 15 known-bug, coverage: 417/417 pairs` · shots 592, host-leak 163/978, modal host-leak 40/240, capture clip 147 · freeze 280/280 · parity 0/0/24.
- Independent Opus review: approved. Its two LOW findings were fixed in r3 and re-reviewed: the edit sheet named the wrong stored spelling for `[nature, Nature]`, and no test covered the case-blind edit exclusion. Out of scope, because only hand-edited YAML reaches them: the exact matching in undo, correct and remove.

+++
