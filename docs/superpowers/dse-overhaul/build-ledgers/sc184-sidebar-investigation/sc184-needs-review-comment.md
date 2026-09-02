**Ask: look at the five screenshots below — if the sidebar now looks and behaves the way you wanted, reply "sc-184 approved" and I'll queue the branch for landing. If anything looks off, name the screenshot.**

## What you're approving

The full fix set from your 2026-08-28 go-ahead ("This sounds fine, we can move forward to see how this goes"), built, independently reviewed, fix-rounded, and re-reviewed to land-ready:

**1. The sidebar explains itself when empty.** The ribbon no longer opens a blank panel — a fresh sidebar says what it's for and how to pin something into it:

{{IMG:sc184-evidence-empty-state.png}}

**2. "Pin to sidebar" now lives in the block's hover menu.** Hover any Draw Steel block in Reading view, and its menu has a pushpin item — no more invisible cursor-gated command (the old commands still work as fallbacks). Before/after of that menu; the only change is the added pushpin icon between the pencil and the collapse chevron:

{{IMG:sc184-chrome-panel-before.png}}

{{IMG:sc184-chrome-panel-after.png}}

**3. Panels have headers and separation.** Each panel shows the element name in plain text, then the source note's name as a clickable link in Obsidian's purple accent color (click jumps to that note); a thin line separates stacked panels:

{{IMG:sc184-evidence-multi-panel.png}}

**4. Panels can finally be removed.** Each sidebar panel's own hover menu has an "Unpin" item (pushpin-with-slash icon), and a broken panel — the card with the red spine and the red "Draw Steel: panel unavailable" heading, failure spelled out in plain text — gets a dismiss button (the ✕ at the card's top-right):

{{IMG:sc184-evidence-note-not-found.png}}

**5. Pinned panels survive restart properly, and failures are audible.** The layout is saved on every add/remove; the dead `collapsed` field is gone from `workspace.json` (old saved data migrates cleanly); a pin that can't find its block now posts a Notice instead of silently doing nothing.

**Docs shipped with it:** the sidebar is now pitched as "a GM dashboard assembled from blocks that live in different notes", and the pinned-note pattern you asked about is documented right next to it ("running everything out of one note? Open that note in the right sidebar and pin the tab").

**Your embed test mattered:** the code never actually excluded embeds — the "embeds are read-only" claims were stale comments that outran what was ever implemented. They're corrected, and no doc claims embeds are read-only.

**Approve** = the dispatcher lands the branch to `draw-steel-elements` `develop`. No deploy, no tag, no release — those stay yours. **Notes/decline** = another round.

---

Mechanics, below the ask:

- Branch `sc184-sidebar-investigation` @ `51ba4e8`, based on current `origin/develop` (`1619396`). Plus one workspace CHANGELOG bullet in the superproject.
- Pipeline: implementer → independent review (blocked on vacuous tests, a docs-image mismatch, and a silent pin-failure path) → fix round → scoped re-review → **LAND-READY**. 40+ runtime probes incl. write-integrity: prose above/below a pinned fence is byte-preserved, exactly one anchor stamp, re-pin is idempotent (no SC-153 regression), `ds-scc` blocks survive pinning uncorrupted (no SC-158 regression).
- Gates (measured at `44158f7`; the last commit `51ba4e8` is prose-only and re-gated on tsc/lint/jest): tsc clean · lint clean · jest 3417 passed / 1 skipped / 190 suites · shots 474 PNGs 0 FAIL · freeze 210/210, 0 mismatches — **zero frozen print bytes moved, no rebaseline needed** · parity 0 GAPs / 0 undeclared / 16 DECLARED · obsidian-shots 59/59.
- Deferred to Backlog (filed, all linking here): SC-281 panel reorder, SC-282 note rename/delete listeners, SC-283 session-key unification; review residuals SC-288 (degraded panel can miss recovery via an update fast path — pre-existing), SC-289 (pin is silent if no right sidebar leaf can open — rare), SC-290 (write-back drops a fence's extra info string — long-standing, not from this round).
