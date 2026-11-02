A reference that points back to itself now stops after one level and shows a single "Reference loop" card. It no longer nests cards forever. A note open in two panes no longer shows a false "Reference nesting too deep". This is ready to land. Nothing is needed from you.

**Bug 1, the reference loop.** `Cyc.md` holds a feature whose effect references `@Cyc.md`. A note with a `@Cyc.md` block now shows the Cycle Strike card once, with one error card inside it:

{{IMG:sc536-r3-shot-cycle-head.png}}

Before the fix, the same note kept nesting: 137 levels in 20 seconds and no error card.

**Bug 2, the false error in a second pane.** The same `@Ref.md` note in two panes, after turning the plugin off and on.

Before the fix, the right pane showed "Reference nesting too deep … already resolving in this block":

{{IMG:sc536-r3-shot-twopanes-base.png}}

Now both panes show the Ref Strike card:

{{IMG:sc536-r3-shot-twopanes-head.png}}

**What changed.** The guard used to decide "is this a loop?" by block identity. That was wrong both ways. A nested card in Obsidian gets a new identity, so a real loop was never caught. Two live copies of one block share an identity, so they looked like a loop. The guard now walks up the page from the card. It refuses a reference only when a card it sits inside already shows the same file. As a backstop, it stops at 5 references inside one another, with the card "Reference nesting too deep: more than 5 references inside one another."

Two spellings of the same file count as the same reference, for example `[[Cyc]]` and `@Cyc.md`, or an SCC code and the path of its file.

**Checked in real Obsidian.** Each loop variant stops after 2–3 lookups with one loop card: self-reference, alias, A→B→A, Live Preview, and a card pinned to the sidebar. A chain of 7 different files shows 5 cards and then the depth card. The two-pane cases showed no false error in 0 of 5 and 0 of 3 natural runs and in every held-timing run. Two identical blocks in one note (SC-481's case) still both render.

**Filed from the review (Backlog):**
- SC-541: pinning a reference-only feature block to the sidebar writes an anchor line into the block and breaks it. This happens on develop too.
- SC-542: an error card two cards deep in the sidebar wraps its message one letter per line.

---
Mechanics:
- Plugin `draw-steel-elements` branch `sc536-ref-cycle-guard` @ `fb24f8a2` on develop `f81a277`. Superproject worktree @ `5325f33b` has the CHANGELOG bullet; the pointer bump is unstaged, so landing does it.
- Code: `src/elements/shared/RefUnwrapView.ts`. The in-flight map and `ElementView.isUnloaded()` are gone. The SC-525 stale-write protection (`resolveGen`) is kept as is. `ReadingModeBlockHost.ts` is untouched.
- New lifecycle G-S56. It fails all 6 phases on develop's code and passes on the branch.
- Gates: tsc/lint clean · jest 6228 passed / 1 skipped · lifecycle 44/44 · e2e 124/124, coverage 87/87 · shots 592, 0 FAIL · freeze 280/280 · parity 0/0/24.
- Review: independent reviewer, 0 HIGH / 0 MEDIUM; 10 of 12 mutants turn tests red, and the 2 survivors cannot change behaviour.
