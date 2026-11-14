Work has started. The fix: no wrong-type value shows a raw JavaScript error any more, no hand-typed value is lost on a save, and the seal you see always matches how the negotiation ends.

How each kind of value will behave:

- **A number or true/false where text goes** (`name: 2024`, a motivation `name: 5`, `reason: 42`): shown as text. A save writes it back exactly as typed, so `name: 2024` stays `2024`, not `"2024"`.
- **A list or map with the wrong shape** (`motivations: "foo"`, `pitfalls: {a: 1}`, a blank `-` item, `- Legacy` instead of `- name: Legacy`, `currentArgument: hello`, `motivationsUsed: "Peace"`): the card shows a plain error that names the key, like "Invalid data: 'motivations' field must be a list." Encounter, party and conditions blocks already do this. An error card has no buttons, so nothing can overwrite `- Legacy` or `currentArgument: hello` any more.
- **A fractional or non-number standing**: the seal drawn today is kept, and the ending now follows it. `current_interest: 0.4` shows seal 0 and ends with no deal. `4.5` shows seal 5 and is a deal. `current_patience: banana` shows Patience 0 and gives the final offer.

I decided these myself from the ticket's expected lines. If you want any of them to work differently, say so here.
