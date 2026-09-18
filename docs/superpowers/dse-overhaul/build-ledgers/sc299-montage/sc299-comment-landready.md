Both refinements are in; the plugin behaviour is final and independently reviewed (one small harness-only test-gate fix round is finishing, then I report land-ready): every empty cell of the round in play now carries three one-tap buttons (check = success, x = failure, ringed plus = assist), and an empty cell from an earlier round can be clicked to log a test you forgot to record.

**Please confirm two scoping calls I made without you** (both reversible in a small fix round):

1. The one-tap buttons log the result with **no skill and no note**. Clicking the cell itself (outside the three buttons), or Log an action…, still opens the full sheet when you want the skill or a note. This is the mock's own behaviour from SC-191 rounds 4-6.
2. Empty cells in **earlier** rounds open the sheet (pre-filled to that hero and round); empty cells in **future** rounds and on a finished montage stay inert. The ticket said "previous rounds", so I did not open future rounds.

**What it looks like** (dark scheme, mid-montage fixture — round 3 is in play; the three small square buttons sit above the "TO ACT" caption in every round-3 cell):

{{IMG:sc299-r2-montage-mid--steel-dark.png}}

An empty earlier-round cell keeps its "— NO ACTION" face and gains a faint plus mark at its top-left on hover/focus (the same place the pencil mark sits on a recorded cell):

{{IMG:sc299-r1-montage-past-empty-cell-hover--steel-dark.png}}

On a touch screen (Obsidian mobile) the three buttons grow to the 44px touch size and wrap onto two rows inside their cell instead of spilling into the neighbouring one — the review caught a version where a tap on a recorded round-2 cell would have silently logged a round-3 success; a real-Chromium touch gate in the shots battery now guards it.

Print is unchanged — the buttons do not print; the frozen print shots are byte-identical (260/260, no rebaseline).

---

Mechanics: dse branch `sc299-montage` @ `b2e40d1` (rebased on `origin/develop` `5a5ed49`), workspace `f229603` (on `origin/main` `8685b65`). Gates: tsc/lint clean; jest 3902 passed / 1 skipped / 202 suites; freeze 260/260; parity 0 GAPs / 0 undeclared / 16 DECLARED. Independent review: two full passes + two scoped re-reviews (Opus), 0 open findings against plugin code; the remaining two are in the new shots-battery gate itself and are being fixed now. Docs: `docs/gm-trackers.md` and both CHANGELOGs updated. Ledger: `.superpowers/sdd/sc299-montage/`.
