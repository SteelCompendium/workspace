Work has started. Nothing is needed from you unless you want one of the two behaviours below to be different.

How each kind of block will behave:

- **A counter block that holds plain text, a list or a number** (`hello`, `- a`, `5`): the card shows a plain error, "Invalid data: the block must be a map of keys." Montage and negotiation blocks already show this exact message. An error card has no − or + button, so nothing can replace the text you typed.
- **An empty counter block** (nothing inside, blank lines, or only a comment): the card shows a working counter at 0 with no name, and no error. It is the same counter a block holding `{}` draws today. The first − or + writes `current_value: 1` into the block.

The second one is my call, so veto it here if you disagree. The other option was a plain error ("Invalid data: the block is empty."), which is what the negotiation does. I chose the working counter because every counter key is optional, and montage and project blocks already draw their default when empty. A negotiation with no data is not usable; a counter with no data is just a counter at 0.

One known limit: a block that holds only a comment loses that comment on the first press. Every block loses its comments on a write today (SC-599), so this is not new.

Not part of this ticket: wrong values inside a normal counter block (`max_value: banana`). The reviewer will probe those, and I will file whatever it finds.

SC-442 (the counter e2e tests) is still in flight and carries the two known-bug markers for this ticket. Whichever lands second turns those markers into plain tests.
