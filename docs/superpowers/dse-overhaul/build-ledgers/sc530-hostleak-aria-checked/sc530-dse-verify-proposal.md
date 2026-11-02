# SC-530 — proposed dse-verify SKILL.md edits (for the dispatcher at landing)

Summary: two edits. (1) "Button host-leak sweep" bullet: replace the "Open key gap … SC-530" sentence (now closed) with the SC-530 measurement and mechanism. (2) CURRENT block: new CURRENT for SC-530's landing sha; demote the old CURRENT to PREVIOUS. No freeze change, no widening, no rebaseline, no CHANGELOG (harness-only).

## 1. "Button host-leak sweep" bullet (~line 209)

Replace the sentence
`**Open key gap:** the kind key ignores `aria-checked`, so a selected negotiation tier row shares the idle row's key — **SC-530**.`
with:

> **161 kinds / 966 comparisons, same 34-record boundary, as of SC-530 (`<landing sha>`)**: `tagButtons` appends `|checked` when `aria-checked="true"` (only then — no rule anywhere targets `"false"`/`"mixed"`, so idle radios keep their old key and nothing is renamed), and `|in:track--vertical` (last in the key) for a seal inside `.dse-track--vertical`, whose own-box CSS differs from the horizontal seals' (padding, width, border, colour; the current seal's background and inset ring). Four new kinds, `SC530_EXPECT`: `negotiation|dse-pr__row|checked` (the tier row SC-527's first negotiation section already clicks — no new click or section), `negotiation|dse-track__slot|checked` (the gallery's Patience 3 seal, checked at load), and the vertical idle and checked seals (`negotiation|dse-track__slot|in:track--vertical`, `…|checked|in:track--vertical`). `assertSc530Tagged` (called once, right after `assertSc527Tagged`) FAILs by name for any expected key not tagged (`the sweep tagged no <key> button …`). Only negotiation's radios carry `aria-checked` (48 per scheme); the modal pass has none, and the input and checkbox sweeps have no such blind spot (inputs carry no `aria-checked`; the checkbox sweep drives `checked` / `indeterminate` as states). No capture changes, so no shot or frozen byte moves (592 PNGs identical).

## 2. CURRENT block

New CURRENT (fill the landing sha and the base it landed on):

> **CURRENT — dse `develop` @ `<landing sha>` (2026-11-02; SC-530 landed — the button host-leak sweep also compares a selected negotiation tier row, a checked track seal, and the vertical (Interest) track seals, which used to share a key with an idle row or a horizontal seal and so were never compared; harness-only, no user-visible change, no pixel or frozen-byte change):**
> tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6252 passed / 1 skipped / 249 of 250 suites** · lifecycle **45/45** (three `--only` parts 21 + 16 + 8) · e2e **`OBSIDIAN-E2E done: 124/124 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (161 … 966 …)` (34-record boundary), modal `228`, input `176` (15 kinds), checkbox `116` (7 kinds), prose `106 … [212]` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-530 ticket-owner at `97284051` (on `88cb7db9`; lifecycle and e2e carried from develop `88cb7db9`, whose built `main.js` / `styles.css` are byte-identical to `97284051`); the dispatcher relayed, not re-ran.

Demote the existing CURRENT (whatever it reads at landing — `88cb7db9`, SC-539, if nothing else has landed) to **PREVIOUS**. If develop moved after `88cb7db9`, the jest/lifecycle numbers above must be the post-rebase ones (the owner will update this file).
