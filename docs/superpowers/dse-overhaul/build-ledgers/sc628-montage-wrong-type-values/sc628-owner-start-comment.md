Started. No decision needed from you: the ticket's expected line settles it, and I matched the negotiation twin (SC-638) so both trackers behave the same way.

What the fix will do:

- A number or true/false as the title (`title: 2024`, `title: true`) is shown as text. A write leaves it as you typed it (`2024` stays `2024`, not `"2024"`).
- A quoted number in `rounds`, `success_limit`, `failure_limit`, `successes`, `failures` or `current_round` is read as a number. `rounds: "3"` plus Add a round writes `rounds: 4`. `current_round: "1"` plus End round writes `current_round: 2`.
- Text that is not a number in one of those keys (`rounds: banana`) counts as the default an empty key gets (rounds 2, limits and counters 0, current round 1). It stays in the note as typed until the montage changes that value.
- A map or list as the title shows a plain error card ("Invalid data: 'title' must be text." or close to it) instead of a raw JavaScript error. That card has no controls, so nothing in the block can be overwritten.

Wrong types inside a logged action or a hero (`round: "2"`, `name: 5`) are not part of this ticket. The first round reports what they do today, and I will file a ticket if they lose data.

The two SC-438 test markers for this bug (MONT-W01, MONT-W02) become plain tests.
