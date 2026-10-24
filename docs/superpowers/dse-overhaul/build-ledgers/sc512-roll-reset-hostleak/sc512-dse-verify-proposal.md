# SC-512 — proposed dse-verify SKILL.md edits (for the dispatcher at landing)

Summary: two edits. (1) "Button host-leak sweep" bullet: append the SC-512 measurement and the `galleryExtra=roll` note. (2) CURRENT block: new CURRENT for SC-512's landing sha; demote the old one to PREVIOUS. No freeze change, no widening.

## 1. "Button host-leak sweep" bullet (~line 206)

After the sentence ending `…2× hover no hit point (\`initiative|dse-btn.dse-init__stamina\`, ×2).` insert:

> **114 kinds / 684 comparisons, same 12-record boundary, as of SC-512 (`<landing sha>`)** — that is the 113 measured at `c2758a2` (and unchanged through `253aa5f`) plus one kind; it only coincides with the stale SC-338 figure above, it is not a return to it. The one new kind is the ENABLED roll Reset, `roll|dse-btn.dse-btn--ghost.dse-rollbar__reset` (the disabled `…|disabled` kind is still compared). Reset is disabled while a strip sits at its authored values (`rollBar.ts:263`), so the button sweep's URL alone adds `galleryExtra=roll`: `entry.ts` appends a second roll strip (`data-dse-harness-extra="roll"`), and the sweep real-clicks its Edges "+" on every dark/light load after opening Modifiers. It FAILs if that strip does not end with exactly one enabled, boxed Reset, if the first strip's Reset is not still disabled, or if the enabled key was not tagged. No capture ever sends `galleryExtra`, so no shot or frozen byte moves.

## 2. CURRENT block

New CURRENT (fill shas at landing):

> **CURRENT — dse `develop` @ `<landing sha>` (2026-10-24; SC-512 landed — the button host-leak sweep also compares the roll strip's Reset while it is enabled, via a sweep-only second roll strip (`galleryExtra=roll`); harness-only, no user-visible change, no pixel or frozen-byte change):**
> tsc (incl. `tsc -p e2e`) and lint (incl. `e2e/`) clean · jest **6078 passed / 1 skipped / 245 of 246 suites** · lifecycle **38/38** · e2e **`OBSIDIAN-E2E done: 123/123 ok, 0 failed, 0 known-bug, coverage: 87/87 pairs`** · shots **592**, 0 FAIL, with `button host-leak OK (114 … 684 …)` (12-record boundary unchanged), modal `228`, input `164`, checkbox `60` · freeze **`freeze OK (280/280 …)`** (no rebaseline) · parity **0 GAPs / 0 undeclared / 24 DECLARED**. Numbers as reported by the SC-512 ticket-owner at `f89f69f` (on `253aa5f`); the dispatcher relayed, not re-ran.

Demote the existing CURRENT (now 253aa5f / SC-519, or whatever is CURRENT at landing) to PREVIOUS.
