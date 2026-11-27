### LOW-1: stale family counts and one false comment
- `AGENTS.md:74` still says "the eleven display elements" and lists 11 aliases. Fourteen lines later (`:88`), R1's text says "a twelfth". The same file contradicts itself.
- `.repo-docs/integration.md:129` says "the 11 internal `displayFamily()`/`genericCard()` definitions". It is 12 now. `withReference` wraps prose too.
- `.repo-docs/architecture.md:192` says "the eleven D6 reference cards". The owner already ruled to fold this into the next round.
- `src/elements/display/index.ts:173` says "eleven display fixtures". The harness now mounts twelve.
- `src/elements/project/view.ts:95` says "No adapter exists for the `project` SCC type (typeAdapters.ts)". **This is now false.** Behaviour is unaffected because `resolveGoal` reads `entity.body()`, not `.model()`. But the comment's reasoning will mislead whoever builds SC-704.
- Failure scenario: none at runtime. The risk is that an agent trusts the router or the comment.
- Fix: change eleven to twelve (or drop the counts) in the four places. Reword `project/view.ts:95` to: "the `project` type resolves to the internal prose family (SC-391), whose model is a `GenericNote`; this reads the body directly".

### LOW-2: title-only (empty) chapter card keeps an empty strip under the head
- Seen in `visual-harness/shots/prose-chapter-empty--steel-{dark,light}.png`. The head's bottom divider is drawn, then about 35 CSS px of empty card padding follows.
- Failure scenario: it reads as "a body that failed to load" rather than a deliberate title-only card. It affects 2 entries: `the-summoner-class` and `the-beastheart-class`.
- The cause is the shared card shell (`DisplayCardView` with zero bands), not prose code.
- Fix: owner's call. Either accept it as is (2 entries; mention to Scott next to the `monsters.md` link-only card), or suppress the head divider and bottom padding when a composition yields zero bands. If you change it, rerun shots and freeze to prove no frozen fixture has zero bands.

### LOW-3: `firstParagraph` (`src/elements/display/prose.ts:69-75`) is a blank-line splitter, not a markdown parser
- It splits on `\n\s*\n` and skips blocks that start with `#`, `|`, `>`, a list marker, a fence or `<`. Three cases slip through:
  - A setext heading (`Title\n=====`) is returned as the "paragraph".
  - A fenced block that contains a blank line is split, and its second half can be returned as a paragraph.
  - A paragraph that starts with inline HTML is skipped.
- Measured: none of these occur today. All 24 non-empty chapters give a correct first paragraph (list in §Probes).
- Fix: optional. Either note the limits in the doc comment, or skip blocks that sit inside an open fence (track fence state) and treat a block whose second line is `=+`/`-+` as a heading. A one-line test for the fence case would pin it.

### INFO-1: two chapters' "first paragraph" is a fiction epigraph, not a summary
