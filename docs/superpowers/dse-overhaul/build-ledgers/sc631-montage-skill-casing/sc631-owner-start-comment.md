Typing "nature" (or " NATURE ") for a hero who already used "Nature" will show the reuse warning. I'm not asking you anything; the ticket already says what to expect.

The rule is the one SC-627 uses for hero names: spaces at either end and capital letters are ignored. The warning names the skill the way the board already shows it: "Kira already used Nature in this montage — reuse is not allowed".

The warning still never blocks Log, and the skill is still saved as typed.

Work is under way: the fix goes in `wouldReuseSkill` (`src/elements/montage/model.ts`). The SC-438 jsdom marker K04 becomes a plain test, and one new e2e test (MONT-L12) covers it in real Obsidian.
