# SC-543 — proposed dse-verify text (for the dispatcher to apply; the owner did not edit SKILL.md)

**Where:** `.claude/skills/dse-verify/SKILL.md`, battery row 4 (Lifecycle), immediately after the
sentence that ends "…hold back Obsidian's redraw at a hook instead (e.g. wait for `setViewData`,
act, then release), as G-S18 phase (d) does." — i.e. as a second lifecycle/probe authoring rule.

**Text to insert:**

> **Live Preview probe rule (SC-543, 2026-11-02):** never count `.cm-embed-block` (or DSE roots)
> in the editor DOM to decide how many blocks Live Preview drew. CodeMirror 6 keeps only blocks
> near the visible area in the DOM (the viewport plus roughly 500 px above and below), so in a
> note with two ~1500 px cards a count at the top or the bottom reads 1 while both are drawn
> (SC-536 r3 INFO-4 misread this as a missing card; filed as SC-543, closed not-a-bug). Scroll
> each block into view and check its own widget there, or read the editor's decorations.

No CURRENT-block change: SC-543 changed no code and moves no number.
